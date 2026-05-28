// 에프텀 MVP1 — 인증 프록시 (Next.js 16 방식)
// middleware.ts 대신 proxy.ts 사용

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 인증이 필요한 경로
const PROTECTED_PATHS = ['/apply', '/dashboard']
// 관리자 전용 경로
const ADMIN_PATHS = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Supabase 세션 갱신 + 인증 확인
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 보호된 경로: 비로그인 → 로그인 페이지로
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 관리자 경로: 비로그인 → 로그인, 비관리자 → 홈
  const isAdmin = ADMIN_PATHS.some(p => pathname.startsWith(p))
  if (isAdmin) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (adminEmails.length > 0 && !adminEmails.includes(user.email || '')) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/'
      return NextResponse.redirect(homeUrl)
    }
  }

  // 이미 로그인 상태에서 로그인/회원가입 접근 → 대시보드로
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
