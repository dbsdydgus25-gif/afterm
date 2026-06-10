// ============================================================
// STAGE 5-A — Facebook Draft Agent (페이스북 초안 작성 에이전트)
// 목적: 페이스북 추모 계정 전환 또는 삭제 신청에 필요한
//       폼 입력값과 첨부 파일 목록을 자동 생성한다
// 신청 URL: https://www.facebook.com/help/contact/234739086860192 (추모)
//            https://www.facebook.com/help/contact/228813257197480 (삭제)
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, DraftResult, AgentResult } from '../types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const FACEBOOK_URLS = {
  memorialize: 'https://www.facebook.com/help/contact/234739086860192',
  delete: 'https://www.facebook.com/help/contact/228813257197480',
}

// Facebook 신청 폼 필드 생성 (Claude)
async function generateFacebookFormFields(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete',
  accountUrl?: string
): Promise<Record<string, string>> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 전문가입니다.
Facebook 고인 계정 ${action === 'memorialize' ? '추모 계정 전환' : '삭제'} 신청 폼 입력값을 JSON으로 생성합니다.
JSON 외 다른 텍스트는 포함하지 마세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스 정보:
- 신청인(유가족) 성명: ${caseObj.requester.name}
- 신청인 관계: ${caseObj.requester.relation}
- 신청인 이메일: ${caseObj.requester.email}
- 고인 성명: ${caseObj.deceased.name}
- 고인 생년월일: ${caseObj.deceased.birth_date || '미제공'}
- 고인 사망일: ${caseObj.deceased.death_date || '미제공'}
- 고인 Facebook URL: ${accountUrl || '미제공'}
- 신청 유형: ${action === 'memorialize' ? '추모 계정 전환' : '계정 삭제'}

Facebook ${action === 'memorialize' ? '추모화' : '삭제'} 신청 폼의 입력값을 JSON으로 생성하세요:
{
  "your_name": "신청인 성명",
  "your_email": "신청인 이메일",
  "relationship_to_deceased": "고인과의 관계",
  "deceased_name": "고인 성명",
  "deceased_profile_url": "고인 프로필 URL",
  "proof_of_death": "사망진단서 첨부 예정",
  "proof_of_authority": "가족관계증명서 첨부 예정",
  "request_details": "신청 상세 내용 (한국어로 작성)"
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

// 운영자 참고 사항 생성 (Claude)
async function generateOperatorNotes(
  caseObj: CaseObject,
  action: 'memorialize' | 'delete'
): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 400,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀 운영팀을 위한 AI입니다.
Facebook 계정 ${action === 'memorialize' ? '추모화' : '삭제'} 처리 시 운영자가 주의해야 할 사항을 간결하게 정리합니다.
한국어, 3~5줄로 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `고인: ${caseObj.deceased.name} | 신청 유형: ${action === 'memorialize' ? '추모 계정 전환' : '계정 삭제'}
Instagram 삭제 병행 여부: ${caseObj.flags?.instagram_delete ? '예' : '아니오'}

운영자 주의사항을 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : 'Facebook 폼 제출 후 처리 현황을 추적하세요.'
}

// ============================================================
// 메인 — Facebook Draft Agent 실행
// ============================================================
export async function runFacebookDraftAgent(
  caseObj: CaseObject
): Promise<AgentResult & { draft?: DraftResult }> {
  console.log('\n📘 [Facebook Draft Agent] 초안 작성 시작')

  const service = caseObj.services.find(s => s.platform === 'facebook')
  if (!service) {
    return {
      success: false,
      agent: 'facebook-draft-agent',
      message: '케이스에 Facebook 서비스가 없습니다.',
      error: 'service_not_found',
    }
  }

  try {
    console.log(`   액션: ${service.action} | URL: ${service.account_url || '미제공'}`)

    // 1. 폼 필드 생성
    console.log('📝 Facebook 신청 폼 입력값 생성 중...')
    const formFields = await generateFacebookFormFields(
      caseObj,
      service.action,
      service.account_url
    )

    // 2. 운영자 참고 사항
    const operatorNotes = await generateOperatorNotes(caseObj, service.action)

    // 3. 첨부 파일 목록
    const attachments = ['사망진단서.pdf', '가족관계증명서.pdf', '유가족_신분증.jpg']

    // 4. 경고 사항
    const warnings: string[] = []
    if (!service.account_url) {
      warnings.push('⚠️ Facebook 프로필 URL이 없습니다. 의뢰인에게 URL 확인 요청 필요.')
    }
    if (service.action === 'memorialize') {
      warnings.push('ℹ️ 추모 계정 전환 후에는 되돌릴 수 없습니다. 의뢰인에게 재확인 권장.')
    }

    // 5. DraftResult 생성
    const draft: DraftResult = {
      platform: 'facebook',
      action: service.action,
      submission_url: FACEBOOK_URLS[service.action],
      form_fields: formFields,
      attachments,
      warnings,
      operator_notes: operatorNotes,
      created_at: new Date().toISOString(),
    }

    // 케이스에 저장
    if (!caseObj.draft_results) caseObj.draft_results = []
    caseObj.draft_results.push(draft)
    caseObj.updated_at = new Date().toISOString()

    console.log('✅ [Facebook Draft] 초안 작성 완료')
    console.log(`   신청 URL: ${draft.submission_url}`)
    console.log(`   폼 입력값: ${Object.keys(formFields).length}개 필드`)
    console.log(`   첨부 파일: ${attachments.join(', ')}`)
    if (warnings.length) console.log(`   경고: ${warnings.join(' | ')}`)

    return {
      success: true,
      agent: 'facebook-draft-agent',
      message: `Facebook ${service.action} 초안 작성 완료.`,
      data: { platform: 'facebook', action: service.action },
      draft,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Facebook Draft Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'facebook-draft-agent',
      message: 'Facebook 초안 작성 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  console.log('✅ Facebook Draft Agent 모듈 로드 완료')
  console.log('실제 테스트는 orchestrator.ts에서 실행하세요.')
}
