// ============================================================
// STAGE 5-E — Twitter/X Draft Agent (트위터/X 초안 작성 에이전트)
// 목적: Twitter/X 계정 삭제 요청 이메일 초안 생성
// 처리: 이메일로만 신청 가능 (privacy@x.com)
// 신청 URL: https://help.twitter.com/forms/privacy
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, DraftResult, AgentResult } from '../types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const TWITTER_EMAIL = 'privacy@x.com'
const TWITTER_FORM_URL = 'https://help.twitter.com/forms/privacy'

// Twitter/X 계정 삭제 이메일 초안 생성 (Claude)
async function generateTwitterEmailDraft(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete'
): Promise<string> {
  const service = caseObj.services.find(s => s.platform === 'twitter')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1000,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 서비스의 AI 전문가입니다.
Twitter/X(privacy@x.com)에 제출할 고인 계정 ${action === 'delete' ? '삭제' : '보존'} 요청 이메일을 영어로 작성합니다.
공식적이고 명확한 영어로 작성하되, 이메일 형식(To/Subject/Body)으로 구성하세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스 정보:
- 신청인(유가족) 성명: ${caseObj.requester.name}
- 신청인 관계: ${caseObj.requester.relation}
- 신청인 이메일: ${caseObj.requester.email}
- 고인 성명: ${caseObj.deceased.name}
- 고인 사망일: ${caseObj.deceased.death_date || 'not provided'}
- 고인 Twitter 사용자명: ${service?.username || 'not provided'}
- 신청 유형: ${action === 'delete' ? '계정 영구 삭제' : '계정 보존/메모리얼'}

Twitter/X privacy 팀에 보낼 이메일을 영어로 작성하세요.
첨부 서류: Death Certificate, Family Relationship Certificate, Requester's ID Copy를 언급하세요.

형식:
To: privacy@x.com
Subject: [Request for Account ${action === 'delete' ? 'Deactivation' : 'Preservation'}] - @username
Body: ...`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : 'Twitter 이메일 초안 생성에 실패했습니다.'
}

// 운영자 참고 사항
async function generateOperatorNotes(caseObj: CaseObject): Promise<string> {
  const service = caseObj.services.find(s => s.platform === 'twitter')
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 300,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀 운영팀을 위한 AI입니다. Twitter/X 계정 처리 주의사항을 한국어 3~4줄로 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `고인: ${caseObj.deceased.name} | Twitter: ${service?.username || '미제공'}
주의: Twitter/X는 처리 속도가 느리고 이메일 응답률이 낮을 수 있습니다.
운영자 주의사항을 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : 'Twitter 이메일 발송 후 2주 내 응답 없을 경우 재발송 권장.'
}

// ============================================================
// 메인 — Twitter Draft Agent 실행
// ============================================================
export async function runTwitterDraftAgent(
  caseObj: CaseObject
): Promise<AgentResult & { draft?: DraftResult }> {
  console.log('\n🐦 [Twitter Draft Agent] 초안 작성 시작')

  const service = caseObj.services.find(s => s.platform === 'twitter')
  if (!service) {
    return {
      success: false,
      agent: 'twitter-draft-agent',
      message: '케이스에 Twitter/X 서비스가 없습니다.',
      error: 'service_not_found',
    }
  }

  try {
    console.log(`   액션: ${service.action} | 사용자명: ${service.username || '미제공'}`)

    // 1. 이메일 초안 생성
    console.log('📝 Twitter 이메일 초안 생성 중...')
    const emailDraft = await generateTwitterEmailDraft(caseObj, service.action)

    // 2. 운영자 참고 사항
    const operatorNotes = await generateOperatorNotes(caseObj)

    const attachments = ['death_certificate.pdf', 'family_relationship_certificate.pdf', 'requester_id.jpg']

    const warnings: string[] = [
      `ℹ️ Twitter/X는 이메일(${TWITTER_EMAIL})로만 신청 가능합니다.`,
      'ℹ️ 처리 기간: 2~6주 소요될 수 있으며 응답률이 낮습니다.',
      'ℹ️ 이메일은 반드시 영어로 작성해야 합니다.',
    ]

    if (!service.username) {
      warnings.push('⚠️ 고인의 Twitter 사용자명(@handle)이 없습니다. 의뢰인에게 확인 필요.')
    }

    if (service.action === 'memorialize') {
      warnings.push('ℹ️ Twitter/X는 공식 추모 계정 기능이 없습니다. 계정 보존(보관) 또는 삭제만 가능합니다.')
    }

    const draft: DraftResult = {
      platform: 'twitter',
      action: service.action,
      submission_url: TWITTER_FORM_URL,
      email_draft: emailDraft,
      form_fields: {
        to_email: TWITTER_EMAIL,
        subject: `Request for Account ${service.action === 'delete' ? 'Deactivation' : 'Preservation'} - ${service.username || 'unknown'}`,
        body_language: 'English',
      },
      attachments,
      warnings,
      operator_notes: operatorNotes,
      created_at: new Date().toISOString(),
    }

    if (!caseObj.draft_results) caseObj.draft_results = []
    caseObj.draft_results.push(draft)
    caseObj.updated_at = new Date().toISOString()

    console.log('✅ [Twitter Draft] 초안 작성 완료')
    console.log(`\n📧 이메일 초안:\n${'─'.repeat(40)}\n${emailDraft}\n${'─'.repeat(40)}`)

    return {
      success: true,
      agent: 'twitter-draft-agent',
      message: `Twitter/X ${service.action} 초안 작성 완료.`,
      data: { platform: 'twitter', action: service.action },
      draft,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      agent: 'twitter-draft-agent',
      message: 'Twitter/X 초안 작성 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  console.log('✅ Twitter Draft Agent 모듈 로드 완료')
}
