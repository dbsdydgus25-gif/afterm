import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // 신규 유저 판단: created_at과 last_sign_in_at이 5초 이내면 신규
      const created = new Date(data.user.created_at).getTime()
      const lastSignIn = new Date(data.user.last_sign_in_at ?? data.user.created_at).getTime()
      const isNew = Math.abs(lastSignIn - created) < 5000

      // 신규 유저 → 온보딩, 기존 유저 → next
      const dest = isNew ? `/onboarding?next=${next}` : next
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
