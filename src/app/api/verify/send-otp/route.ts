import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const OTP_SECRET = process.env.OTP_SECRET || 'afterm-otp-secret-key-2025'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: '전화번호 필요' }, { status: 400 })

  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return NextResponse.json({ error: '전화번호 형식 오류' }, { status: 400 })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const window = Math.floor(Date.now() / (10 * 60 * 1000))

  const hmac = crypto.createHmac('sha256', OTP_SECRET)
    .update(`${code}:${digits}:${window}`)
    .digest('hex')

  const token = Buffer.from(`${code}:${hmac}`).toString('base64url')

  // TODO: 실제 SMS 발송 (Solapi / Coolsms 연동 후 아래 주석 해제)
  // await fetch('https://api.solapi.com/messages/v4/send', {
  //   method: 'POST',
  //   headers: { Authorization: `HMAC-SHA256 ... ` },
  //   body: JSON.stringify({ message: { to: digits, from: '발신번호', text: `[에프텀] 인증번호: ${code}` } }),
  // })

  console.log(`[OTP] ${digits} → ${code}`)

  return NextResponse.json({ ok: true, token, code })
}
