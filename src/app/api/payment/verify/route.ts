import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakao } from '@/lib/kakao/sendKakao'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  const { paymentId, caseId } = await req.json()

  if (!paymentId || !caseId) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  try {
    const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${process.env.PORTONE_API_SECRET}` },
    })

    if (!portoneRes.ok) {
      return NextResponse.json({ error: '결제 조회 실패' }, { status: 400 })
    }

    const payment = await portoneRes.json()

    if (payment.status !== 'PAID') {
      return NextResponse.json({ error: `결제 미완료: ${payment.status}` }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 케이스 + 유저 정보 조회
    const { data: caseData } = await adminClient
      .from('cases')
      .select('*, case_services(*), delegations(*)')
      .eq('id', caseId)
      .single()

    await adminClient.from('cases').update({
      payment_status: 'paid',
      payment_id: paymentId,
      paid_amount: payment.amount.total,
      paid_at: new Date().toISOString(),
    }).eq('id', caseId)

    // 결제 완료 알림톡 발송 (fire-and-forget)
    if (caseData) {
      const { data: { user } } = await adminClient.auth.admin.getUserById(caseData.user_id)
      const userPhone = caseData.delegator_phone || caseData.delegations?.[0]?.delegator_phone || user?.phone || user?.user_metadata?.phone || ''
      const userName = caseData.delegations?.[0]?.delegator_name || user?.user_metadata?.full_name || '고객'
      const services = (caseData.case_services || []).map((s: any) => s.service_name).join(', ')

      const notifyPayload = {
        caseId,
        type: 'payment' as const,
        requesterName: userName,
        deceasedName: caseData.deceased_name,
        services,
        amount: payment.amount.total.toLocaleString(),
      }

      // 신청접수 + 결제완료 동시 발송
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr'
      await Promise.allSettled([
        userPhone
          ? sendKakao({ phone: userPhone, ...notifyPayload })
          : Promise.resolve(),
        userPhone
          ? sendKakao({ phone: userPhone, ...notifyPayload, type: 'submitted' })
          : Promise.resolve(),
        fetch(`${siteUrl}/api/notify/email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toEmail: user?.email, ...notifyPayload }),
        }),
      ])
    }

    // 구글 시트 저장 (직접 인라인 — self-fetch 금지)
    if (caseData) {
      try {
        const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        const sheetId = process.env.GOOGLE_SHEET_ID
        if (credentialsJson && sheetId) {
          const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(credentialsJson),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          })
          const sheets = google.sheets({ version: 'v4', auth })
          const delegation = caseData.delegations?.[0] || {}
          const submittedAt = new Date().toISOString()

          const rows = (caseData.case_services || []).map((svc: any) => {
            const accountInfo = svc.account_id || svc.contact_info || ''
            const trackRaw = svc.dispatch_type || svc.service_category
            const trackLabel = trackRaw === 'memorialize' || trackRaw === '추모계정' ? '추모계정' : '계정삭제'
            const serviceId = (svc.service_name || '').toLowerCase()
            return [
              submittedAt,
              caseId.slice(0, 8),
              caseData.deceased_name || '',
              caseData.deceased_birth || '',
              caseData.deceased_death || '',
              caseData.deceased_phone || '',
              delegation.delegator_name || '',
              delegation.delegator_relation || '',
              svc.service_name || '',
              trackLabel,
              (serviceId.includes('instagram') || serviceId.includes('kakao')) && trackRaw !== 'memorialize' ? '직접신청필요' : '에프텀대행',
              accountInfo,
              '',
              delegation.delegator_phone || '',
              '',
              '',
              payment.amount.total ? Number(payment.amount.total).toLocaleString() + '원' : '',
              paymentId || '',
              '', '', '',
            ]
          })

          const existing = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'A1:A1' })
          if (!existing.data.values?.length) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: sheetId, range: 'A1:U1', valueInputOption: 'RAW',
              requestBody: { values: [['접수일시','케이스ID','고인성명','고인생년월일','고인사망일','고인전화번호','신청인성명','고인과의관계','플랫폼','트랙(삭제/추모)','대행가능여부','계정ID/이메일/전화','프로필URL','신청인연락처','통신사','환불계좌','결제금액','PG결제ID','처리상태','처리완료일','메모']] },
            })
          }
          await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId, range: 'A:U',
            valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS',
            requestBody: { values: rows },
          })
          console.log(`[sheets] ${rows.length}개 행 저장 완료 — ${caseId.slice(0, 8)}`)
        }
      } catch (e) {
        console.error('[sheets] 저장 실패:', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[payment/verify]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
