import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /auth/signout — 로그아웃 처리
export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  return NextResponse.redirect(`${origin}/`, { status: 302 })
}

