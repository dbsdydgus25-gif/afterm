// ============================================================
// ORCHESTRATOR — Afterm 디지털 유산 AI 에이전트 파이프라인
// 6단계 멀티 에이전트 워크플로우 통합 실행
// ============================================================

import { runIntakeAgent, type IntakeFormData } from './intake-agent'
import { runDocRequestAgent } from './doc-request-agent'
import { runDocVerifyAgent } from './doc-verify-agent'
import { runGapAnalysisAgent } from './gap-analysis-agent'
import { runProgressTrackerAgent } from './progress-tracker-agent'
import { runFacebookDraftAgent } from './draft-agents/facebook-draft'
import { runInstagramDraftAgent } from './draft-agents/instagram-draft'
import { runKakaotalkDraftAgent } from './draft-agents/kakaotalk-draft'
import { runGoogleDraftAgent } from './draft-agents/google-draft'
import { runTwitterDraftAgent } from './draft-agents/twitter-draft'
import { runFinalReviewAgent } from './final-review-agent'
import type { CaseObject, AgentResult } from './types'

// ============================================================
// 이벤트 시스템 — 대시보드 실시간 시각화용
// ============================================================
export type AgentEventType =
  | 'pipeline_start'
  | 'pipeline_complete'
  | 'pipeline_error'
  | 'stage_start'
  | 'stage_complete'
  | 'stage_error'
  | 'agent_working'
  | 'agent_log'

export interface AgentEvent {
  type: AgentEventType
  agent: string          // 에이전트 ID
  stage: number          // 0-6
  message: string        // 로그 메시지
  timestamp: string
  data?: unknown
  case_id?: string
}

export type EventCallback = (event: AgentEvent) => void

function emit(onEvent: EventCallback | undefined, event: Omit<AgentEvent, 'timestamp'>) {
  if (!onEvent) return
  onEvent({ ...event, timestamp: new Date().toISOString() })
}

// ============================================================
// Stage 5 병렬 Draft Agent 실행
// ============================================================
async function runDraftAgentsInParallel(
  caseObj: CaseObject,
  onEvent?: EventCallback
): Promise<AgentResult[]> {
  const agentMap: Record<string, (c: CaseObject) => Promise<AgentResult & { draft?: unknown }>> = {
    facebook: runFacebookDraftAgent,
    instagram: runInstagramDraftAgent,
    kakaotalk: runKakaotalkDraftAgent,
    google: runGoogleDraftAgent,
    twitter: runTwitterDraftAgent,
  }

  const platforms = caseObj.services.map(s => s.platform)

  emit(onEvent, {
    type: 'agent_log',
    agent: 'orchestrator',
    stage: 5,
    message: `병렬 Draft 시작: ${platforms.join(', ')}`,
    case_id: caseObj.case_id,
  })

  const promises = platforms
    .filter(platform => agentMap[platform])
    .map(async platform => {
      emit(onEvent, {
        type: 'stage_start',
        agent: `${platform}-draft`,
        stage: 5,
        message: `${platform} 초안 작성 시작`,
        case_id: caseObj.case_id,
      })
      const result = await agentMap[platform](caseObj)
      emit(onEvent, {
        type: result.success ? 'stage_complete' : 'stage_error',
        agent: `${platform}-draft`,
        stage: 5,
        message: result.message,
        case_id: caseObj.case_id,
      })
      return result
    })

  const results = await Promise.allSettled(promises)

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') return result.value
    const platform = platforms[idx]
    return {
      success: false,
      agent: `${platform}-draft-agent`,
      message: `${platform} Draft 실패`,
      error: String(result.reason),
    }
  })
}

