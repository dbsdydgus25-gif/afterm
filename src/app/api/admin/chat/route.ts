import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  return session?.value === 'authorized'
}

// GET: 모든 유저의 메시지 (유저별 그룹)
export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('support_messages')
    .select('id, user_id, message, is_admin, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: 어드민이 특정 유저에게 답장
export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { user_id, message } = await req.json()
  if (!user_id || !message?.trim()) return NextResponse.json({ error: '필수값 누락' }, { status: 400 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('support_messages')
    .insert([{ user_id, message: message.trim(), is_admin: true }])
    .select('id, user_id, message, is_admin, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
