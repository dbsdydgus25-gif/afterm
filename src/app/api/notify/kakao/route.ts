import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'

export async function POST(req: NextRequest) {
  try {
    const { phone, caseId, type, requesterName, deceasedName, services, amount, refundReason, otpCode } = await req.json()
    if (!phone) return NextResponse.json({ error: '전화번호 없음' }, { status: 400 })

    const apiKey = process.env.SOLAPI_API_KEY
    const apiSecret = process.env.SOLAPI_API_SECRET
    const senderPhone = process.env.SOLAPI_SENDER_NUMBER
    const pfId = process.env.SOLAPI_KAKAO_PFID

    if (!apiKey || !apiSecret || !senderPhone) {
      console.log('[카카오 알림] Solapi 설정 없음 — 생략')
      return NextResponse.json({ success: false, reason: 'env_not_set' })
    }

    const messageService = new SolapiMessageService(apiKey, apiSecret)

    // 알림 유형별 메시지
    const messages: Record<string, { templateId?: string; text: string }> = {
      submitted: {
        templateId: process.env.SOLAPI_KAKAO_SUBMIT_TEMPLATE_ID,
        text: `[에프텀] 신청이 접수되었습니다.\n\n고인: ${deceasedName}\n신청 서비스: ${services}\n접수번호: ${caseId.slice(0, 8).toUpperCase()}\n\n담당자가 검토 후 영업일 기준 1~2일 내 연락드립니다.\n진행 현황은 앱에서 확인하실 수 있습니다.`,
      },
      processing: {
        templateId: process.env.SOLAPI_KAKAO_PROCESSING_TEMPLATE_ID,
        text: `[에프텀] 서비스 진행이 시작되었습니다.\n\n고인: ${deceasedName}\n접수번호: ${caseId.slice(0, 8).toUpperCase()}\n\n각 플랫폼에 신청서를 제출하였습니다. 플랫폼 처리 결과를 기다리고 있어요.`,
      },
      completed: {
        templateId: process.env.SOLAPI_KAKAO_COMPLETE_TEMPLATE_ID,
        text: `[에프텀] 서비스가 완료되었습니다.\n\n고인: ${deceasedName}\n접수번호: ${caseId.slice(0, 8).toUpperCase()}\n\n신청하신 모든 서비스 처리가 완료되었습니다. 자세한 내용은 앱에서 확인해 주세요.`,
      },
      payment: {
        templateId: process.env.SOLAPI_KAKAO_PAYMENT_TEMPLATE_ID,
        text: `[에프텀] 결제가 완료되었습니다\n\n${requesterName}님, 결제가 정상적으로 완료되었습니다.\n\n▪ 결제 금액: ${amount}원\n▪ 신청 서비스: ${services}\n\n서류 검토 후 처리를 시작합니다.\n평균 1주일 이내 완료됩니다.\n\n문의: afterm001@gmail.com`,
      },
      refund: {
        templateId: process.env.SOLAPI_KAKAO_REFUND_TEMPLATE_ID,
        text: `[에프텀] 환불이 완료되었습니다\n\n${requesterName}님, 환불 처리가 완료되었습니다.\n\n▪ 환불 금액: ${amount}원\n▪ 환불 사유: ${refundReason || '관리자 처리'}\n\n영업일 기준 3~5일 내 카드사에서 취소됩니다.\n\n문의: afterm001@gmail.com`,
      },
      otp: {
        templateId: process.env.SOLAPI_KAKAO_OTP_TEMPLATE_ID,
        text: `[에프텀] 인증번호: ${otpCode}\n\n인증번호를 입력해 주세요. (5분 이내 유효)`,
      },
    }

    const msg = messages[type] || messages.submitted
    const templateId = msg.templateId || process.env.SOLAPI_KAKAO_OTP_TEMPLATE_ID

    try {
      if (pfId && templateId) {
        await (messageService as any).sendOne({
          to: phone,
          from: senderPhone,
          kakaoOptions: {
            pfId,
            templateId,
            variables: {
              '#{신청인이름}': requesterName || '',
              '#{고인명}': deceasedName || '',
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
      } else {
        // SMS 폴백
        await (messageService as any).sendOne({
          to: phone,
          from: senderPhone,
          text: msg.text,
        })
      }
    } catch (kakaoErr) {
      // 카카오 실패 시 SMS 폴백
      console.warn('[카카오 알림] 카카오 실패, SMS 전환:', kakaoErr)
      await (messageService as any).sendOne({
        to: phone,
        from: senderPhone,
        text: msg.text,
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[카카오 알림] 오류:', e)
    return NextResponse.json({ error: '알림 발송 실패' }, { status: 500 })
  }
}