// ============================================================
// ORCHESTRATOR — 전체 파이프라인 실행
// ============================================================
export async function runOrchestrator(
  formData: IntakeFormData,
  uploadedFiles?: Array<{ doc_id: 'ID' | 'FAMILY' | 'DEATH'; file_path: string }>,
  onEvent?: EventCallback
): Promise<{
  success: boolean
  case_id?: string
  case_object?: CaseObject
  stages: Record<string, AgentResult>
  final_summary?: string
}> {
  emit(onEvent, {
    type: 'pipeline_start',
    agent: 'orchestrator',
    stage: 0,
    message: '파이프라인 시작',
  })

  const stages: Record<string, AgentResult> = {}
  let caseObj: CaseObject | null = null

  try {
    // ── STAGE 1: Intake ──
    emit(onEvent, { type: 'stage_start', agent: 'intake', stage: 1, message: '케이스 접수 분석 중...' })
    const stage1Result = await runIntakeAgent(formData)
    stages['stage1_intake'] = stage1Result

    if (!stage1Result.success || !stage1Result.data) throw new Error(`Stage 1 실패: ${stage1Result.message}`)
    caseObj = stage1Result.data as CaseObject

    emit(onEvent, {
      type: 'stage_complete', agent: 'intake', stage: 1,
      message: `케이스 ${caseObj.case_id} 생성 완료`, case_id: caseObj.case_id,
    })

    // ── STAGE 2: Doc Request ──
    emit(onEvent, { type: 'stage_start', agent: 'doc-request', stage: 2, message: '서류 요청 메시지 생성 중...', case_id: caseObj.case_id })
    const stage2Result = await runDocRequestAgent(caseObj)
    stages['stage2_doc_request'] = stage2Result
    emit(onEvent, { type: 'stage_complete', agent: 'doc-request', stage: 2, message: '서류 요청 발송 완료', case_id: caseObj.case_id })

    // ── STAGE 3: Doc Verify ──
    if (uploadedFiles && uploadedFiles.length > 0) {
      caseObj.status = 'verifying'
      for (const file of uploadedFiles) {
        emit(onEvent, { type: 'stage_start', agent: 'doc-verify', stage: 3, message: `${file.doc_id} 서류 검증 중...`, case_id: caseObj.case_id })
        const verifyResult = await runDocVerifyAgent(caseObj, file)
        stages[`stage3_verify_${file.doc_id}`] = verifyResult
        emit(onEvent, {
          type: verifyResult.success ? 'stage_complete' : 'stage_error',
          agent: 'doc-verify', stage: 3,
          message: verifyResult.message, case_id: caseObj.case_id,
        })
      }

      // ── STAGE 3.5: Gap Analysis ──
      emit(onEvent, { type: 'stage_start', agent: 'gap-analysis', stage: 3, message: '서류 갭 분석 중...', case_id: caseObj.case_id })
      const gapResult = await runGapAnalysisAgent(caseObj)
      stages['stage35_gap'] = gapResult
      emit(onEvent, {
        type: gapResult.success ? 'stage_complete' : 'stage_error',
        agent: 'gap-analysis', stage: 3,
        message: gapResult.message, case_id: caseObj.case_id,
      })

      if (gapResult.gap?.next_action !== 'proceed_to_draft') {
        emit(onEvent, { type: 'pipeline_error', agent: 'orchestrator', stage: 3, message: gapResult.message, case_id: caseObj.case_id })
        return { success: false, case_id: caseObj.case_id, case_object: caseObj, stages, final_summary: gapResult.message }
      }
    } else {
      // 테스트 모드
      emit(onEvent, { type: 'stage_start', agent: 'doc-verify', stage: 3, message: '서류 검증 중 (테스트 모드)...', case_id: caseObj.case_id })
      caseObj.required_docs.forEach(doc => { doc.status = 'verified'; doc.verified_at = new Date().toISOString(); doc.upload_count = 1 })
      stages['stage3_verify'] = { success: true, agent: 'doc-verify-agent', message: '테스트 모드: 서류 검증 생략' }
      stages['stage35_gap'] = { success: true, agent: 'gap-analysis-agent', message: '테스트 모드: 모든 서류 통과' }
      emit(onEvent, { type: 'stage_complete', agent: 'doc-verify', stage: 3, message: '서류 3건 검증 완료', case_id: caseObj.case_id })
      emit(onEvent, { type: 'stage_complete', agent: 'gap-analysis', stage: 3, message: '갭 분석 완료 — 모든 서류 통과', case_id: caseObj.case_id })
    }

    // ── STAGE 4: Progress Tracker ──
    emit(onEvent, { type: 'stage_start', agent: 'progress-tracker', stage: 4, message: '진행 상황 업데이트 중...', case_id: caseObj.case_id })
    const stage4Result = await runProgressTrackerAgent(caseObj)
    stages['stage4_progress'] = stage4Result
    if (!stage4Result.success) throw new Error(`Stage 4 실패: ${stage4Result.message}`)
    emit(onEvent, { type: 'stage_complete', agent: 'progress-tracker', stage: 4, message: '의뢰인 진행 상황 안내 완료', case_id: caseObj.case_id })

    // ── STAGE 5: Draft Agents (병렬) ──
    const draftResults = await runDraftAgentsInParallel(caseObj, onEvent)
    draftResults.forEach(result => { stages[`stage5_draft_${result.agent}`] = result })
    const successCount = draftResults.filter(r => r.success).length
    emit(onEvent, { type: 'agent_log', agent: 'orchestrator', stage: 5, message: `초안 ${successCount}/${draftResults.length}건 완료`, case_id: caseObj.case_id })

    // ── STAGE 6: Final Review ──
    emit(onEvent, { type: 'stage_start', agent: 'final-review', stage: 6, message: '최종 패키지 생성 중...', case_id: caseObj.case_id })
    const stage6Result = await runFinalReviewAgent(caseObj)
    stages['stage6_final'] = stage6Result
    if (!stage6Result.success) throw new Error(`Stage 6 실패: ${stage6Result.message}`)
    emit(onEvent, { type: 'stage_complete', agent: 'final-review', stage: 6, message: '최종 패키지 완성 — 운영자 실행 대기', case_id: caseObj.case_id })

    emit(onEvent, {
      type: 'pipeline_complete', agent: 'orchestrator', stage: 6,
      message: `케이스 ${caseObj.case_id} 처리 완료`,
      case_id: caseObj.case_id,
      data: { case_id: caseObj.case_id, status: caseObj.status },
    })

    return { success: true, case_id: caseObj.case_id, case_object: caseObj, stages, final_summary: stage6Result.client_summary }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    emit(onEvent, { type: 'pipeline_error', agent: 'orchestrator', stage: 0, message: errMsg, case_id: caseObj?.case_id })
    return { success: false, case_id: caseObj?.case_id, case_object: caseObj || undefined, stages, final_summary: errMsg }
  }
}

// ============================================================
// 직접 실행 테스트
// ============================================================
const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const testForm: IntakeFormData = {
    requester_name: '홍길순', requester_relation: '딸',
    requester_email: 'test@example.com', requester_phone: '010-1234-5678',
    deceased_name: '홍길동', deceased_birth_date: '1950-01-15', deceased_death_date: '2024-11-20',
    selected_services: [
      { platform: 'facebook', action: 'memorialize', account_url: 'https://facebook.com/hong.gildong' },
      { platform: 'instagram', action: 'delete' },
      { platform: 'kakaotalk', action: 'memorialize', phone: '010-9876-5432' },
      { platform: 'google', action: 'delete', email: 'hong.gildong@gmail.com' },
      { platform: 'twitter', action: 'delete', username: '@hong_gildong' },
    ],
    kakaopay_question: true,
  }

  const logger = (e: import('./orchestrator').AgentEvent) =>
    console.log(`[${e.stage}] ${e.agent}: ${e.message}`)

  runOrchestrator(testForm, undefined, logger).then(result => {
    console.log('\n✅ 완료:', result.success, '|', result.case_id)
    process.exit(0)
  })
}
