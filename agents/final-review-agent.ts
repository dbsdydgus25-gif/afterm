// ============================================================
// STAGE 6 — Final Review Agent (최종 검토 에이전트)
// 목적: 모든 Draft Agent 결과를 통합하고 최종 패키지를 생성한다
//       - 의뢰인에게 처리 완료 패키지(요약서) 전달
//       - 운영자에게 실행 체크리스트 전달
//       - 케이스 상태를 'review_pending'으로 업데이트
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, DraftResult, AgentResult } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 의뢰인용 처리 완료 요약서 생성 (Claude)
async function generateClientSummary(
  caseObj: CaseObject,
  draftResults: DraftResult[]
): Promise<string> {
  const platformSummary = draftResults.map(d => {
    const platformKo: Record<string, string> = {
      facebook: '페이스북',
      instagram: '인스타그램',
      kakaotalk: '카카오톡',
      google: '구글',
      twitter: '트위터/X',
    }
    const actionKo = d.action === 'memorialize' ? '추모 계정 전환' : '계정 삭제'
    return `• ${platformKo[d.platform] || d.platform}: ${actionKo} 신청 준비 완료`
  }).join('\n')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1000,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 어시스턴트입니다.
모든 처리 준비가 완료된 후 의뢰인(유가족)에게 보내는 최종 안내 메시지를 작성합니다.
따뜻하고 전문적인 한국어로 작성하고, 앞으로의 절차를 명확히 안내해야 합니다.
이메일 형식으로 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `의뢰인: ${caseObj.requester.name}님 (${caseObj.requester.relation})
케이스 번호: ${caseObj.case_id}
고인: ${caseObj.deceased.name}

처리 준비 완료 서비스:
${platformSummary}

모든 신청 준비가 완료되었으며, 에프텀 운영팀이 각 플랫폼에 순차 제출할 예정입니다.

최종 안내 이메일을 작성해주세요. 다음 내용을 포함하세요:
1. 처리 준비 완료 안내
2. 각 플랫폼별 예상 처리 기간
3. 결과 통보 방법
4. 추가 문의 안내`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : `${caseObj.requester.name}님, 모든 처리 준비가 완료되었습니다.`
}

// 운영자용 실행 체크리스트 생성 (Claude)
async function generateOperatorChecklist(
  caseObj: CaseObject,
  draftResults: DraftResult[]
): Promise<string> {
  const draftSummary = draftResults.map(d => {
    const warnings = d.warnings?.join(' | ') || '없음'
    const submitMethod = d.email_draft ? '이메일 발송' : d.letter_draft ? '이메일/우편' : '온라인 폼 제출'
    return `[${d.platform.toUpperCase()}] ${d.action}
  - 제출 방법: ${submitMethod}
  - URL/이메일: ${d.submission_url || '폼 없음'}
  - 첨부 파일: ${d.attachments.join(', ')}
  - 주의사항: ${warnings}`
  }).join('\n\n')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1200,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀 운영팀 AI입니다.
각 플랫폼별 실행 순서와 체크리스트를 한국어로 작성합니다.
실용적이고 구체적인 단계별 가이드를 제공하세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스: ${caseObj.case_id} | 의뢰인: ${caseObj.requester.name}

플랫폼별 초안 현황:
${draftSummary}

운영자가 순서대로 따라할 실행 체크리스트를 작성해주세요.
각 플랫폼별 제출 순서, 주의사항, 완료 확인 방법을 포함하세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : '각 플랫폼별 폼 제출 후 접수번호 기록 요망.'
}

// ============================================================
// 메인 — Final Review Agent 실행
// ============================================================
export async function runFinalReviewAgent(
  caseObj: CaseObject
): Promise<AgentResult & { client_summary?: string; operator_checklist?: string }> {
  console.log('\n📋 [Final Review Agent] 최종 검토 시작')
  console.log(`   케이스: ${caseObj.case_id}`)

  try {
    // 1. Draft 결과 확인
    const draftResults = caseObj.draft_results || []
    if (draftResults.length === 0) {
      return {
        success: false,
        agent: 'final-review-agent',
        message: 'Draft Agent 결과가 없습니다. 먼저 Draft Agent를 실행하세요.',
        error: 'no_draft_results',
      }
    }

    const successfulDrafts = draftResults.filter(d => d.platform)
    console.log(`   초안 완료: ${successfulDrafts.map(d => d.platform).join(', ')}`)

    // 2. 의뢰인 요약서 생성
    console.log('💬 의뢰인 최종 안내 메시지 생성 중...')
    const clientSummary = await generateClientSummary(caseObj, successfulDrafts)

    // 3. 운영자 체크리스트 생성
    console.log('📋 운영자 실행 체크리스트 생성 중...')
    const operatorChecklist = await generateOperatorChecklist(caseObj, successfulDrafts)

    // 4. 최종 패키지 구성
    const finalPackage = JSON.stringify({
      case_id: caseObj.case_id,
      generated_at: new Date().toISOString(),
      requester: caseObj.requester,
      deceased: caseObj.deceased,
      services_count: successfulDrafts.length,
      draft_results: successfulDrafts,
      client_summary: clientSummary,
      operator_checklist: operatorChecklist,
    }, null, 2)

    // 5. 케이스 상태 업데이트
    caseObj.final_package = finalPackage
    caseObj.status = 'review_pending'
    caseObj.stage = 6
    caseObj.updated_at = new Date().toISOString()

    // 6. 알림 로그
    caseObj.notification_log!.push({
      type: 'email',
      sent_at: new Date().toISOString(),
      subject: `[에프텀] 디지털 유산 처리 준비 완료 안내 - ${caseObj.case_id}`,
    })
    caseObj.notification_log!.push({
      type: 'operator',
      sent_at: new Date().toISOString(),
      subject: `[운영자] ${caseObj.case_id} 최종 패키지 준비 완료 — 실행 요청`,
    })

    console.log('\n✅ [Final Review Agent] 최종 패키지 생성 완료!')
    console.log('\n📨 의뢰인 안내 메시지:')
    console.log('─'.repeat(60))
    console.log(clientSummary)
    console.log('─'.repeat(60))
    console.log('\n📋 운영자 체크리스트:')
    console.log('─'.repeat(60))
    console.log(operatorChecklist)
    console.log('─'.repeat(60))

    return {
      success: true,
      agent: 'final-review-agent',
      message: `최종 패키지 생성 완료. 케이스 상태: review_pending. 운영자 실행 대기 중.`,
      data: {
        case_id: caseObj.case_id,
        status: 'review_pending',
        drafts_count: successfulDrafts.length,
      },
      client_summary: clientSummary,
      operator_checklist: operatorChecklist,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Final Review Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'final-review-agent',
      message: '최종 검토 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  console.log('✅ Final Review Agent 모듈 로드 완료')
  console.log('실제 테스트는 orchestrator.ts에서 실행하세요.')
}
