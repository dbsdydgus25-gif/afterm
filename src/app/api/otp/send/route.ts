import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

export const otpStore = new Map<string, { code: string; expiresAt: number }>()

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ error: '전화번호가 없습니다' }, { status: 400 })

    const code = generateCode()
    otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 })

    const apiKey = process.env.SOLAPI_API_KEY
    const apiSecret = process.env.SOLAPI_API_SECRET
    const senderPhone = process.env.SOLAPI_SENDER_NUMBER
    const pfId = process.env.SOLAPI_KAKAO_PFID
    const templateId = process.env.SOLAPI_KAKAO_OTP_TEMPLATE_ID

    if (!apiKey || !apiSecret || !senderPhone) {
      return NextResponse.json({ error: 'SMS 설정이 없습니다' }, { status: 500 })
    }

    const messageService = new SolapiMessageService(apiKey, apiSecret)

    try {
      if (pfId && templateId) {
        // 알림톡 발송
        await (messageService as any).sendOne({
          to: phone,
          from: senderPhone,
          kakaoOptions: {
            pfId,
            templateId,
            variables: {
              '#{인증번호}': code,
            },
          },
        })
        return NextResponse.json({ ok: true, channel: 'kakao' })
      }
    } catch (kakaoErr) {
      console.warn('[OTP] 알림톡 실패 → SMS 폴백:', kakaoErr)
    }

    // SMS 폴백
    await (messageService as any).sendOne({
      to: phone,
      from: senderPhone,
      text: `[에프텀] 인증번호는 ${code}입니다. 5분 내에 입력해주세요.`,
    })

    return NextResponse.json({ ok: true, channel: 'sms' })
  } catch (e) {
    console.error('OTP 발송 오류:', e)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
