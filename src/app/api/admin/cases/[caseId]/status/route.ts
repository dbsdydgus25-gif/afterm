import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_TRANSITIONS: Record<string, string> = {
  submitted: 'reviewing',   // 서류 확인 완료
  reviewing: 'processing',  // 처리 시작
  processing: 'completed',  // 처리 완료
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  // 어드민 쿠키 인증
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && session?.value !== 'authorized') {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { caseId } = await params
  const { status } = await req.json()

  if (!status) {
    return NextResponse.json({ error: '상태값 필요' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // 현재 상태 확인
  const { data: current } = await adminClient
    .from('cases')
    .select('status')
    .eq('id', caseId)
    .single()

  if (!current) {
    return NextResponse.json({ error: '케이스 없음' }, { status: 404 })
  }

  // 유효한 전환인지 확인 (강제 지정도 허용)
  const { error } = await adminClient
    .from('cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', caseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status })
}
