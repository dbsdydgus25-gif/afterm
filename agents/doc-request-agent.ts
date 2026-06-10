// ============================================================
// STAGE 2 — Document Request Agent (서류 수집 요청 에이전트)
// 목적: 고객에게 미수집 서류를 안내하고 업로드를 요청한다
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { CaseObject, RequiredDoc, AgentResult } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 서류 발급 안내 정보
const DOC_ISSUANCE_GUIDE: Record<string, string> = {
  ID: '주민등록증 또는 운전면허증 앞면을 스캔 또는 사진 촬영해 주세요.',
  FAMILY: '정부24(gov.kr) → 가족관계증명서 → 상세 발급 선택 (발급일로부터 3개월 이내)',
  DEATH: '발급처: 사망진단서(병원 발급) 또는 사체검안서(검시관 발급)',
}

// 미제출 서류 목록 추출
function getPendingDocs(caseObj: CaseObject): RequiredDoc[] {
  return caseObj.required_docs.filter(
    doc => doc.status === 'pending' || doc.status === 'rejected'
  )
}

// 고객 친화적 안내 메시지 생성 (Claude)
async function generateRequestMessage(
  caseObj: CaseObject,
  pendingDocs: RequiredDoc[],
  isReminder: boolean,
  reminderNumber?: number
): Promise<string> {
  const docList = pendingDocs.map(doc => {
    const rejected = doc.status === 'rejected'
    const guide = DOC_ISSUANCE_GUIDE[doc.doc_id]
    const rejectionNote = rejected && doc.rejection_reason
      ? `\n   (이전 제출 반려 사유: ${doc.rejection_reason})`
      : ''
    return `• ${doc.name}${rejectionNote}\n  📌 ${guide}`
  }).join('\n\n')

  const reminderContext = isReminder
    ? `이전 요청으로부터 ${reminderNumber === 1 ? '3일' : '7일'}이 지났으나 아직 서류가 제출되지 않았습니다.`
    : ''

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 어시스턴트입니다.
유가족에게 따뜻하고 배려있는 한국어로 서류 제출 안내 메시지를 작성합니다.
고인을 잃은 슬픔에 공감하면서도 절차를 명확히 안내해야 합니다.
링크 자리에는 [업로드 링크]라고 표시하세요.`,
    messages: [
      {
        role: 'user',
        content: `의뢰인: ${caseObj.requester.name}님 (${caseObj.requester.relation})
케이스 번호: ${caseObj.case_id}
${reminderContext}

제출이 필요한 서류:
${docList}

${isReminder ? `리마인더 ${reminderNumber}차 안내 메시지를 작성해주세요.` : '서류 제출 요청 안내 메시지를 작성해주세요.'}
이메일 형식으로, 인사말과 마무리 포함해 주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : getDefaultMessage(caseObj, pendingDocs)
}

// 기본 메시지 (Claude 실패 시 폴백)
function getDefaultMessage(caseObj: CaseObject, pendingDocs: RequiredDoc[]): string {
  const docItems = pendingDocs.map(doc => `✅ ${doc.name}`).join('\n')
  return `안녕하세요, ${caseObj.requester.name} 님.

디지털 유산 행정 대행 서비스 접수가 완료되었습니다.
원활한 처리를 위해 아래 서류를 업로드해 주세요.

${docItems}

📎 서류 업로드: [업로드 링크]

서류 준비가 어려우신 경우 언제든지 문의해 주세요.

에프텀 드림`
}

