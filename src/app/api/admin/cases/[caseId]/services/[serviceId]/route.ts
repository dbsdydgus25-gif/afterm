import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/admin/cases/[caseId]/services/[serviceId] — 서비스 상태 수동 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; serviceId: string }> }
) {
  const { caseId, serviceId } = await params
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, status_note } = body

    const validStatuses = ['pending', 'dispatched', 'received', 'done', 'failed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { status, status_note }
    if (status === 'done') updateData.completed_at = new Date().toISOString()

    const { data, error } = await adminClient
      .from('case_services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error

    // 모든 서비스가 완료되면 케이스 상태도 completed로 업데이트
    const { data: allServices } = await adminClient
      .from('case_services')
      .select('status')
      .eq('case_id', caseId)

    if (allServices && allServices.every(s => s.status === 'done' || s.status === 'failed')) {
      await adminClient.from('cases').update({ status: 'completed' }).eq('id', caseId)
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
