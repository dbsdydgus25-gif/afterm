// 에프텀 — 플랫폼별 삭제/추모 투트랙 서비스 카탈로그
// 2026.06.15 공식 정책 기반 (고인_계정_삭제vs추모_서류정리_v3.html)

export type ServiceCategory = 'SNS' | '포털' | '메신저'
export type TrackType = 'delete' | 'memorial'

export interface ServiceField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'email' | 'tel' | 'url' | 'select'
  required: boolean
  tip?: string
  options?: string[]
  prefix?: string  // 입력창 앞에 고정으로 표시되는 텍스트 (저장 시 값 앞에 붙임)
}

export interface RequiredDoc {
  type: string
  title: string
  desc: string
  required: boolean
  maskingNote?: string  // 마스킹 주의사항
}

// 트랙별 설정
export interface TrackConfig {
  available: true               // 해당 트랙 존재 여부
  // 에프텀 대행 가능 여부
  agentCanHandle: boolean
  agentCanHandleNote: string    // 불가 이유 또는 조건부 안내
  // 신청 가능 조건 (표시용)
  who: string                   // '직계가족만', '누구나', '법정대리인 가능' 등
  submissionUrl: string
  processingDays: string
  fields: ServiceField[]
  requiredDocs: RequiredDoc[]
  warnings?: string[]
}

export interface ServiceItem {
  id: string
  name: string
  category: ServiceCategory
  icon: string
  brandColor: string
  tracks: {
    delete?: TrackConfig
    memorial?: TrackConfig
  }
}

// ── 공통 서류 정의 ──
const ID_CARD: RequiredDoc = {
  type: 'id_card', title: '신청인 신분증',
  desc: '주민등록증 또는 운전면허증 앞면',
  required: true,
  maskingNote: '주민번호 뒷자리 반드시 마스킹 후 제출',
}
const DEATH_CERT: RequiredDoc = {
  type: 'death_cert', title: '사망진단서',
  desc: '의료기관 발급 사망진단서 스캔본',
  required: true,
}
const FAMILY_CERT: RequiredDoc = {
  type: 'family_cert', title: '가족관계증명서',
  desc: '정부24 또는 주민센터 발급 (사망 확인 표기 필수)',
  required: true,
  maskingNote: '주민번호 뒷자리 반드시 마스킹 후 제출',
}
const DEATH_PROOF_SCREENSHOT: RequiredDoc = {
  type: 'death_proof_screenshot', title: '사망 증명 스크린샷',
  desc: '부고 문자, 온라인 기사, SNS 추모글 등 캡처본',
  required: true,
}