// 운영자 에스컬레이션 메시지 생성
async function generateEscalationAlert(caseObj: CaseObject): Promise<string> {
  const pendingDocs = getPendingDocs(caseObj)
  const daysSince = Math.floor(
    (Date.now() - new Date(caseObj.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return `⚠️ [운영자 알림] 장기 미제출 케이스

케이스 번호: ${caseObj.case_id}
의뢰인: ${caseObj.requester.name} (${caseObj.requester.email} / ${caseObj.requester.phone})
접수일: ${caseObj.created_at.split('T')[0]}
경과 일수: ${daysSince}일

미제출 서류:
${pendingDocs.map(d => `• ${d.name}`).join('\n')}

직접 연락이 필요합니다.`
}

// ============================================================
// 메인 — Document Request Agent 실행
// ============================================================
export async function runDocRequestAgent(
  caseObj: CaseObject,
  options: {
    isReminder?: boolean
    reminderNumber?: number
    isEscalation?: boolean
  } = {}
): Promise<AgentResult> {
  console.log('\n📋 [Document Request Agent] 서류 요청 시작')

  try {
    const pendingDocs = getPendingDocs(caseObj)

    // 모든 서류가 이미 제출됨
    if (pendingDocs.length === 0) {
      console.log('✅ 모든 서류가 이미 제출되었습니다.')
      return {
        success: true,
        agent: 'doc-request-agent',
        message: '미제출 서류 없음. Progress Tracker로 이관합니다.',
        data: { pending_count: 0 },
      }
    }

    console.log(`   미제출 서류: ${pendingDocs.map(d => d.name).join(', ')}`)

    // 에스컬레이션 케이스 (14일 이상)
    if (options.isEscalation) {
      const alertMsg = await generateEscalationAlert(caseObj)

      // 케이스 상태 보류로 변경
      caseObj.status = 'on_hold'
      caseObj.updated_at = new Date().toISOString()

      // 실제 서비스에서는 운영자에게 알림 발송
      console.log('\n🔴 [운영자 에스컬레이션]')
      console.log(alertMsg)

      caseObj.notification_log!.push({
        type: 'operator',
        sent_at: new Date().toISOString(),
        subject: `[에스컬레이션] ${caseObj.case_id} — 14일 이상 서류 미제출`,
      })

      return {
        success: true,
        agent: 'doc-request-agent',
        message: `케이스 ${caseObj.case_id} 보류 처리 및 운영자 에스컬레이션 완료`,
        data: { alert: alertMsg, case_status: 'on_hold' },
      }
    }

    // 1. 안내 메시지 생성
    console.log('💬 서류 요청 메시지 생성 중...')
    const message = await generateRequestMessage(
      caseObj,
      pendingDocs,
      options.isReminder || false,
      options.reminderNumber
    )

    // 2. 발송 로그 기록
    const subject = options.isReminder
      ? `[에프텀] 서류 제출 안내 (${options.reminderNumber}차 리마인더) - ${caseObj.case_id}`
      : `[에프텀] 서류 제출 요청 - ${caseObj.case_id}`

    caseObj.notification_log!.push({
      type: 'email',
      sent_at: new Date().toISOString(),
      subject,
    })
    caseObj.updated_at = new Date().toISOString()

    // 실제 서비스에서는 이메일 & 카카오 알림톡 발송
    // await sendEmail(caseObj.requester.email, subject, message)
    // await sendKakaoAlimtalk(caseObj.requester.phone, message)

    console.log('\n📨 발송 메시지:')
    console.log('─'.repeat(50))
    console.log(message)
    console.log('─'.repeat(50))

    // 3. 리마인더 스케줄 상태 업데이트
    if (options.isReminder && caseObj.reminder_schedule) {
      const scheduleType = options.reminderNumber === 1 ? '1st' : '2nd'
      const schedule = caseObj.reminder_schedule.find(s => s.type === scheduleType)
      if (schedule) schedule.sent = true
    }

    return {
      success: true,
      agent: 'doc-request-agent',
      message: `서류 요청 발송 완료 (미제출: ${pendingDocs.length}건)`,
      data: {
        pending_docs: pendingDocs.map(d => d.name),
        message_sent: true,
        subject,
      },
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Document Request Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'doc-request-agent',
      message: '서류 요청 발송 중 오류가 발생했습니다.',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    requester: {
      name: '홍길순',
      relation: '딸',
      email: 'test@example.com',
      phone: '010-1234-5678',
    },
    deceased: {
      name: '홍길동',
      birth_date: '1950-01-15',
    },
    services: [
      { platform: 'facebook', action: 'memorialize' },
      { platform: 'kakaotalk', action: 'delete' },
    ],
    required_docs: [
      { doc_id: 'ID', name: '유가족 신분증 사본', status: 'pending', upload_count: 0 },
      { doc_id: 'FAMILY', name: '가족관계증명서', status: 'pending', upload_count: 0 },
      { doc_id: 'DEATH', name: '사망진단서', status: 'pending', upload_count: 0 },
    ],
    flags: { instagram_delete: false, kakaopay_guide_needed: false },
    status: 'pending_collection',
    stage: 2,
    notification_log: [],
    reminder_schedule: [],
  }

  runDocRequestAgent(testCase).then(result => {
    console.log('\n--- Document Request Agent 결과 ---')
    console.log(JSON.stringify(result, null, 2))
  })
}
