import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

// 인증코드 임시 저장 (서버 메모리 — 추후 Redis로 교체 가능)
// Map<phone, { code, expiresAt }>
export const otpStore = new Map<string, { code: string; expiresAt: number }>()

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ error: '전화번호가 없습니다' }, { status: 400 })

    const apiKey = process.env.SOLAPI_API_KEY
    const apiSecret = process.env.SOLAPI_API_SECRET
    const senderPhone = process.env.SOLAPI_SENDER_NUMBER

    if (!apiKey || !apiSecret || !senderPhone) {
      return NextResponse.json({ error: 'SMS 설정이 없습니다' }, { status: 500 })
    }

    const code = generateCode()
    // 3분 유효
    otpStore.set(phone, { code, expiresAt: Date.now() + 3 * 60 * 1000 })

    const messageService = new SolapiMessageService(apiKey, apiSecret)
    await messageService.sendOne({
      to: phone,
      from: senderPhone,
      text: `[에프텀] 인증번호는 ${code}입니다. 3분 내에 입력해주세요.`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('SMS 발송 오류:', e)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
