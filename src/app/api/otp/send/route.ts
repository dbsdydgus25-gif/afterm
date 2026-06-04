import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

// OTP 임시 저장소 (shared)
export const otpStore = new Map<string, { code: string; expiresAt: number }>()

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// 카카오 "나에게 보내기" API (provider_token 사용)
async function sendKakaoMessage(kakaoToken: string, code: string): Promise<boolean> {
  try {
    const res = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kakaoToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify({
          object_type: 'text',
          text: `[에프텀] 인증번호\n\n${code}\n\n3분 내에 입력해주세요.\n본인이 요청하지 않은 경우 무시해주세요.`,
          link: {
            web_url: 'https://afterm-afterm.vercel.app',
            mobile_web_url: 'https://afterm-afterm.vercel.app',
          },
        }),
      }),
    })
    const result = await res.json()
    // result_code 0 = 성공
    return result.result_code === 0
  } catch (e) {
    console.error('카카오 나에게 보내기 실패:', e)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, kakaoToken } = await req.json()
    if (!phone) return NextResponse.json({ error: '전화번호가 없습니다' }, { status: 400 })

    const code = generateCode()
    otpStore.set(phone, { code, expiresAt: Date.now() + 3 * 60 * 1000 })

    // 카카오 토큰이 있으면 카카오로 먼저 시도
    if (kakaoToken) {
      const sent = await sendKakaoMessage(kakaoToken, code)
      if (sent) {
        return NextResponse.json({ ok: true, channel: 'kakao' })
      }
      console.warn('카카오 발송 실패 → SMS fallback')
    }

    // SMS fallback
    const apiKey = process.env.SOLAPI_API_KEY
    const apiSecret = process.env.SOLAPI_API_SECRET
    const senderPhone = process.env.SOLAPI_SENDER_NUMBER

    if (!apiKey || !apiSecret || !senderPhone) {
      return NextResponse.json({ error: 'SMS 설정이 없습니다' }, { status: 500 })
    }

    const messageService = new SolapiMessageService(apiKey, apiSecret)
    await messageService.sendOne({
      to: phone,
      from: senderPhone,
      text: `[에프텀] 인증번호는 ${code}입니다. 3분 내에 입력해주세요.`,
    })

    return NextResponse.json({ ok: true, channel: 'sms' })
  } catch (e) {
    console.error('OTP 발송 오류:', e)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