export const SERVICE_CATALOG: ServiceItem[] = [
  // ── 인스타그램 ──
  {
    id: 'instagram',
    name: '인스타그램',
    category: 'SNS',
    icon: '📸',
    brandColor: '#E1306C',
    tracks: {
      delete: {
        available: true,
        agentCanHandle: false,
        agentCanHandleNote: '인스타그램 삭제는 직계가족 본인만 신청 가능합니다. 에프텀이 대신 제출할 수 없으며, 신청서 작성 지원 후 직접 제출하셔야 합니다.',
        who: '직계가족 본인만',
        submissionUrl: 'https://help.instagram.com/contact/1474899482730688',
        processingDays: '7~14영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'requester_email', label: '신청인 이메일', placeholder: 'you@email.com', type: 'email', required: true },
          { key: 'deceased_name', label: '고인 성명', placeholder: '홍길동', type: 'text', required: true },
          { key: 'deceased_death_date', label: '고인 사망 날짜', placeholder: '2024-11-20', type: 'text', required: true },
          { key: 'account_username', label: '고인의 인스타그램 아이디', placeholder: 'username', type: 'text', required: true, prefix: '@' },
        ],
        requiredDocs: [],  // 양식에 파일 업로드 없음 (제출 후 이메일 요청 가능)
        warnings: [
          '양식에 파일 업로드 항목이 없습니다. 제출 후 인스타그램이 추가 서류를 이메일로 요청할 수 있습니다.',
          '에프텀이 대신 제출할 수 없습니다. 직접 신청하셔야 합니다.',
        ],
      },
      memorial: {
        available: true,
        agentCanHandle: true,
        agentCanHandleNote: '인스타그램 추모 전환은 누구나 신청 가능합니다. 에프텀이 대행합니다.',
        who: '누구나 (업체 대행 가능)',
        submissionUrl: 'https://help.instagram.com/contact/452224988254813',
        processingDays: '7~14영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'requester_email', label: '신청인 이메일', placeholder: 'you@email.com', type: 'email', required: true },
          { key: 'deceased_name', label: '고인 성명', placeholder: '홍길동', type: 'text', required: true },
          { key: 'deceased_death_date', label: '고인 사망 날짜', placeholder: '2024-11-20', type: 'text', required: true },
          { key: 'account_username', label: '고인의 인스타그램 아이디', placeholder: 'username', type: 'text', required: true, prefix: '@' },
          { key: 'threads_username', label: '고인의 Threads 아이디 (있다면)', placeholder: 'username', type: 'text', required: false, prefix: '@' },
        ],
        requiredDocs: [DEATH_CERT],
        warnings: [],
      },
    },
  },

  // ── 페이스북 ──
  {
    id: 'facebook',
    name: '페이스북',
    category: 'SNS',
    icon: '👤',
    brandColor: '#1877F2',
    tracks: {
      delete: {
        available: true,
        agentCanHandle: true,
        agentCanHandleNote: '직계가족 또는 법정대리인이 신청 가능합니다. 에프텀이 법정대리인 자격으로 대행합니다 (케이스에 따라 추가 서류 요청될 수 있음).',
        who: '직계가족 / 법정대리인',
        submissionUrl: 'https://www.facebook.com/help/contact/228813257197480',
        processingDays: '7~14영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'requester_email', label: '연락 이메일', placeholder: 'you@email.com', type: 'email', required: true },
          { key: 'deceased_profile_name', label: '고인의 프로필 이름', placeholder: '홍길동', type: 'text', required: true },
          { key: 'deceased_profile_url', label: '고인의 페이스북 아이디', placeholder: 'hong.gildong', type: 'text', required: true, prefix: 'https://facebook.com/' },
          { key: 'deceased_account_email', label: '고인의 페이스북 계정 이메일', placeholder: 'deceased@email.com', type: 'email', required: false, tip: '모르시면 비워두셔도 됩니다' },
        ],
        requiredDocs: [DEATH_CERT, ID_CARD],
        warnings: [
          '양식 제출 후 Facebook이 사망진단서·신분증 추가 요청할 수 있습니다.',
        ],
      },
      memorial: {
        available: true,
        agentCanHandle: true,
        agentCanHandleNote: '누구나 신청 가능합니다. 에프텀이 대행합니다.',
        who: '누구나 (동일 양식에서 선택)',
        submissionUrl: 'https://www.facebook.com/help/contact/228813257197480',
        processingDays: '7~14영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'requester_email', label: '연락 이메일', placeholder: 'you@email.com', type: 'email', required: true },
          { key: 'deceased_profile_name', label: '고인의 프로필 이름', placeholder: '홍길동', type: 'text', required: true },
          { key: 'deceased_profile_url', label: '고인의 페이스북 아이디', placeholder: 'hong.gildong', type: 'text', required: true, prefix: 'https://facebook.com/' },
          { key: 'deceased_account_email', label: '고인의 페이스북 계정 이메일', placeholder: 'deceased@email.com', type: 'email', required: false },
        ],
        requiredDocs: [DEATH_CERT, ID_CARD],
        warnings: [
          '삭제와 동일한 양식에서 "이 계정을 기념 계정으로 만들어주세요" 옵션을 선택합니다.',
        ],
      },
    },
  },

  // ── 카카오톡 ──
  {
    id: 'kakaotalk',
    name: '카카오톡',
    category: '메신저',
    icon: '💬',
    brandColor: '#FEE500',
    tracks: {
      delete: {
        available: true,
        agentCanHandle: false,
        agentCanHandleNote: '카카오톡 계정 탈퇴는 직계가족만 신청 가능합니다. 에프텀이 대신 제출할 수 없으며, 서류 준비 지원 후 직접 제출하셔야 합니다.',
        who: '직계가족만',
        submissionUrl: 'https://cs.kakao.com/requests?service=8',
        processingDays: '5~10영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'deceased_name', label: '고인 성명', placeholder: '홍길동', type: 'text', required: true },
          { key: 'account_username', label: '고인 카카오 계정 (휴대폰 번호)', placeholder: '010-1234-5678', type: 'text', required: true },
          { key: 'deceased_telecom', label: '고인의 통신사', placeholder: '', type: 'select', required: true, options: ['SKT', 'KT', 'LG U+', '알뜰폰(MVNO)'] },
          { key: 'refund_account', label: '환불 계좌 (카카오페이 잔액 있을 경우)', placeholder: '은행명 계좌번호', type: 'text', required: false },
        ],
        requiredDocs: [
          {
            type: 'kakao_request_form', title: '계정 탈퇴 처리 요청서',
            desc: '카카오 공식 PDF 양식 (kko.to/aoor9QNwbm) 작성·서명',
            required: true,
          },
          {
            type: 'telecom_cert', title: '고인 통신사 증빙서류',
            desc: 'SKT: 이용계약 등록사항 증명서 / KT: 원부 증명서 / LG U+: 가입 사실 확인서',
            required: true,
            maskingNote: '성명·번호·생년월일·발급일 마스킹 없이 발급',
          },
          FAMILY_CERT,
          ID_CARD,
        ],
        warnings: [
          '마스킹 미처리 시 전체 서류 재제출 요청됩니다.',
          '카카오페이 잔액이 있는 경우 환불 계좌가 필요합니다.',
        ],
      },
      memorial: {
        available: true,
        agentCanHandle: true,
        agentCanHandleNote: '사전 지정 대리인이 있는 경우 앱에서 신청 가능합니다. 에프텀이 신청 절차를 지원합니다.',
        who: '사전 지정 대리인 또는 직계가족',
        submissionUrl: 'https://cs.kakao.com/requests?service=8',
        processingDays: '5~10영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'deceased_name', label: '고인 성명', placeholder: '홍길동', type: 'text', required: true },
          { key: 'is_pre_designated', label: '사전 지정 대리인 여부', placeholder: '', type: 'select', required: true, options: ['예 (앱에서 지정됨)', '아니오'] },
        ],
        requiredDocs: [
          DEATH_CERT,
          FAMILY_CERT,
        ],
        warnings: [
          '추모 전환 후 복구 불가합니다.',
          '기본 5년 (최대 10년) 유지 후 자동 탈퇴됩니다.',
          '이미 탈퇴된 계정은 추모 전환이 불가합니다.',
        ],
      },
    },
  },

  // ── 구글 ──
  {
    id: 'google',
    name: '구글',
    category: '포털',
    icon: '🔍',
    brandColor: '#4285F4',
    tracks: {
      delete: {
        available: true,
        agentCanHandle: true,
        agentCanHandleNote: '법정대리인이 신청 가능합니다. 에프텀이 대행합니다. 단, 한국어 서류는 공인 영문 번역본이 필요합니다.',
        who: '직계가족 / 법정대리인',
        submissionUrl: 'https://support.google.com/accounts/troubleshooter/6357590',
        processingDays: '2~6주',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'requester_email', label: '신청인 이메일', placeholder: 'you@email.com', type: 'email', required: true },
          { key: 'requester_country', label: '거주 국가', placeholder: '대한민국', type: 'text', required: true },
          { key: 'deceased_name', label: '고인 성명', placeholder: '홍길동', type: 'text', required: true },
          { key: 'deceased_account_email', label: '고인의 구글 계정 이메일', placeholder: 'deceased@gmail.com', type: 'email', required: true },
          { key: 'deceased_death_date', label: '고인 사망일', placeholder: '2024-11-20', type: 'text', required: true },
        ],
        requiredDocs: [ID_CARD, DEATH_CERT],
        warnings: [
          '한국어 서류는 반드시 공인 영문 번역본이 필요합니다.',
          '처리 기간이 2~6주로 다른 플랫폼보다 오래 걸립니다.',
          '구글은 추모 계정 전환 기능이 없습니다. 삭제 또는 데이터 회수만 지원합니다.',
        ],
      },
      // 구글은 추모 트랙 없음
    },
  },

  // ── X (트위터) ──
  {
    id: 'twitter',
    name: 'X (트위터)',
    category: 'SNS',
    icon: '🐦',
    brandColor: '#000000',
    tracks: {
      delete: {
        available: true,
        agentCanHandle: true,
        agentCanHandleNote: '직계가족 또는 법정대리인이 신청 가능합니다. 에프텀이 대행합니다 (케이스에 따라 추가 서류 요청될 수 있음).',
        who: '직계가족 / 법정대리인',
        submissionUrl: 'https://help.twitter.com/forms/account-access/deactivate-or-close-account/deactivate-account-for-deceased',
        processingDays: '7~14영업일',
        fields: [
          { key: 'requester_name', label: '신청인 성명', placeholder: '홍길순', type: 'text', required: true },
          { key: 'requester_email', label: '신청인 이메일', placeholder: 'you@email.com', type: 'email', required: true },
          { key: 'deceased_name', label: '고인 성명', placeholder: '홍길동', type: 'text', required: true },
          { key: 'account_username', label: '고인의 X 아이디', placeholder: 'username', type: 'text', required: true, prefix: '@' },
        ],
        requiredDocs: [ID_CARD, DEATH_CERT],
        warnings: [
          '제출 후 X가 신분증·사망 확인서 추가 요청 이메일을 발송합니다.',
          '계정 접근 권한은 제공되지 않으며 비활성화(삭제)만 처리됩니다.',
          'X는 추모 계정 전환 기능이 없습니다.',
        ],
      },
      // X는 추모 트랙 없음
    },
  },
]

