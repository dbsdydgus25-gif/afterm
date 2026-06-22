import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const OTP_SECRET = process.env.OTP_SECRET || 'afterm-otp-secret-key-2025'

function solapiAuthHeader() {
  const apiKey = process.env.SOLAPI_API_KEY!
  const apiSecret = process.env.SOLAPI_API_SECRET!
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(16).toString('hex')
  const signature = crypto.createHmac('sha256', apiSecret).update(`${date}${salt}`).digest('hex')
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

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

  // Solapi SMS 발송
  try {
    const smsRes = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: solapiAuthHeader(),
      },
      body: JSON.stringify({
        message: {
          to: digits,
          from: process.env.SOLAPI_SENDER_NUMBER,
          text: `[에프텀] 본인확인 인증번호: ${code}\n10분 내 입력해 주세요.`,
        },
      }),
    })

    if (!smsRes.ok) {
      const err = await smsRes.json().catch(() => ({}))
      console.error('[OTP SMS] 발송 실패:', err)
      // SMS 실패해도 토큰은 반환 (개발 환경 폴백)
      return NextResponse.json({ ok: true, token, devCode: process.env.NODE_ENV !== 'production' ? code : undefined })
    }

    console.log(`[OTP SMS] ${digits} 발송 완료`)
    return NextResponse.json({ ok: true, token })
  } catch (e) {
    console.error('[OTP SMS] 오류:', e)
    return NextResponse.json({ ok: true, token, devCode: process.env.NODE_ENV !== 'production' ? code : undefined })
  }
}
