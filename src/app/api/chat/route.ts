import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // 어드민용 파라미터가 있으면 해당 유저 조회, 아니면 본인 조회
  const targetUserId = searchParams.get('userId') || user.id

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, targetUserId, isAdmin } = await req.json()
  
  // 관리자가 보내는 경우 isAdmin=true, targetUserId=상대방
  // 사용자가 보내는 경우 isAdmin=false, targetUserId=user.id
  const insertUserId = isAdmin ? targetUserId : user.id

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        user_id: insertUserId,
        message,
        is_admin: isAdmin || false
      }
    ])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
