import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, name, email, phone')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
