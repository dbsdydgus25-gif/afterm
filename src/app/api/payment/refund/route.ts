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

  if (caseData.payment_status === 'refunded') {
    return NextResponse.json({ error: '이미 환불된 건입니다' }, { status: 400 })
  }

  if (caseData.status === 'completed') {
    return NextResponse.json({ error: '처리 완료된 건은 환불이 불가합니다' }, { status: 400 })
  }

  // 상태별 환불 금액 계산
  const totalAmount = Number(caseData.paid_amount) || 0

  // 0원 결제(테스트/무료)는 포트원 호출 없이 바로 취소
  if (totalAmount === 0 || !caseData.payment_id) {
    await adminClient.from('cases').update({
      payment_status: 'refunded',
      status: 'cancelled',
      refunded_at: new Date().toISOString(),
      refunded_amount: 0,
    }).eq('id', caseId)
    return NextResponse.json({ success: true, refund: { message: '0원 취소 처리 완료' } })
  }
  const services = caseData.case_services || []
  const totalSvc = services.length
  const doneSvc = services.filter((s: any) => s.status === 'done').length

  let refundAmount = totalAmount
  let refundNote = '전액 환불'

  if (caseData.status === 'processing' && totalSvc > 0 && doneSvc > 0) {
    // 처리 중: 완료된 서비스 비율만큼 공제
    const refundRatio = (totalSvc - doneSvc) / totalSvc
    refundAmount = Math.floor(totalAmount * refundRatio / 100) * 100 // 100원 단위 절사
    refundNote = `부분 환불 (완료 ${doneSvc}/${totalSvc}건 공제)`
  }

  try {
    const refundRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(caseData.payment_id)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: `${reason} (${refundNote})`, amount: refundAmount }),
    })

    const refundData = await refundRes.json()

    if (!refundRes.ok) {
      console.error('[refund] 포트원 오류:', refundData)
      return NextResponse.json({ error: refundData.message || '환불 실패' }, { status: 400 })
    }

    await adminClient.from('cases').update({
      payment_status: 'refunded',
      status: 'cancelled',
      refunded_at: new Date().toISOString(),
      refunded_amount: refundAmount,
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
