import { SolapiMessageService } from 'solapi'
import { createAdminClient } from '@/lib/supabase/admin'

export type KakaoType = 'submitted' | 'processing' | 'completed' | 'payment' | 'refund' | 'otp'

export interface SendKakaoParams {
  phone: string
  type: KakaoType
  caseId?: string
  requesterName?: string
  deceasedName?: string
  services?: string
  amount?: string
  refundReason?: string
  otpCode?: string
}

export async function sendKakao(params: SendKakaoParams): Promise<{ success: boolean; reason?: string }> {
  const { phone, type, caseId, requesterName, deceasedName: rawDeceasedName, services, amount, refundReason, otpCode } = params

  if (!phone) return { success: false, reason: 'no_phone' }

  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const senderPhone = process.env.SOLAPI_SENDER_NUMBER
  const pfId = process.env.SOLAPI_KAKAO_PFID

  if (!apiKey || !apiSecret || !senderPhone) return { success: false, reason: 'env_not_set' }
  if (!pfId) return { success: false, reason: 'pfid_not_set' }

  // 고인 이름 없으면 DB에서 조회
  let deceasedName = rawDeceasedName
  if (!deceasedName && caseId) {
    try {
      const { data } = await createAdminClient().from('cases').select('deceased_name').eq('id', caseId).single()
      if (data?.deceased_name) deceasedName = data.deceased_name
    } catch {}
  }

  const templateMap: Record<KakaoType, string | undefined> = {
    submitted:  process.env.SOLAPI_KAKAO_SUBMIT_TEMPLATE_ID,
    processing: process.env.SOLAPI_KAKAO_PROCESSING_TEMPLATE_ID,
    completed:  process.env.SOLAPI_KAKAO_COMPLETE_TEMPLATE_ID,
    payment:    process.env.SOLAPI_KAKAO_PAYMENT_TEMPLATE_ID,
    refund:     process.env.SOLAPI_KAKAO_REFUND_TEMPLATE_ID,
    otp:        process.env.SOLAPI_KAKAO_OTP_TEMPLATE_ID,
  }

  const templateId = templateMap[type]
  if (!templateId) {
    console.log(`[카카오 알림] 템플릿 ID 없음 (type=${type})`)
    return { success: false, reason: 'template_not_set' }
  }

  const messageService = new SolapiMessageService(apiKey, apiSecret)
  await (messageService as any).sendOne({
    to: phone,
    from: senderPhone,
    kakaoOptions: {
      pfId,
      templateId,
      variables: {
        '#{신청인이름}': requesterName || '',
        '#{고인이름}':   deceasedName || '',
        '#{고객명}':     requesterName || '',
        '#{서비스}':     services || '',
        '#{서비스목록}': services || '',
        '#{접수번호}':   caseId?.slice(0, 8).toUpperCase() || '',
        '#{결제금액}':   amount || '',
        '#{환불금액}':   amount || '',
        '#{환불사유}':   refundReason || '관리자 처리',
        '#{인증번호}':   otpCode || '',
      },
    },
  })

  return { success: true }
}
