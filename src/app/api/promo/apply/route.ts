// 프로모 코드로 0원 결제 처리 (포트원 스킵)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakao } from '@/lib/kakao/sendKakao'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  const { code, caseId } = await req.json()
  if (!code || !caseId) return NextResponse.json({ error: '필수값 누락' }, { status: 400 })

  const admin = createAdminClient()

  // 코드 재검증
  const { data: promo } = await admin
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!promo || !promo.is_active || promo.used_count >= promo.max_uses)
    return NextResponse.json({ error: '유효하지 않은 코드입니다' }, { status: 400 })
  if (promo.expires_at && new Date(promo.expires_at) < new Date())
    return NextResponse.json({ error: '만료된 코드입니다' }, { status: 400 })

  // 이미 사용됐는지 확인
  const { data: alreadyUsed } = await admin
    .from('promo_code_uses')
    .select('id').eq('case_id', caseId).limit(1).single()
  if (alreadyUsed) return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 400 })

  // 케이스 조회
  const { data: caseData } = await admin
    .from('cases')
    .select('*, case_services(*), delegations(*)')
    .eq('id', caseId)
    .single()
  if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  const promoPaymentId = `promo-${code.toUpperCase()}-${caseId.slice(0, 8)}`

  await Promise.allSettled([
    // 케이스 결제 완료 처리
    admin.from('cases').update({
      payment_status: 'paid',
      payment_id: promoPaymentId,
      paid_amount: 0,
      paid_at: new Date().toISOString(),
      status: 'submitted',
    }).eq('id', caseId),

    // 코드 사용 카운트 증가
    admin.from('promo_codes')
      .update({ used_count: promo.used_count + 1 })
      .eq('code', code.trim().toUpperCase()),

    // 사용 기록 저장
    admin.from('promo_code_uses').insert({
      code: code.trim().toUpperCase(),
      case_id: caseId,
    }),
  ])

  // 알림 발송 (fire-and-forget)
  try {
    const [{ data: delegationFresh }, { data: profile }, { data: { user } }] = await Promise.all([
      admin.from('delegations').select('*').eq('case_id', caseId).single(),
      admin.from('profiles').select('name, phone').eq('id', caseData.user_id).single(),
      admin.auth.admin.getUserById(caseData.user_id),
    ])
    const userPhone = delegationFresh?.delegator_phone || profile?.phone || user?.phone || ''
    const userName = delegationFresh?.delegator_name || profile?.name || '고객'
    const services = (caseData.case_services || []).map((s: any) => s.service_name).join(', ')

    if (userPhone) {
      await Promise.allSettled([
        sendKakao({ phone: userPhone, caseId, type: 'submitted', requesterName: userName, deceasedName: caseData.deceased_name, services, amount: '0' }),
        sendKakao({ phone: userPhone, caseId, type: 'payment', requesterName: userName, deceasedName: caseData.deceased_name, services, amount: '0' }),
      ])
    }

    // 구글 시트 저장
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (credentialsJson && sheetId) {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentialsJson),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      const sheets = google.sheets({ version: 'v4', auth })
      const delegation = delegationFresh || {}
      const submittedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })

      const rows = (caseData.case_services || []).map((svc: any) => {
        const trackRaw = svc.dispatch_type || svc.service_category
        const trackLabel = trackRaw === 'memorialize' || trackRaw === '추모계정' ? '추모계정' : '계정삭제'
        return [
          submittedAt, caseId.slice(0, 8), caseData.deceased_name || '',
          caseData.deceased_birth || '', caseData.deceased_death || '', caseData.deceased_phone || '',
          (delegation as any).delegator_name || profile?.name || '',
          (delegation as any).delegator_relation || '',
          svc.service_name || '', trackLabel, '에프텀대행',
          svc.account_id || '',
          '', (delegation as any).delegator_phone || profile?.phone || '',
          '', '', `무료(${code})`, promoPaymentId, '', '', '',
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
    }
  } catch (e) {
    console.error('[promo/apply] 알림/시트 실패:', e)
  }

  return NextResponse.json({ success: true })
}
