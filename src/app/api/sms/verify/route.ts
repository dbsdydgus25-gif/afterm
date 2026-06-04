import { NextRequest, NextResponse } from 'next/server'
import { otpStore } from '../send/route'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

    const stored = otpStore.get(phone)
    if (!stored) return NextResponse.json({ error: '인증번호를 먼저 요청해주세요' }, { status: 400 })
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone)
      return NextResponse.json({ error: '인증번호가 만료되었습니다' }, { status: 400 })
    }
    if (stored.code !== String(code)) {
      return NextResponse.json({ error: '인증번호가 올바르지 않습니다' }, { status: 400 })
    }

    otpStore.delete(phone)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('SMS 인증 오류:', e)
    return NextResponse.json({ error: '인증 실패' }, { status: 500 })
  }
}
