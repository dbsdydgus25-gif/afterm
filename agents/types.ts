// ============================================================
// Afterm AI 에이전트 — 공통 타입 정의
// digital-legacy-agent-workflow.md 기반
// ============================================================

export type DocStatus = 'pending' | 'uploaded' | 'verified' | 'rejected'
export type ServicePlatform = 'facebook' | 'instagram' | 'kakaotalk' | 'google' | 'twitter'
export type ServiceAction = 'memorialize' | 'delete'
export type CaseStatus =
  | 'pending_collection'
  | 'collecting'
  | 'verifying'
  | 'drafting'
  | 'review_pending'
  | 'completed'
  | 'on_hold'
  | 'expired'

export interface Requester {
  name: string
  relation: string // 예: '딸', '아들', '배우자'
  email: string
  phone: string
}

export interface Deceased {
  name: string
  birth_date?: string // YYYY-MM-DD
  death_date?: string // YYYY-MM-DD
}

export interface ServiceItem {
  platform: ServicePlatform
  action: ServiceAction
  account_url?: string  // Facebook, Instagram
  email?: string        // Google
  username?: string     // Twitter/X
  phone?: string        // KakaoTalk
}

export interface RequiredDoc {
  doc_id: 'ID' | 'FAMILY' | 'DEATH'
  name: string
  status: DocStatus
  file_path?: string       // 업로드된 파일 경로
  verified_at?: string     // ISO 날짜
  rejection_reason?: string
  upload_count?: number    // 재시도 횟수
}

export interface CaseFlags {
  instagram_delete?: boolean       // Instagram 삭제 선택 시
  kakaopay_guide_needed?: boolean  // 카카오페이 안내 필요 여부
}

// 서비스별 초안 결과
export interface DraftResult {
  platform: ServicePlatform
  action: ServiceAction
  submission_url?: string       // 신청 URL
  form_fields?: Record<string, string>  // 양식 입력값
  email_draft?: string          // 이메일 초안 (Twitter)
  letter_draft?: string         // 요청서 초안 (KakaoTalk)
  attachments: string[]         // 첨부 파일 목록
  warnings?: string[]           // 주의 사항
  operator_notes?: string       // 운영자 참고 사항
  created_at: string
}

// 메인 케이스 객체
export interface CaseObject {
  case_id: string
  created_at: string
  updated_at: string

  requester: Requester
  deceased: Deceased

  services: ServiceItem[]
  required_docs: RequiredDoc[]
  flags: CaseFlags

  status: CaseStatus
  stage: number

  // 각 스테이지 결과
  draft_results?: DraftResult[]
  final_package?: string         // Final Review 결과 텍스트

  // 알림 로그
  notification_log?: Array<{
    type: 'email' | 'kakao' | 'operator'
    sent_at: string
    subject: string
  }>

  // 리마인더 스케줄
  reminder_schedule?: Array<{
    trigger_at: string
    type: '1st' | '2nd' | 'escalation' | 'expire'
    sent: boolean
  }>
}

// 서류 검증 결과 (Claude Vision 출력)
export interface VerificationResult {
  doc_type: '사망진단서' | '가족관계증명서' | '신분증' | '기타'
  name_match: boolean
  issue_date: string | null   // YYYY-MM-DD
  has_official_seal: boolean
  image_quality: 'good' | 'poor'
  is_valid: boolean
  rejection_reason: string | null
}

// 에이전트 실행 결과
export interface AgentResult {
  success: boolean
  agent: string
  message: string
  data?: unknown
  error?: string
}
