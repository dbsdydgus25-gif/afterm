import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendKakao } from '@/lib/kakao/sendKakao'

export async function POST(req: NextRequest) {
  const { caseId, reason = '관리자 환불 처리' } = await req.json()

  if (!caseId) {
    return NextResponse.json({ error: 'caseId 필요' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: caseData } = await adminClient
    .from('cases')
    .select('*, case_services(*), delegations(*)')
    .eq('id', caseId)
    .single()

  if (!caseData?.payment_id) {
    return NextResponse.json({ error: '결제 정보 없음' }, { status: 400 })
  }

  if (caseData.payment_status === 'refunded') {
    return NextResponse.json({ error: '이미 환불된 건입니다' }, { status: 400 })
  }

  try {
    const refundRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(caseData.payment_id)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, amount: caseData.paid_amount }),
    })

    const refundData = await refundRes.json()

    if (!refundRes.ok) {
      console.error('[refund] 포트원 오류:', refundData)
      return NextResponse.json({ error: refundData.message || '환불 실패' }, { status: 400 })
    }

    await adminClient.from('cases').update({
      payment_status: 'refunded',
      refunded_at: new Date().toISOString(),
    }).eq('id', caseId)

    // 환불 완료 알림톡 발송
    const { data: { user } } = await adminClient.auth.admin.getUserById(caseData.user_id)
    const userPhone = caseData.delegator_phone || caseData.delegations?.[0]?.delegator_phone || user?.phone || user?.user_metadata?.phone || ''
    const userName = caseData.delegations?.[0]?.delegator_name || user?.user_metadata?.full_name || '고객'

    const notifyPayload = {
      caseId,
      type: 'refund' as const,
      requesterName: userName,
      deceasedName: caseData.deceased_name,
      amount: caseData.paid_amount?.toLocaleString(),
      refundReason: reason,
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr'
    await Promise.allSettled([
      userPhone
        ? sendKakao({ phone: userPhone, ...notifyPayload })
        : Promise.resolve(),
      fetch(`${siteUrl}/api/notify/email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: user?.email, ...notifyPayload }),
      }),
    ])

    return NextResponse.json({ success: true, refund: refundData })
  } catch (e: any) {
    console.error('[refund]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