// ── 유틸리티 ──
export function getServiceById(id: string): ServiceItem | undefined {
  return SERVICE_CATALOG.find(s => s.id === id)
}

export function getTrackConfig(serviceId: string, track: TrackType): TrackConfig | null {
  const svc = getServiceById(serviceId)
  return svc?.tracks[track] ?? null
}

// 선택된 서비스+트랙의 필요 서류 (중복 제거)
export function getRequiredDocs(selections: Array<{ id: string; track: TrackType }>): RequiredDoc[] {
  const seen = new Set<string>()
  const docs: RequiredDoc[] = []
  for (const { id, track } of selections) {
    const cfg = getTrackConfig(id, track)
    if (!cfg) continue
    for (const doc of cfg.requiredDocs) {
      if (!seen.has(doc.type)) {
        seen.add(doc.type)
        docs.push(doc)
      }
    }
  }
  return docs
}

// 레거시 호환 (기존 코드에서 string[]로 호출하는 경우)
export function getRequiredDocsLegacy(serviceIds: string[]): RequiredDoc[] {
  const seen = new Set<string>()
  const docs: RequiredDoc[] = []
  for (const id of serviceIds) {
    const svc = getServiceById(id)
    if (!svc) continue
    for (const track of Object.values(svc.tracks)) {
      if (!track) continue
      for (const doc of (track as TrackConfig).requiredDocs) {
        if (!seen.has(doc.type)) {
          seen.add(doc.type)
          docs.push(doc)
        }
      }
    }
  }
  return docs
}

export const SERVICE_BY_CATEGORY = SERVICE_CATALOG.reduce((acc, svc) => {
  if (!acc[svc.category]) acc[svc.category] = []
  acc[svc.category].push(svc)
  return acc
}, {} as Record<ServiceCategory, ServiceItem[]>)

export const CATEGORY_ORDER: ServiceCategory[] = ['SNS', '포털', '메신저']
