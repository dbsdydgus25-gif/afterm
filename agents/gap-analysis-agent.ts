// ============================================================
// STAGE 3.5 — Gap Analysis Agent (서류 갭 분석 에이전트)
// 목적: 검증 결과를 분석하여 다음 액션을 결정한다
//       - 모든 서류 통과 → Progress Tracker (Stage 4)로 이관
//       - 일부 실패 → Doc Request Agent로 재요청
//       - 반복 실패 → 운영자 에스컬레이션
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, RequiredDoc, AgentResult } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 갭 분석 결과 타입
export interface GapAnalysisResult {
  all_verified: boolean
  verified_docs: string[]
  pending_docs: string[]
  rejected_docs: Array<{
    doc_id: string
    name: string
    rejection_reason: string
    upload_count: number
  }>
  needs_escalation: boolean
  escalation_docs: string[]
  next_action: 'proceed_to_draft' | 'request_resubmit' | 'escalate_operator'
  summary: string
}

// 서류 현황 분석
function analyzeDocStatus(caseObj: CaseObject): GapAnalysisResult {
  const verified: string[] = []
  const pending: string[] = []
  const rejected: GapAnalysisResult['rejected_docs'] = []
  const needsEscalation: string[] = []

  for (const doc of caseObj.required_docs) {
    if (doc.status === 'verified') {
      verified.push(doc.doc_id)
    } else if (doc.status === 'pending' || doc.status === 'uploaded') {
      pending.push(doc.doc_id)
    } else if (doc.status === 'rejected') {
      rejected.push({
        doc_id: doc.doc_id,
        name: doc.name,
        rejection_reason: doc.rejection_reason || '검증 실패',
        upload_count: doc.upload_count || 0,
      })

      // 3회 이상 실패 시 에스컬레이션 필요
      if ((doc.upload_count || 0) >= 3) {
        needsEscalation.push(doc.doc_id)
      }
    }
  }

  const allVerified = verified.length === caseObj.required_docs.length

  let nextAction: GapAnalysisResult['next_action']
  if (allVerified) {
    nextAction = 'proceed_to_draft'
  } else if (needsEscalation.length > 0) {
    nextAction = 'escalate_operator'
  } else {
    nextAction = 'request_resubmit'
  }

  return {
    all_verified: allVerified,
    verified_docs: verified,
    pending_docs: pending,
    rejected_docs: rejected,
    needs_escalation: needsEscalation.length > 0,
    escalation_docs: needsEscalation,
    next_action: nextAction,
    summary: '',
  }
}

