import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakao } from '@/lib/kakao/sendKakao'

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

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[payment/verify]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
