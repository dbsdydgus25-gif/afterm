// ============================================================
// STAGE 1 — Intake Agent (케이스 접수 분석 에이전트)
// 목적: 고객 최초 입력을 파싱하여 Case Object를 생성한다
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type {
  CaseObject,
  ServiceItem,
  RequiredDoc,
  CaseFlags,
  AgentResult,
} from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 고객 신청 폼 입력값 타입
export interface IntakeFormData {
  requester_name: string
  requester_relation: string
  requester_email: string
  requester_phone: string
  deceased_name: string
  deceased_birth_date?: string
  deceased_death_date?: string
  // 서비스 선택 (체크박스)
  selected_services: Array<{
    platform: 'facebook' | 'instagram' | 'kakaotalk' | 'google' | 'twitter'
    action: 'memorialize' | 'delete'
    account_url?: string
    email?: string
    username?: string
    phone?: string
  }>
  // 자유 입력 텍스트 (있을 경우)
  free_text?: string
  kakaopay_question?: boolean  // 카카오페이 환불 필요 여부
}

// Case ID 생성
function generateCaseId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `CASE-${year}-${rand}`
}

// 공통 필요 서류 3종 초기화
function initRequiredDocs(): RequiredDoc[] {
  return [
    {
      doc_id: 'ID',
      name: '유가족 신분증 사본',
      status: 'pending',
      upload_count: 0,
    },
    {
      doc_id: 'FAMILY',
      name: '가족관계증명서 (상세, 3개월 이내)',
      status: 'pending',
      upload_count: 0,
    },
    {
      doc_id: 'DEATH',
      name: '사망진단서 또는 사체검안서',
      status: 'pending',
      upload_count: 0,
    },
  ]
}

