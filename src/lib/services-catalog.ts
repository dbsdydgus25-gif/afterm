// 에프텀 MVP — 지원 서비스 카탈로그
// 서비스별 필요 정보 및 서류 포함

export type ServiceCategory = 'SNS' | '포털' | '메신저'
export type DispatchType = 'email' | 'fax'

// 서비스별 추가 입력 필드 타입
export interface ServiceField {
  key: string           // 저장 키
  label: string         // UI 레이블
  placeholder: string   // 플레이스홀더
  type: 'text' | 'email' | 'tel' | 'select'
  required: boolean
  options?: string[]    // select 타입일 때 선택지
  tip?: string          // 입력 도움말
}

// 서비스별 필요 서류 타입
export interface RequiredDoc {
  type: string          // 서류 식별자
  title: string         // 서류 이름
  desc: string          // 설명
  required: boolean
}

export interface ServiceItem {
  id: string
  name: string
  category: ServiceCategory
  icon: string
  brandColor: string
  dispatchType: DispatchType
  contactInfo: string
  description?: string
  processingDays: string            // 처리 기간
  fields: ServiceField[]            // 서비스별 추가 입력 필드
  requiredDocs: RequiredDoc[]       // 서비스별 필요 서류
  actionOptions: string[]           // 처리 방식 선택지 (삭제/추모계정 등)
}

export const SERVICE_CATALOG: ServiceItem[] = [
  {
    id: 'instagram',
    name: '인스타그램',
    category: 'SNS',
    icon: '📸',
    brandColor: '#E1306C',
    dispatchType: 'email',
    contactInfo: 'support@instagram.com',
    description: '메타(인스타그램) 공식 접수',
    processingDays: '7~14영업일',
    actionOptions: ['계정 삭제', '추모 계정으로 전환'],
    fields: [
      {
        key: 'account_username',
        label: '인스타그램 아이디',
        placeholder: '@username',
        type: 'text',
        required: true,
        tip: '@ 포함하여 입력해주세요',
      },
      {
        key: 'account_url',
        label: '프로필 URL (선택)',
        placeholder: 'https://www.instagram.com/username',
        type: 'text',
        required: false,
        tip: '있으면 입력해주세요',
      },
    ],
    requiredDocs: [
      { type: 'death_cert', title: '사망진단서', desc: '의료기관 발급 사망진단서', required: true },
      { type: 'id_card', title: '신청인 신분증', desc: '주민등록증 또는 운전면허증 앞면', required: true },
    ],
  },
  {
    id: 'facebook',
    name: '페이스북',
    category: 'SNS',
    icon: '👤',
    brandColor: '#1877F2',
    dispatchType: 'email',
    contactInfo: 'support@facebook.com',
    description: '메타(페이스북) 공식 접수',
    processingDays: '7~14영업일',
    actionOptions: ['계정 삭제', '추모 계정으로 전환'],
    fields: [
      {
        key: 'account_username',
        label: '페이스북 프로필 이름 또는 URL',
        placeholder: '홍길동 또는 facebook.com/xxx',
        type: 'text',
        required: true,
        tip: '고인의 페이스북 프로필 이름을 입력해주세요',
      },
    ],
    requiredDocs: [
      { type: 'death_cert', title: '사망진단서', desc: '의료기관 발급 사망진단서', required: true },
      { type: 'id_card', title: '신청인 신분증', desc: '주민등록증 또는 운전면허증 앞면', required: true },
    ],
  },
  {
    id: 'kakaotalk',
    name: '카카오톡',
    category: '메신저',
    icon: '💬',
    brandColor: '#FEE500',
    dispatchType: 'email',
    contactInfo: 'cs@kakaocorp.com',
    description: '카카오 고객센터 공식 접수',
    processingDays: '5~10영업일',
    actionOptions: ['계정 삭제'],
    fields: [
      {
        key: 'account_phone',
        label: '카카오 계정 전화번호',
        placeholder: '010-0000-0000',
        type: 'tel',
        required: true,
        tip: '카카오톡은 전화번호가 계정 ID입니다',
      },
      {
        key: 'account_email',
        label: '카카오 계정 이메일 (선택)',
        placeholder: 'example@kakao.com',
        type: 'email',
        required: false,
      },
    ],
    requiredDocs: [
      { type: 'death_cert', title: '사망진단서', desc: '의료기관 발급 사망진단서', required: true },
      { type: 'family_cert', title: '가족관계증명서', desc: '정부24 또는 주민센터 발급', required: true },
      { type: 'id_card', title: '신청인 신분증', desc: '주민등록증 또는 운전면허증 앞면', required: true },
    ],
  },
  {
    id: 'google',
    name: '구글',
    category: '포털',
    icon: '🔍',
    brandColor: '#4285F4',
    dispatchType: 'email',
    contactInfo: 'support-kr@google.com',
    description: '구글 공식 추모 계정 접수',
    processingDays: '7~10영업일',
    actionOptions: ['계정 삭제', '계정 데이터 다운로드 후 삭제'],
    fields: [
      {
        key: 'account_email',
        label: '구글 계정 이메일',
        placeholder: 'example@gmail.com',
        type: 'email',
        required: true,
        tip: '고인의 Gmail 주소를 입력해주세요',
      },
    ],
    requiredDocs: [
      { type: 'death_cert', title: '사망진단서', desc: '의료기관 발급 사망진단서', required: true },
      { type: 'id_card', title: '신청인 신분증', desc: '주민등록증 또는 운전면허증 앞면', required: true },
    ],
  },
  {
    id: 'twitter',
    name: '트위터(X)',
    category: 'SNS',
    icon: '🐦',
    brandColor: '#000000',
    dispatchType: 'email',
    contactInfo: 'privacy@x.com',
    description: 'X(트위터) 공식 접수',
    processingDays: '7~14영업일',
    actionOptions: ['계정 삭제'],
    fields: [
      {
        key: 'account_username',
        label: '트위터 아이디',
        placeholder: '@username',
        type: 'text',
        required: true,
        tip: '@ 포함하여 입력해주세요',
      },
    ],
    requiredDocs: [
      { type: 'death_cert', title: '사망진단서', desc: '의료기관 발급 사망진단서', required: true },
      { type: 'id_card', title: '신청인 신분증', desc: '주민등록증 또는 운전면허증 앞면', required: true },
    ],
  },
]

// 카테고리별 그룹핑
export const SERVICE_BY_CATEGORY = SERVICE_CATALOG.reduce((acc, service) => {
  if (!acc[service.category]) acc[service.category] = []
  acc[service.category].push(service)
  return acc
}, {} as Record<ServiceCategory, ServiceItem[]>)

export const CATEGORY_ORDER: ServiceCategory[] = ['SNS', '포털', '메신저']

export function getServiceById(id: string): ServiceItem | undefined {
  return SERVICE_CATALOG.find(s => s.id === id)
}

// 선택된 서비스들의 모든 필요 서류 (중복 제거)
export function getRequiredDocs(serviceIds: string[]): RequiredDoc[] {
  const seen = new Set<string>()
  const docs: RequiredDoc[] = []
  for (const id of serviceIds) {
    const svc = getServiceById(id)
    if (!svc) continue
    for (const doc of svc.requiredDocs) {
      if (!seen.has(doc.type)) {
        seen.add(doc.type)
        docs.push(doc)
      }
    }
  }
  return docs
}
