import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  '/',
  '/home',
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/refund',
  '/about',
  '/auth',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로 체크 (prefix 포함)
  const isPublic = PUBLIC_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )

  // 세션 쿠키를 갱신하면서 response 생성
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (중요: getUser()를 호출해야 세션 refresh가 일어남)
  const { data: { user } } = await supabase.auth.getUser()

  // 비공개 경로인데 로그인 안 된 경우 → 랜딩으로
  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