// Claude로 갭 분석 요약 및 다음 액션 가이드 생성
async function generateGapSummary(
  caseObj: CaseObject,
  gap: GapAnalysisResult
): Promise<string> {
  const statusLines = caseObj.required_docs.map(doc => {
    const statusIcon = {
      verified: '✅',
      pending: '⏳',
      uploaded: '🔄',
      rejected: '❌',
    }[doc.status]
    const retryInfo = (doc.upload_count || 0) > 0 ? ` (${doc.upload_count}회 시도)` : ''
    const rejReason = doc.rejection_reason ? ` — 사유: ${doc.rejection_reason}` : ''
    return `${statusIcon} ${doc.name}${retryInfo}${rejReason}`
  }).join('\n')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 운영 AI입니다.
서류 검증 현황을 분석하고 운영자가 보기 좋은 한국어 요약을 작성합니다.
3~5줄로 간결하게 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `케이스: ${caseObj.case_id}
의뢰인: ${caseObj.requester.name} (${caseObj.requester.relation})
고인: ${caseObj.deceased.name}

서류 검증 현황:
${statusLines}

다음 액션: ${gap.next_action === 'proceed_to_draft' ? '초안 작성으로 진행' : gap.next_action === 'escalate_operator' ? '운영자 에스컬레이션' : '재제출 요청'}

위 상황에 대한 운영자 요약 메시지를 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : `서류 검증 현황: 완료 ${gap.verified_docs.length}/${caseObj.required_docs.length}건`
}

// 운영자 에스컬레이션 알림 생성
async function generateEscalationReport(
  caseObj: CaseObject,
  gap: GapAnalysisResult
): Promise<string> {
  const escalationDetails = gap.rejected_docs
    .filter(d => gap.escalation_docs.includes(d.doc_id))
    .map(d => `• ${d.name}: ${d.upload_count}회 시도, 사유 — ${d.rejection_reason}`)
    .join('\n')

  return `🚨 [Gap Analysis — 운영자 에스컬레이션 필요]

케이스 번호: ${caseObj.case_id}
의뢰인: ${caseObj.requester.name} | 연락처: ${caseObj.requester.phone} | ${caseObj.requester.email}

3회 이상 검증 실패 서류:
${escalationDetails}

조치 필요:
- 의뢰인에게 직접 연락하여 올바른 서류 제출 안내
- 필요 시 담당자가 서류 수령 대행 검토
- 케이스 상태: on_hold (보류)`
}

// ============================================================
// 메인 — Gap Analysis Agent 실행
// ============================================================
export async function runGapAnalysisAgent(
  caseObj: CaseObject
): Promise<AgentResult & { gap?: GapAnalysisResult }> {
  console.log('\n🔎 [Gap Analysis Agent] 갭 분석 시작')
  console.log(`   케이스: ${caseObj.case_id}`)

  try {
    // 1. 서류 현황 분석
    const gap = analyzeDocStatus(caseObj)

    // 2. Claude 요약 생성
    console.log('💬 갭 분석 요약 생성 중...')
    gap.summary = await generateGapSummary(caseObj, gap)

    console.log('\n📊 [갭 분석 결과]')
    console.log(`   완료: ${gap.verified_docs.join(', ') || '없음'}`)
    console.log(`   미제출/반려: ${[...gap.pending_docs, ...gap.rejected_docs.map(d => d.doc_id)].join(', ') || '없음'}`)
    console.log(`   에스컬레이션 필요: ${gap.needs_escalation ? gap.escalation_docs.join(', ') : '없음'}`)
    console.log(`   다음 액션: ${gap.next_action}`)
    console.log('\n요약:')
    console.log(gap.summary)

    // 3. 다음 액션 결정
    switch (gap.next_action) {
      case 'proceed_to_draft': {
        // 모든 서류 통과 — Progress Tracker (Stage 4)로 이관
        caseObj.status = 'drafting'
        caseObj.stage = 4
        caseObj.updated_at = new Date().toISOString()

        console.log('\n✅ 모든 서류 검증 완료 → Draft Agent로 이관')

        return {
          success: true,
          agent: 'gap-analysis-agent',
          message: '모든 서류 검증 완료. Progress Tracker Agent로 이관합니다.',
          data: { next_stage: 'progress-tracker', gap },
          gap,
        }
      }

      case 'escalate_operator': {
        // 3회 이상 실패 — 운영자 에스컬레이션
        const report = await generateEscalationReport(caseObj, gap)

        caseObj.status = 'on_hold'
        caseObj.updated_at = new Date().toISOString()

        caseObj.notification_log!.push({
          type: 'operator',
          sent_at: new Date().toISOString(),
          subject: `[에스컬레이션] ${caseObj.case_id} — 서류 3회 이상 검증 실패`,
        })

        console.log('\n🔴 [운영자 에스컬레이션]')
        console.log(report)

        return {
          success: false,
          agent: 'gap-analysis-agent',
          message: `케이스 보류 처리. 운영자 에스컬레이션이 필요합니다.`,
          data: { next_stage: 'operator_manual', report, gap },
          gap,
        }
      }

      case 'request_resubmit': {
        // 일부 서류 미제출/반려 — Doc Request Agent로 재요청
        const docsToRetry = [
          ...gap.pending_docs,
          ...gap.rejected_docs.map(d => d.doc_id),
        ]

        caseObj.status = 'collecting'
        caseObj.stage = 2
        caseObj.updated_at = new Date().toISOString()

        console.log(`\n🔄 재제출 요청 필요: ${docsToRetry.join(', ')}`)
        console.log('→ Doc Request Agent로 이관')

        return {
          success: false,
          agent: 'gap-analysis-agent',
          message: `${docsToRetry.length}건 서류 재제출 필요. Doc Request Agent로 이관합니다.`,
          data: { next_stage: 'doc-request', docs_to_retry: docsToRetry, gap },
          gap,
        }
      }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Gap Analysis Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'gap-analysis-agent',
      message: '갭 분석 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

// ============================================================
// 직접 실행 테스트
// ============================================================
const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  const testCase: CaseObject = {
    case_id: 'CASE-2024-0001',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    requester: {
      name: '홍길순',
      relation: '딸',
      email: 'test@example.com',
      phone: '010-1234-5678',
    },
    deceased: { name: '홍길동', birth_date: '1950-01-15' },
    services: [{ platform: 'facebook', action: 'memorialize' }],
    required_docs: [
      { doc_id: 'ID', name: '유가족 신분증 사본', status: 'verified', upload_count: 1, verified_at: new Date().toISOString() },
      { doc_id: 'FAMILY', name: '가족관계증명서', status: 'verified', upload_count: 1, verified_at: new Date().toISOString() },
      { doc_id: 'DEATH', name: '사망진단서', status: 'rejected', upload_count: 2, rejection_reason: '이미지 품질이 불량합니다.' },
    ],
    flags: { instagram_delete: false, kakaopay_guide_needed: false },
    status: 'verifying',
    stage: 3,
    notification_log: [],
    reminder_schedule: [],
  }

  runGapAnalysisAgent(testCase).then(result => {
    console.log('\n--- Gap Analysis Agent 결과 ---')
    console.log(JSON.stringify(result, null, 2))
  })
}
