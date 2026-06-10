// ============================================================
// STAGE 5-C — KakaoTalk Draft Agent (카카오톡 초안 작성 에이전트)
// 목적: 카카오톡 추모 계정 전환 또는 삭제 요청서 초안 생성
// 처리 방식: 카카오 고객센터 이메일/우편 접수 (온라인 폼 없음)
// 이메일: privacy@kakao.com
// 주의: 카카오페이 환불이 필요한 경우 별도 안내 필요
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, DraftResult, AgentResult } from '../types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const KAKAO_EMAIL = 'privacy@kakao.com'
const KAKAO_GUIDE_URL = 'https://cs.kakao.com/helps?category=29&locale=ko&service=8'

// 카카오 사망자 계정 처리 요청서 생성 (Claude)
async function generateKakaoRequestLetter(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete'
): Promise<string> {
  const kakaopayNote = caseObj.flags?.kakaopay_guide_needed
    ? '\n\n[카카오페이 잔액 환불 요청 포함]'
    : ''

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1200,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 전문가입니다.
카카오 고객센터(privacy@kakao.com)에 제출할 사망자 계정 ${action === 'memorialize' ? '추모 처리' : '삭제'} 공문 형식의 요청서를 작성합니다.
한국 공문서 형식으로 정중하게 작성하고, 모든 필수 정보를 포함하세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스 정보:
- 신청인(유가족) 성명: ${caseObj.requester.name}
- 신청인 관계: ${caseObj.requester.relation}
- 신청인 연락처: ${caseObj.requester.phone}
- 신청인 이메일: ${caseObj.requester.email}
- 고인 성명: ${caseObj.deceased.name}
- 고인 생년월일: ${caseObj.deceased.birth_date || '미제공'}
- 고인 사망일: ${caseObj.deceased.death_date || '미제공'}
- 고인 카카오톡 연결 전화번호: ${caseObj.services.find(s => s.platform === 'kakaotalk')?.phone || '미제공'}
- 처리 요청: ${action === 'memorialize' ? '계정 추모 처리(잠금 또는 추모 전환)' : '계정 영구 삭제'}${kakaopayNote}

카카오 고객센터에 제출할 요청서를 공문 형식으로 작성해주세요.
첨부 서류: 사망진단서, 가족관계증명서, 신청인 신분증 사본을 언급하세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : '카카오톡 요청서 생성에 실패했습니다.'
}

// 카카오페이 환불 안내 메시지 생성
async function generateKakaopayGuide(caseObj: CaseObject): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀 서비스의 AI입니다.
카카오페이 고인 계정 잔액 환불 절차를 한국어로 안내합니다.
3~5단계로 간결하게 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `의뢰인 ${caseObj.requester.name}님(${caseObj.requester.relation})이
고인 ${caseObj.deceased.name}의 카카오페이 잔액 환불을 원합니다.
환불 절차 안내 메시지를 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text'
    ? textBlock.text
    : `카카오페이 잔액 환불은 카카오 고객센터(1577-3754)에 직접 문의하세요.
필요 서류: 사망진단서, 가족관계증명서, 신청인 신분증, 통장 사본`
}

// ============================================================
// 메인 — KakaoTalk Draft Agent 실행
// ============================================================
export async function runKakaotalkDraftAgent(
  caseObj: CaseObject
): Promise<AgentResult & { draft?: DraftResult; kakaopay_guide?: string }> {
  console.log('\n💬 [KakaoTalk Draft Agent] 초안 작성 시작')

  const service = caseObj.services.find(s => s.platform === 'kakaotalk')
  if (!service) {
    return {
      success: false,
      agent: 'kakaotalk-draft-agent',
      message: '케이스에 KakaoTalk 서비스가 없습니다.',
      error: 'service_not_found',
    }
  }

  try {
    console.log(`   액션: ${service.action} | 전화: ${service.phone || '미제공'}`)
    console.log(`   카카오페이 안내 필요: ${caseObj.flags?.kakaopay_guide_needed ? '예' : '아니오'}`)

    // 1. 요청서 초안 생성
    console.log('📝 카카오 요청서 초안 생성 중...')
    const letterDraft = await generateKakaoRequestLetter(caseObj, service.action)

    // 2. 카카오페이 환불 안내 (필요한 경우)
    let kakaopayGuide: string | undefined
    if (caseObj.flags?.kakaopay_guide_needed) {
      console.log('💳 카카오페이 환불 안내 생성 중...')
      kakaopayGuide = await generateKakaopayGuide(caseObj)
    }

    const attachments = ['사망진단서.pdf', '가족관계증명서.pdf', '유가족_신분증.jpg']

    const warnings: string[] = [
      'ℹ️ 카카오는 온라인 폼이 없어 이메일(privacy@kakao.com) 또는 우편 접수가 필요합니다.',
      'ℹ️ 처리 기간: 영업일 기준 약 5~10일 소요됩니다.',
    ]

    if (!service.phone) {
      warnings.push('⚠️ 고인 연결 전화번호가 없습니다. 의뢰인에게 확인 필요.')
    }

    if (caseObj.flags?.kakaopay_guide_needed) {
      warnings.push('💳 카카오페이 잔액 환불 요청이 포함되어 있습니다. 별도 처리 필요.')
    }

    const draft: DraftResult = {
      platform: 'kakaotalk',
      action: service.action,
      submission_url: KAKAO_GUIDE_URL,
      letter_draft: letterDraft,
      form_fields: {
        to_email: KAKAO_EMAIL,
        subject: `[사망자 계정 ${service.action === 'memorialize' ? '추모 처리' : '삭제'} 요청] ${caseObj.deceased.name}`,
        body_summary: '첨부된 요청서 참고',
      },
      attachments,
      warnings,
      operator_notes: `이메일(${KAKAO_EMAIL})로 요청서와 첨부 서류 발송 후 접수번호 확보 필요.`,
      created_at: new Date().toISOString(),
    }

    if (!caseObj.draft_results) caseObj.draft_results = []
    caseObj.draft_results.push(draft)
    caseObj.updated_at = new Date().toISOString()

    console.log('✅ [KakaoTalk Draft] 초안 작성 완료')
    console.log(`\n📄 요청서 초안:\n${'─'.repeat(40)}\n${letterDraft}\n${'─'.repeat(40)}`)

    if (kakaopayGuide) {
      console.log(`\n💳 카카오페이 안내:\n${kakaopayGuide}`)
    }

    return {
      success: true,
      agent: 'kakaotalk-draft-agent',
      message: `KakaoTalk ${service.action} 초안 작성 완료.`,
      data: { platform: 'kakaotalk', action: service.action, kakaopay: !!kakaopayGuide },
      draft,
      kakaopay_guide: kakaopayGuide,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      agent: 'kakaotalk-draft-agent',
      message: 'KakaoTalk 초안 작성 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  console.log('✅ KakaoTalk Draft Agent 모듈 로드 완료')
}
