// 에프텀 MVP — Next.js 16 인증 프록시 (proxy.ts)
// Next.js 16에서는 middleware.ts 대신 proxy.ts 파일명을 사용

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 인증이 필요한 경로 (비로그인 → / 리다이렉트)
const PROTECTED_PATHS = ['/apply', '/dashboard', '/home']
// 관리자 전용 경로
const ADMIN_PATHS = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 응답 객체 초기화 — 세션 쿠키 갱신을 위해 반드시 필요
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Supabase SSR 클라이언트 생성 — 세션 쿠키를 읽고 갱신
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 요청 쿠키 업데이트
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 응답 쿠키 업데이트 (세션 갱신)
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 + 현재 유저 확인 (getUser가 getSession보다 안전)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── /home: 비로그인 → 랜딩, 온보딩 미완료 → 온보딩 ──
  if (pathname.startsWith('/home')) {
    if (!user) return NextResponse.redirect(new URL('/', request.url))
    if (!user.user_metadata?.onboarding_done) {
      return NextResponse.redirect(new URL('/onboarding?next=/home', request.url))
    }
  }

  // ── 보호된 경로: 비로그인 → 랜딩으로 ──
  const isProtected = ['/apply', '/dashboard'].some((p) => pathname.startsWith(p))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── 관리자 경로: 비로그인 → 로그인, 비관리자 → 홈 ──
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  if (isAdmin) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    if (adminEmails.length > 0 && !adminEmails.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── 이미 로그인 상태에서 로그인/회원가입 접근 → 대시보드로 ──
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}

// 미들웨어 적용 경로 (정적 파일, 이미지 제외)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
