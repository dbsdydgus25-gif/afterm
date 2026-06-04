import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 401 })
  }

  // 세션 쿠키 발급 (24시간)
  const cookieStore = await cookies()
  cookieStore.set('admin_session', 'authorized', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  })

  return NextResponse.json({ ok: true })
}
