import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { phone, caseId, type, requesterName, deceasedName: rawDeceasedName, services, amount, refundReason, otpCode } = await req.json()
    if (!phone) return NextResponse.json({ error: '전화번호 없음' }, { status: 400 })

    const apiKey = process.env.SOLAPI_API_KEY
    const apiSecret = process.env.SOLAPI_API_SECRET
    const senderPhone = process.env.SOLAPI_SENDER_NUMBER
    const pfId = process.env.SOLAPI_KAKAO_PFID

    if (!apiKey || !apiSecret || !senderPhone) {
      console.log('[카카오 알림] Solapi 설정 없음 — 생략')
      return NextResponse.json({ success: false, reason: 'env_not_set' })
    }

    if (!pfId) {
      console.log('[카카오 알림] SOLAPI_KAKAO_PFID 없음 — 생략 (SMS 미발송)')
      return NextResponse.json({ success: false, reason: 'pfid_not_set' })
    }

    // 고인 이름이 비어있으면 DB에서 직접 조회
    let deceasedName = rawDeceasedName
    if (!deceasedName && caseId) {
      try {
        const adminClient = createAdminClient()
        const { data } = await adminClient.from('cases').select('deceased_name').eq('id', caseId).single()
        if (data?.deceased_name) deceasedName = data.deceased_name
      } catch {}
    }

    const messageService = new SolapiMessageService(apiKey, apiSecret)

    const templateMap: Record<string, string | undefined> = {
      submitted: process.env.SOLAPI_KAKAO_SUBMIT_TEMPLATE_ID,
      processing: process.env.SOLAPI_KAKAO_PROCESSING_TEMPLATE_ID,
      completed: process.env.SOLAPI_KAKAO_COMPLETE_TEMPLATE_ID,
      payment: process.env.SOLAPI_KAKAO_PAYMENT_TEMPLATE_ID,
      refund: process.env.SOLAPI_KAKAO_REFUND_TEMPLATE_ID,
      otp: process.env.SOLAPI_KAKAO_OTP_TEMPLATE_ID,
    }

    const templateId = templateMap[type] || process.env.SOLAPI_KAKAO_OTP_TEMPLATE_ID
    if (!templateId) {
      console.log(`[카카오 알림] 템플릿 ID 없음 (type=${type}) — 생략`)
      return NextResponse.json({ success: false, reason: 'template_not_set' })
    }

    await (messageService as any).sendOne({
      to: phone,
      from: senderPhone,
      kakaoOptions: {
        pfId,
        templateId,
        variables: {
          '#{신청인이름}': requesterName || '',
          '#{고인이름}': deceasedName || '',
          '#{고객명}': requesterName || '',
          '#{서비스}': services || '',
          '#{서비스목록}': services || '',
          '#{접수번호}': caseId?.slice(0, 8).toUpperCase() || '',
          '#{결제금액}': amount || '',
          '#{환불금액}': amount || '',
          '#{환불사유}': refundReason || '관리자 처리',
          '#{인증번호}': otpCode || '',
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[카카오 알림] 오류:', e)
    return NextResponse.json({ error: '알림 발송 실패' }, { status: 500 })
  }
}
