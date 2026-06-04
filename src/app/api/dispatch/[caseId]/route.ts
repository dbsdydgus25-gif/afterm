import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage } from '@/lib/solapi/client'

// POST /api/dispatch/[caseId]
// 신청 접수 완료 시 에프텀 내부 알림(카카오 채널 또는 SMS)을 발송합니다.
// ⚠️ 이전의 이메일 발송 방식은 제거되었습니다.
// 외부 기업에 발송하는 기능은 어드민이 수동으로 처리합니다.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 케이스 데이터 조회
    const { data: caseData } = await adminClient
      .from('cases')
      .select(`*, case_services(*), delegations(*)`)
      .eq('id', caseId)
      .single()

    if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    if (caseData.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const services = caseData.case_services || []
    const delegatorName = caseData.delegations?.[0]?.delegator_name || '신청인'
    const serviceNames = services.map((s: any) => s.service_name).join(', ')
    const adminPhone = process.env.ADMIN_PHONE || process.env.SOLAPI_SENDER_NUMBER || '01063816440'

    // ── 에프텀 내부 알림 SMS 발송 ──
    // 새 신청이 들어왔음을 관리자에게 알림
    const alertText = `[에프텀 신청 접수]\n신청인: ${delegatorName}\n고인: ${caseData.deceased_name}\n서비스: ${serviceNames}\n신청 ID: ${caseId.slice(0, 8)}\n\n어드민 콘솔에서 확인해주세요.`

    const notifyResult = await sendMessage({
      to: adminPhone,
      text: alertText,
      type: 'SMS',
    })

    if (!notifyResult.success) {
      console.error('[dispatch] 내부 알림 발송 실패:', notifyResult.error)
      // 알림 실패해도 신청은 완료됨 — 에러 반환 안 함
    } else {
      console.log('[dispatch] 내부 알림 발송 성공')
    }

    // 발송 이력 기록 (관리자 알림)
    try {
      await adminClient.from('dispatch_logs').insert({
        case_service_id: services[0]?.id || null,
        dispatch_type: 'sms_internal',
        recipient: adminPhone,
        status: notifyResult.success ? 'success' : 'failed',
        response_body: notifyResult.success ? '내부 알림 SMS 발송 성공' : `실패: ${notifyResult.error}`,
      })
    } catch (e) {
      console.error('[dispatch] 로그 기록 실패:', e)
    }

    return NextResponse.json({
      success: true,
      message: '접수 알림이 발송되었습니다.',
      notified: notifyResult.success,
    })

  } catch (err: any) {
    console.error('[dispatch] 오류:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
