import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 임시 디버그 엔드포인트 — 데이터 안 뜨는 문제 진단
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  // 일반 클라이언트 (RLS 적용)
  const { data: userCases, error: userErr } = await supabase
    .from('cases').select('id, status, user_id').eq('user_id', user.id)

  // 어드민 클라이언트 (RLS 우회)
  const adminClient = createAdminClient()
  const { data: allCases, error: adminErr } = await adminClient
    .from('cases').select('id, status, user_id').eq('user_id', user.id)

  return NextResponse.json({
    userId: user.id,
    rls_result: { count: userCases?.length ?? 0, error: userErr?.message ?? null },
    admin_result: { count: allCases?.length ?? 0, data: allCases, error: adminErr?.message ?? null },
  })
}
