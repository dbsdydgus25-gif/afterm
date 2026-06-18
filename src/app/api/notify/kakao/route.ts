import { NextRequest, NextResponse } from 'next/server'
import { sendKakao } from '@/lib/kakao/sendKakao'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await sendKakao(body)
    if (!result.success) return NextResponse.json({ success: false, reason: result.reason })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[카카오 알림] 오류:', e)
    return NextResponse.json({ error: '알림 발송 실패' }, { status: 500 })
  }
}
