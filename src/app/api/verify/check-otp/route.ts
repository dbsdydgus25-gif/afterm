import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const OTP_SECRET = process.env.OTP_SECRET || 'afterm-otp-secret-key-2025'

export async function POST(req: NextRequest) {
  const { phone, code, token } = await req.json()
  if (!phone || !code || !token) return NextResponse.json({ ok: false, error: '파라미터 오류' }, { status: 400 })

  const digits = phone.replace(/\D/g, '')

  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const colonIdx = decoded.indexOf(':')
    const storedCode = decoded.slice(0, colonIdx)
    const storedHmac = decoded.slice(colonIdx + 1)

    if (storedCode !== code.trim()) {
      return NextResponse.json({ ok: false, error: '인증번호가 틀립니다' })
    }

    const now = Math.floor(Date.now() / (10 * 60 * 1000))
    for (const w of [now, now - 1]) {
      const expected = crypto.createHmac('sha256', OTP_SECRET)
        .update(`${code}:${digits}:${w}`)
        .digest('hex')
      if (expected === storedHmac) {
        return NextResponse.json({ ok: true })
      }
    }

    return NextResponse.json({ ok: false, error: '인증번호가 만료되었습니다. 다시 요청해 주세요.' })
  } catch {
    return NextResponse.json({ ok: false, error: '인증 오류가 발생했습니다' })
  }
}
