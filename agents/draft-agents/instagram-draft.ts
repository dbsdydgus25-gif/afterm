// ============================================================
// STAGE 5-B — Instagram Draft Agent (인스타그램 초안 작성 에이전트)
// 목적: Instagram 추모 계정 전환 또는 삭제 신청 초안 생성
// 주의: Instagram 삭제는 Facebook 폼과 별도 처리 필요
// 신청 URL: https://help.instagram.com/contact/1474899482730688 (추모)
//            https://help.instagram.com/contact/452224988520755 (삭제)
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, DraftResult, AgentResult } from '../types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const INSTAGRAM_URLS = {
  memorialize: 'https://help.instagram.com/contact/1474899482730688',
  delete: 'https://help.instagram.com/contact/452224988520755',
}

// Instagram 폼 필드 생성
async function generateInstagramFormFields(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete',
  accountUrl?: string
): Promise<Record<string, string>> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 전문가입니다.
Instagram 고인 계정 ${action === 'memorialize' ? '추모 계정 전환' : '삭제'} 신청 폼 입력값을 JSON으로 생성합니다.
JSON 외 다른 텍스트는 포함하지 마세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스 정보:
- 신청인 성명: ${caseObj.requester.name}
- 신청인 관계: ${caseObj.requester.relation}
- 신청인 이메일: ${caseObj.requester.email}
- 고인 성명: ${caseObj.deceased.name}
- 고인 생년월일: ${caseObj.deceased.birth_date || '미제공'}
- 고인 사망일: ${caseObj.deceased.death_date || '미제공'}
- 고인 Instagram URL: ${accountUrl || '미제공'}
- 신청 유형: ${action === 'memorialize' ? '추모 계정 전환' : '계정 삭제'}

Instagram 신청 폼 입력값을 JSON으로 생성하세요:
{
  "your_name": "신청인 성명",
  "your_email": "신청인 이메일",
  "relationship": "고인과의 관계",
  "deceased_username": "고인 Instagram 사용자명 (URL에서 추출)",
  "deceased_name": "고인 실명",
  "proof_of_death_document": "사망진단서 첨부 예정",
  "proof_of_relationship": "가족관계증명서 첨부 예정",
  "request_description": "신청 상세 내용 (한국어)"
}`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return {}

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch {
    return {}
  }
}

// 운영자 참고 사항
async function generateOperatorNotes(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete'
): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 400,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀 운영팀을 위한 AI입니다.
Instagram ${action === 'memorialize' ? '추모화' : '삭제'} 처리 시 주의사항을 한국어 3~5줄로 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `고인: ${caseObj.deceased.name} | 신청 유형: ${action}
참고: Instagram 삭제는 Meta 계열이지만 Facebook과 별도 폼으로 신청해야 합니다.
운영자 주의사항을 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text'
    ? textBlock.text
    : 'Instagram 폼 제출 후 Meta 처리 현황을 추적하세요. Facebook과 별도 신청임을 확인하세요.'
}

// ============================================================
// 메인 — Instagram Draft Agent 실행
// ============================================================
export async function runInstagramDraftAgent(
  caseObj: CaseObject
): Promise<AgentResult & { draft?: DraftResult }> {
  console.log('\n📸 [Instagram Draft Agent] 초안 작성 시작')

  const service = caseObj.services.find(s => s.platform === 'instagram')
  if (!service) {
    return {
      success: false,
      agent: 'instagram-draft-agent',
      message: '케이스에 Instagram 서비스가 없습니다.',
      error: 'service_not_found',
    }
  }

  try {
    console.log(`   액션: ${service.action} | URL: ${service.account_url || '미제공'}`)

    const formFields = await generateInstagramFormFields(caseObj, service.action, service.account_url)
    const operatorNotes = await generateOperatorNotes(caseObj, service.action)

    const attachments = ['사망진단서.pdf', '가족관계증명서.pdf', '유가족_신분증.jpg']

    const warnings: string[] = []
    if (!service.account_url) {
      warnings.push('⚠️ Instagram 프로필 URL이 없습니다. 의뢰인에게 사용자명 또는 URL 확인 필요.')
    }
    if (service.action === 'delete') {
      warnings.push('⚠️ 삭제된 계정은 복구 불가. 의뢰인에게 삭제 여부를 최종 확인하세요.')
      warnings.push('ℹ️ Facebook 계정과 연동된 경우 별도로 Facebook 삭제도 진행하세요.')
    }

    const draft: DraftResult = {
      platform: 'instagram',
      action: service.action,
      submission_url: INSTAGRAM_URLS[service.action],
      form_fields: formFields,
      attachments,
      warnings,
      operator_notes: operatorNotes,
      created_at: new Date().toISOString(),
    }

    if (!caseObj.draft_results) caseObj.draft_results = []
    caseObj.draft_results.push(draft)
    caseObj.updated_at = new Date().toISOString()

    console.log('✅ [Instagram Draft] 초안 작성 완료')
    console.log(`   신청 URL: ${draft.submission_url}`)

    return {
      success: true,
      agent: 'instagram-draft-agent',
      message: `Instagram ${service.action} 초안 작성 완료.`,
      data: { platform: 'instagram', action: service.action },
      draft,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      agent: 'instagram-draft-agent',
      message: 'Instagram 초안 작성 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  console.log('✅ Instagram Draft Agent 모듈 로드 완료')
}
