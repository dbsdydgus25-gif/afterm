// ============================================================
// STAGE 4 — Progress Tracker Agent (진행 상황 추적 에이전트)
// 목적: 케이스 전체 진행 상황을 추적하고 의뢰인에게 중간 업데이트를 보내며
//       모든 서류가 검증되면 Draft Agent들을 병렬로 트리거한다
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, AgentResult } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 케이스 진행률 계산
function calculateProgress(caseObj: CaseObject): {
  doc_progress: number
  verified_count: number
  total_docs: number
  service_count: number
  stage_label: string
} {
  const totalDocs = caseObj.required_docs.length
  const verifiedCount = caseObj.required_docs.filter(d => d.status === 'verified').length
  const docProgress = Math.round((verifiedCount / totalDocs) * 100)

  const stageLabels: Record<number, string> = {
    1: '접수 완료',
    2: '서류 수집 중',
    3: '서류 검증 중',
    4: '초안 작성 준비',
    5: '처리 초안 작성 중',
    6: '최종 검토 중',
    7: '완료',
  }

  return {
    doc_progress: docProgress,
    verified_count: verifiedCount,
    total_docs: totalDocs,
    service_count: caseObj.services.length,
    stage_label: stageLabels[caseObj.stage] || '처리 중',
  }
}

// 의뢰인 진행 상황 업데이트 메시지 생성 (Claude)
async function generateProgressMessage(
  caseObj: CaseObject,
  progress: ReturnType<typeof calculateProgress>
): Promise<string> {
  const serviceList = caseObj.services
    .map(s => {
      const platformName: Record<string, string> = {
        facebook: '페이스북',
        instagram: '인스타그램',
        kakaotalk: '카카오톡',
        google: '구글',
        twitter: '트위터/X',
      }
      const actionName = s.action === 'memorialize' ? '추모 계정 전환' : '계정 삭제'
      return `• ${platformName[s.platform] || s.platform}: ${actionName}`
    })
    .join('\n')

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 어시스턴트입니다.
유가족에게 따뜻하고 전문적인 한국어로 케이스 진행 상황을 안내합니다.
희망과 신뢰를 드리는 어조로, 3~5문장으로 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `의뢰인: ${caseObj.requester.name}님 (${caseObj.requester.relation})
케이스 번호: ${caseObj.case_id}
현재 단계: ${progress.stage_label}
서류 검증: ${progress.verified_count}/${progress.total_docs}건 완료 (${progress.doc_progress}%)

처리 예정 서비스:
${serviceList}

진행 상황 안내 메시지를 이메일 형식으로 작성해주세요.
"초안 작성이 곧 시작됩니다"는 내용도 포함해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text'
    ? textBlock.text
    : `${caseObj.requester.name}님, 모든 서류 검증이 완료되었습니다. 각 플랫폼별 처리 초안을 작성하기 시작합니다.`
}

// 플랫폼별 Draft Agent 목록 생성
function getDraftAgentsToRun(
  caseObj: CaseObject
): Array<{ platform: string; action: string; agent_file: string }> {
  return caseObj.services.map(s => ({
    platform: s.platform,
    action: s.action,
    agent_file: `./draft-agents/${s.platform}-draft`,
  }))
}

// ============================================================
// 메인 — Progress Tracker Agent 실행
// ============================================================
export async function runProgressTrackerAgent(
  caseObj: CaseObject
): Promise<AgentResult & { draft_agents?: Array<{ platform: string; action: string; agent_file: string }> }> {
  console.log('\n📊 [Progress Tracker Agent] 진행 상황 추적 시작')
  console.log(`   케이스: ${caseObj.case_id} | 단계: ${caseObj.stage}`)

  try {
    // 1. 진행률 계산
    const progress = calculateProgress(caseObj)
    console.log(`   서류: ${progress.verified_count}/${progress.total_docs} 검증 완료`)
    console.log(`   단계: ${progress.stage_label}`)

    // 2. 서류가 모두 검증됐는지 확인
    if (progress.verified_count < progress.total_docs) {
      return {
        success: false,
        agent: 'progress-tracker-agent',
        message: `서류 ${progress.total_docs - progress.verified_count}건이 아직 검증되지 않았습니다.`,
        data: { progress },
      }
    }

    // 3. 진행 상황 업데이트 메시지 생성
    console.log('💬 진행 상황 메시지 생성 중...')
    const progressMsg = await generateProgressMessage(caseObj, progress)

    // 4. 알림 로그 기록
    caseObj.notification_log!.push({
      type: 'email',
      sent_at: new Date().toISOString(),
      subject: `[에프텀] 케이스 진행 상황 안내 - ${caseObj.case_id}`,
    })

    // 실제 서비스에서는 이메일 발송
    // await sendEmail(caseObj.requester.email, subject, progressMsg)

    console.log('\n📨 진행 상황 메시지:')
    console.log('─'.repeat(50))
    console.log(progressMsg)
    console.log('─'.repeat(50))

    // 5. Draft Agent 목록 준비
    const draftAgents = getDraftAgentsToRun(caseObj)
    console.log(`\n🚀 병렬 실행할 Draft Agent: ${draftAgents.map(a => a.platform).join(', ')}`)

    // 6. 케이스 상태 업데이트
    caseObj.status = 'drafting'
    caseObj.stage = 5
    caseObj.updated_at = new Date().toISOString()

    return {
      success: true,
      agent: 'progress-tracker-agent',
      message: `진행 상황 업데이트 완료. ${draftAgents.length}개 Draft Agent를 병렬로 트리거합니다.`,
      data: {
        progress,
        draft_agents: draftAgents,
        progress_message: progressMsg,
      },
      draft_agents: draftAgents,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Progress Tracker Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'progress-tracker-agent',
      message: '진행 상황 추적 중 오류가 발생했습니다.',
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
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    requester: {
      name: '홍길순',
      relation: '딸',
      email: 'test@example.com',
      phone: '010-1234-5678',
    },
    deceased: { name: '홍길동', birth_date: '1950-01-15', death_date: '2024-11-20' },
    services: [
      { platform: 'facebook', action: 'memorialize', account_url: 'https://facebook.com/test' },
      { platform: 'instagram', action: 'delete' },
      { platform: 'kakaotalk', action: 'memorialize', phone: '010-9876-5432' },
    ],
    required_docs: [
      { doc_id: 'ID', name: '유가족 신분증 사본', status: 'verified', upload_count: 1, verified_at: new Date().toISOString() },
      { doc_id: 'FAMILY', name: '가족관계증명서', status: 'verified', upload_count: 1, verified_at: new Date().toISOString() },
      { doc_id: 'DEATH', name: '사망진단서', status: 'verified', upload_count: 1, verified_at: new Date().toISOString() },
    ],
    flags: { instagram_delete: true, kakaopay_guide_needed: false },
    status: 'verifying',
    stage: 4,
    notification_log: [],
    reminder_schedule: [],
  }

  runProgressTrackerAgent(testCase).then(result => {
    console.log('\n--- Progress Tracker Agent 결과 ---')
    console.log(JSON.stringify(result, null, 2))
  })
}
