// 에프텀 MVP — Next.js 16 인증 프록시 (proxy.ts)
// Next.js 16에서는 middleware.ts 대신 proxy.ts 파일명을 사용

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 어드민 경로는 layout.tsx에서 쿠키 인증 처리 — 여기서는 패스 ──
  if (pathname.startsWith('/admin')) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // 세션 확인 — getSession()은 로컬 쿠키만 읽어 네트워크 호출 없음 (빠름)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // ── /home: 비로그인도 접근 허용 (페이지에서 로그인 팝업 처리)
  // 단, 로그인한 경우 온보딩 미완료 → 온보딩으로 ──
  if (pathname.startsWith('/home')) {
    if (user && !user.user_metadata?.onboarding_done) {
      return NextResponse.redirect(new URL('/onboarding?next=/home', request.url))
    }
  }

  // ── 보호된 경로: 비로그인 → 랜딩으로 ──
  const isProtected = ['/apply'].some((p) => pathname.startsWith(p))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── 이미 로그인 상태에서 로그인/회원가입 접근 → 홈으로 ──
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}

// 인증 체크가 필요한 경로만 매칭 (불필요한 요청에 세션 확인 안 함)
export const config = {
  matcher: ['/home/:path*', '/apply/:path*', '/admin/:path*', '/login', '/signup', '/onboarding'],
}
