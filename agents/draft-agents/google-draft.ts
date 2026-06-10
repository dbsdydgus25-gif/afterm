// ============================================================
// STAGE 5-D — Google Draft Agent (구글 초안 작성 에이전트)
// 목적: 구글 계정 삭제 신청 초안 생성
// 신청 URL: https://support.google.com/accounts/troubleshooter/6357590
// 처리: Inactive Account Manager 또는 가족 삭제 요청 폼
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, DraftResult, AgentResult } from '../types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const GOOGLE_URLS = {
  delete: 'https://support.google.com/accounts/troubleshooter/6357590',
  memorialize: 'https://support.google.com/accounts/answer/10381521', // 고인 계정 관리 안내
}

// Google 계정 삭제 요청 폼 필드 생성
async function generateGoogleFormFields(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete'
): Promise<Record<string, string>> {
  const service = caseObj.services.find(s => s.platform === 'google')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 서비스의 AI 전문가입니다.
Google 고인 계정 ${action === 'memorialize' ? '관리' : '삭제'} 신청 폼 입력값을 JSON으로 생성합니다.
JSON 외 다른 텍스트는 포함하지 마세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스 정보:
- 신청인 성명: ${caseObj.requester.name}
- 신청인 관계: ${caseObj.requester.relation}
- 신청인 이메일: ${caseObj.requester.email}
- 고인 성명: ${caseObj.deceased.name}
- 고인 Gmail 주소: ${service?.email || '미제공'}
- 고인 생년월일: ${caseObj.deceased.birth_date || '미제공'}
- 고인 사망일: ${caseObj.deceased.death_date || '미제공'}
- 신청 유형: ${action === 'delete' ? '계정 삭제' : '계정 데이터 접근'}

Google 고인 계정 처리 신청 폼 입력값을 JSON으로 생성하세요:
{
  "requester_name": "신청인 성명",
  "requester_email": "신청인 이메일 (Google 연락용)",
  "relationship_to_deceased": "고인과의 관계",
  "deceased_name": "고인 성명",
  "deceased_email": "고인 Gmail 주소",
  "date_of_death": "고인 사망일 (YYYY-MM-DD)",
  "country": "KR",
  "request_type": "${action === 'delete' ? 'account_deletion' : 'account_data_access'}",
  "description": "신청 상세 내용 (한국어, 2~3문장)"
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
Google 계정 ${action === 'delete' ? '삭제' : '데이터 접근'} 처리 시 주의사항을 한국어 3~5줄로 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `고인: ${caseObj.deceased.name} | Gmail: ${caseObj.services.find(s => s.platform === 'google')?.email || '미제공'}
신청 유형: ${action}
Google은 처리에 수주가 소요될 수 있으며, 공증된 사망진단서를 요구할 수 있습니다.
운영자 주의사항을 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : 'Google 처리는 수주 소요. 공증 서류 필요 시 의뢰인 안내.'
}

// ============================================================
// 메인 — Google Draft Agent 실행
// ============================================================
export async function runGoogleDraftAgent(
  caseObj: CaseObject
): Promise<AgentResult & { draft?: DraftResult }> {
  console.log('\n🔍 [Google Draft Agent] 초안 작성 시작')

  const service = caseObj.services.find(s => s.platform === 'google')
  if (!service) {
    return {
      success: false,
      agent: 'google-draft-agent',
      message: '케이스에 Google 서비스가 없습니다.',
      error: 'service_not_found',
    }
  }

  try {
    console.log(`   액션: ${service.action} | Gmail: ${service.email || '미제공'}`)

    const formFields = await generateGoogleFormFields(caseObj, service.action)
    const operatorNotes = await generateOperatorNotes(caseObj, service.action)

    const attachments = ['사망진단서.pdf', '가족관계증명서.pdf', '유가족_신분증.jpg']

    const warnings: string[] = [
      'ℹ️ Google은 처리에 수주(2~6주)가 소요될 수 있습니다.',
      'ℹ️ Google이 공증된(notarized) 사망진단서를 추가 요청할 수 있습니다.',
    ]

    if (!service.email) {
      warnings.push('⚠️ 고인의 Gmail 주소가 없습니다. 의뢰인에게 확인 필요.')
    }

    if (service.action === 'memorialize') {
      warnings.push('ℹ️ Google은 공식 추모 계정 전환 기능을 지원하지 않습니다. 계정 데이터 접근 또는 삭제만 가능합니다.')
    }

    const draft: DraftResult = {
      platform: 'google',
      action: service.action,
      submission_url: GOOGLE_URLS[service.action],
      form_fields: formFields,
      attachments,
      warnings,
      operator_notes: operatorNotes,
      created_at: new Date().toISOString(),
    }

    if (!caseObj.draft_results) caseObj.draft_results = []
    caseObj.draft_results.push(draft)
    caseObj.updated_at = new Date().toISOString()

    console.log('✅ [Google Draft] 초안 작성 완료')
    console.log(`   신청 URL: ${draft.submission_url}`)

    return {
      success: true,
      agent: 'google-draft-agent',
      message: `Google ${service.action} 초안 작성 완료.`,
      data: { platform: 'google', action: service.action },
      draft,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      agent: 'google-draft-agent',
      message: 'Google 초안 작성 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  console.log('✅ Google Draft Agent 모듈 로드 완료')
}
