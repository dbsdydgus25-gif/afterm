import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId 필요' }, { status: 400 })

  const adminClient = createAdminClient()

  const [caseRes, servicesRes, delegationRes] = await Promise.all([
    adminClient.from('cases').select('deceased_name, delegator_phone').eq('id', caseId).single(),
    adminClient.from('case_services').select('id').eq('case_id', caseId),
    adminClient.from('delegations').select('delegator_name').eq('case_id', caseId).maybeSingle(),
  ])

  if (caseRes.error) {
    console.error('[case-summary] cases 조회 오류:', caseRes.error)
    return NextResponse.json({ error: '케이스 없음' }, { status: 404 })
  }

  return NextResponse.json({
    deceased_name: caseRes.data?.deceased_name || '',
    delegator_phone: caseRes.data?.delegator_phone || '',
    delegator_name: delegationRes.data?.delegator_name || '',
    service_count: servicesRes.data?.length || 0,
  })
}
