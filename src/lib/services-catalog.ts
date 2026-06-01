// 에프텀 MVP — 지원 서비스 카탈로그 (5개 서비스로 운영)
// 실제 대행 가능한 서비스만 포함. 추후 확장 가능하도록 구조 유지.

export type ServiceCategory = 'SNS' | '포털' | '메신저'
export type DispatchType = 'email' | 'fax'

export interface ServiceItem {
  id: string
  name: string
  category: ServiceCategory
  icon: string           // 이모지 아이콘
  brandColor: string     // 브랜드 컬러 (UI 강조용)
  dispatchType: DispatchType
  contactInfo: string    // CS 이메일 or 팩스번호
  description?: string   // 처리 방식 설명
}

// ── 현재 대행 가능한 5개 서비스 ──
export const SERVICE_CATALOG: ServiceItem[] = [
  {
    id: 'instagram',
    name: '인스타그램',
    category: 'SNS',
    icon: '📸',
    brandColor: '#E1306C',
    dispatchType: 'email',
    contactInfo: 'support@instagram.com',
    description: '이메일 접수 후 7~14영업일',
  },
  {
    id: 'facebook',
    name: '페이스북',
    category: 'SNS',
    icon: '👤',
    brandColor: '#1877F2',
    dispatchType: 'email',
    contactInfo: 'support@facebook.com',
    description: '이메일 접수 후 7~14영업일',
  },
  {
    id: 'kakaotalk',
    name: '카카오톡',
    category: '메신저',
    icon: '💬',
    brandColor: '#FEE500',
    dispatchType: 'email',
    contactInfo: 'cs@kakaocorp.com',
    description: '이메일 접수 후 5~7영업일',
  },
  {
    id: 'google',
    name: '구글',
    category: '포털',
    icon: '🔍',
    brandColor: '#4285F4',
    dispatchType: 'email',
    contactInfo: 'support-kr@google.com',
    description: '이메일 접수 후 7~10영업일',
  },
  {
    id: 'twitter',
    name: '트위터(X)',
    category: 'SNS',
    icon: '🐦',
    brandColor: '#000000',
    dispatchType: 'email',
    contactInfo: 'privacy@x.com',
    description: '이메일 접수 후 7~14영업일',
  },
]

// 카테고리별 그룹핑
export const SERVICE_BY_CATEGORY = SERVICE_CATALOG.reduce((acc, service) => {
  if (!acc[service.category]) acc[service.category] = []
  acc[service.category].push(service)
  return acc
}, {} as Record<ServiceCategory, ServiceItem[]>)

// 카테고리 순서
export const CATEGORY_ORDER: ServiceCategory[] = ['SNS', '포털', '메신저']

// ID로 서비스 찾기
export function getServiceById(id: string): ServiceItem | undefined {
  return SERVICE_CATALOG.find(s => s.id === id)
}