// 자유 텍스트에서 서비스 추출 (Claude 보조)
async function parseServicesFromFreeText(
  freeText: string,
  existingServices: ServiceItem[]
): Promise<ServiceItem[]> {
  if (!freeText.trim()) return existingServices

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: `당신은 디지털 유산 행정 대행 서비스의 AI 어시스턴트입니다.
고객의 자유 입력 텍스트에서 처리가 필요한 SNS/플랫폼 서비스를 추출합니다.
처리 가능한 서비스: facebook, instagram, kakaotalk, google, twitter
처리 방식: memorialize(추모 전환), delete(계정 삭제)
반드시 JSON 배열로만 응답하세요. 이미 선택된 서비스와 중복되지 않게 추가 서비스만 반환하세요.
없으면 빈 배열 []로 응답하세요.`,
    messages: [
      {
        role: 'user',
        content: `이미 선택된 서비스: ${JSON.stringify(existingServices.map(s => s.platform))}

고객 자유 입력:
${freeText}

추가로 발견된 서비스를 JSON 배열로 반환하세요:
[{"platform": "...", "action": "...", "account_url": "..."}]`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return existingServices

  try {
    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return existingServices
    const parsed = JSON.parse(jsonMatch[0]) as ServiceItem[]
    return [...existingServices, ...parsed]
  } catch {
    return existingServices
  }
}

// 접수 완료 알림 메시지 생성 (Claude)
async function generateWelcomeMessage(caseObj: CaseObject): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 디지털 유산 행정 대행 서비스의 AI 어시스턴트입니다.
따뜻하고 전문적인 한국어로 고객에게 접수 완료 안내 메시지를 작성합니다.
200자 이내로 간결하게 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `의뢰인: ${caseObj.requester.name}님 (${caseObj.requester.relation})
고인: ${caseObj.deceased.name}님
케이스 번호: ${caseObj.case_id}
처리 신청 서비스: ${caseObj.services.map(s => s.platform).join(', ')}

접수 완료 안내 메시지를 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : `${caseObj.requester.name}님, 접수가 완료되었습니다. (케이스: ${caseObj.case_id})`
}

// 리마인더 스케줄 생성
function createReminderSchedule(baseDate: Date) {
  const addDays = (d: Date, days: number) => {
    const result = new Date(d)
    result.setDate(result.getDate() + days)
    return result.toISOString()
  }

  return [
    { trigger_at: addDays(baseDate, 3), type: '1st' as const, sent: false },
    { trigger_at: addDays(baseDate, 7), type: '2nd' as const, sent: false },
    { trigger_at: addDays(baseDate, 14), type: 'escalation' as const, sent: false },
    { trigger_at: addDays(baseDate, 30), type: 'expire' as const, sent: false },
  ]
}

// ============================================================
// 메인 — Intake Agent 실행
// ============================================================
export async function runIntakeAgent(formData: IntakeFormData): Promise<AgentResult> {
  console.log('\n🚀 [Intake Agent] 케이스 접수 시작')
  console.log(`의뢰인: ${formData.requester_name} | 고인: ${formData.deceased_name}`)

  try {
    const now = new Date()
    const caseId = generateCaseId()

    // 1. 서비스 파싱 (자유 텍스트가 있으면 Claude 보조)
    let services = formData.selected_services as typeof formData.selected_services
    if (formData.free_text) {
      console.log('📝 자유 텍스트에서 서비스 추출 중...')
      services = await parseServicesFromFreeText(
        formData.free_text,
        services
      )
    }

    // 2. 플래그 설정
    const flags: CaseFlags = {
      instagram_delete: services.some(
        s => s.platform === 'instagram' && s.action === 'delete'
      ),
      kakaopay_guide_needed: formData.kakaopay_question === true,
    }

    // 3. Case Object 생성
    const caseObject: CaseObject = {
      case_id: caseId,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),

      requester: {
        name: formData.requester_name,
        relation: formData.requester_relation,
        email: formData.requester_email,
        phone: formData.requester_phone,
      },

      deceased: {
        name: formData.deceased_name,
        birth_date: formData.deceased_birth_date,
        death_date: formData.deceased_death_date,
      },

      services: services.map(s => ({
        platform: s.platform,
        action: s.action,
        account_url: s.account_url,
        email: s.email,
        username: s.username,
        phone: s.phone,
      })),

      required_docs: initRequiredDocs(),
      flags,

      status: 'pending_collection',
      stage: 2, // 다음 단계: Document Request Agent

      draft_results: [],
      notification_log: [],
      reminder_schedule: createReminderSchedule(now),
    }

    // 4. 접수 완료 메시지 생성
    console.log('💬 접수 완료 메시지 생성 중...')
    const welcomeMessage = await generateWelcomeMessage(caseObject)

    // 5. 알림 로그 추가
    caseObject.notification_log!.push({
      type: 'email',
      sent_at: now.toISOString(),
      subject: `[에프텀] 디지털 유산 대행 서비스 접수 완료 - ${caseId}`,
    })

    // 실제 서비스에서는 여기서 DB 저장 & 이메일 발송
    // await saveToDatabase(caseObject)
    // await sendEmail(caseObject.requester.email, welcomeMessage)

    console.log('\n✅ [Intake Agent] 케이스 생성 완료')
    console.log(`   케이스 ID: ${caseId}`)
    console.log(`   선택 서비스: ${services.map(s => `${s.platform}(${s.action})`).join(', ')}`)
    console.log(`   플래그: instagram_delete=${flags.instagram_delete}, kakaopay=${flags.kakaopay_guide_needed}`)
    console.log('\n📩 고객 안내 메시지:')
    console.log(welcomeMessage)

    return {
      success: true,
      agent: 'intake-agent',
      message: `케이스 ${caseId} 접수 완료. Document Request Agent로 이관합니다.`,
      data: caseObject,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Intake Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'intake-agent',
      message: '케이스 접수 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

// ============================================================
// 직접 실행 테스트
// ============================================================
const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  const testForm: IntakeFormData = {
    requester_name: '홍길순',
    requester_relation: '딸',
    requester_email: 'test@example.com',
    requester_phone: '010-1234-5678',
    deceased_name: '홍길동',
    deceased_birth_date: '1950-01-15',
    deceased_death_date: '2024-12-01',
    selected_services: [
      { platform: 'facebook', action: 'memorialize', account_url: 'https://facebook.com/test' },
      { platform: 'instagram', action: 'delete', account_url: 'https://instagram.com/test' },
      { platform: 'kakaotalk', action: 'memorialize', phone: '010-9876-5432' },
      { platform: 'google', action: 'delete', email: 'test@gmail.com' },
      { platform: 'twitter', action: 'delete', username: '@testuser' },
    ],
    kakaopay_question: false,
  }

  runIntakeAgent(testForm).then(result => {
    console.log('\n--- Intake Agent 최종 결과 ---')
    console.log(JSON.stringify(result, null, 2))
  })
}
