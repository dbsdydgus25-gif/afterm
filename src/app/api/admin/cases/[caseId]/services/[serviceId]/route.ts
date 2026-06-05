import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; serviceId: string }> }
) {
  // admin_session 쿠키로 인증
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { caseId, serviceId } = await params
  const body = await request.json()
  const { status, status_note } = body

  const validStatuses = ['pending', 'dispatched', 'received', 'done', 'failed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const updateData: Record<string, unknown> = { status, status_note }
  if (status === 'done') updateData.completed_at = new Date().toISOString()
  if (status === 'dispatched') updateData.dispatched_at = new Date().toISOString()

  const { data, error } = await adminClient
    .from('case_services')
    .update(updateData)
    .eq('id', serviceId)
    .select('*, cases(user_id, deceased_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 모든 서비스 완료 시 케이스 상태도 completed로
  const { data: allServices } = await adminClient
    .from('case_services')
    .select('status')
    .eq('case_id', caseId)

  if (allServices && allServices.every(s => s.status === 'done' || s.status === 'failed')) {
    await adminClient.from('cases').update({ status: 'completed' }).eq('id', caseId)
  }

  // 유저에게 알림 메시지 (support_messages로 자동 알림)
  const caseData = (data as any)?.cases
  if (caseData?.user_id) {
    const STATUS_MSG: Record<string, string> = {
      dispatched: `📨 [${data.service_name}] 해지 요청서를 발송했습니다. 기업 접수 후 안내드릴게요.`,
      received:   `✅ [${data.service_name}] 기업에서 신청을 접수했습니다. 처리 중입니다.`,
      done:       `🎉 [${data.service_name}] 처리가 완료되었습니다!`,
      failed:     `⚠️ [${data.service_name}] 처리 중 문제가 발생했습니다. 상담팀에서 연락드릴게요.`,
    }
    const msg = STATUS_MSG[status]
    if (msg) {
      await adminClient
        .from('support_messages')
        .insert({ user_id: caseData.user_id, message: msg, is_admin: true })
    }
  }

  return NextResponse.json({ success: true, data })
}
