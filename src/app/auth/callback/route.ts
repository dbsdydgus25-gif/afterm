import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // 최종 redirect response 먼저 생성 — 여기에 쿠키를 직접 씀
  const onboardingCheckResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // redirect response에 직접 쿠키 설정 — 브라우저에 전달됨
          cookiesToSet.forEach(({ name, value, options }) => {
            onboardingCheckResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const onboardingDone = data.user.user_metadata?.onboarding_done === true

  if (!onboardingDone) {
    // 온보딩 미완료 → 온보딩 페이지로, 쿠키 복사해서 전달
    const onboardingResponse = NextResponse.redirect(`${origin}/onboarding?next=${next}`)
    onboardingCheckResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      onboardingResponse.cookies.set(name, value, options as any)
    })
    return onboardingResponse
  }

  // 온보딩 완료 → 목적지로 (쿠키 포함된 response 반환)
  return onboardingCheckResponse
}
