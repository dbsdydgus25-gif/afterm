// 에프텀 MVP1 - 지원 서비스 카탈로그 (정적 데이터)
// 실제 CS 이메일 주소는 추후 정확한 정보로 업데이트 필요

export type ServiceCategory = 'OTT' | '음악' | '포털' | 'SNS' | '통신' | '클라우드' | '금융' | '기타'
export type DispatchType = 'email' | 'fax'

export interface ServiceItem {
  id: string
  name: string
  category: ServiceCategory
  icon: string          // 이모지 아이콘
  dispatchType: DispatchType
  contactInfo: string   // CS 이메일 or 팩스번호
  description?: string  // 처리 방식 설명
}

export const SERVICE_CATALOG: ServiceItem[] = [
  // OTT
  { id: 'netflix',      name: '넷플릭스',     category: 'OTT',   icon: '🎬', dispatchType: 'email', contactInfo: 'corporate@netflix.com',           description: '이메일 접수 후 3-5영업일' },
  { id: 'wavve',        name: '웨이브',        category: 'OTT',   icon: '📺', dispatchType: 'email', contactInfo: 'help@wavve.com',                  description: '이메일 접수 후 3-5영업일' },
  { id: 'tving',        name: '티빙',          category: 'OTT',   icon: '🎥', dispatchType: 'email', contactInfo: 'cs@tving.com',                    description: '이메일 접수 후 3-5영업일' },
  { id: 'watcha',       name: '왓챠',          category: 'OTT',   icon: '🎞️', dispatchType: 'email', contactInfo: 'cs@watcha.com',                   description: '이메일 접수 후 3-5영업일' },
  { id: 'coupangplay',  name: '쿠팡플레이',    category: 'OTT',   icon: '🛒', dispatchType: 'email', contactInfo: 'cs@coupang.com',                  description: '이메일 접수 후 3-5영업일' },
  { id: 'disneyplus',   name: '디즈니+',       category: 'OTT',   icon: '✨', dispatchType: 'email', contactInfo: 'support@disneyplus.com',           description: '이메일 접수 후 3-5영업일' },

  // 음악
  { id: 'melon',        name: '멜론',          category: '음악',  icon: '🍈', dispatchType: 'email', contactInfo: 'cs@melon.com',                    description: '이메일 접수 후 3-5영업일' },
  { id: 'genie',        name: '지니뮤직',      category: '음악',  icon: '🎵', dispatchType: 'email', contactInfo: 'cs@genie.co.kr',                  description: '이메일 접수 후 3-5영업일' },
  { id: 'flo',          name: '플로',          category: '음악',  icon: '🎶', dispatchType: 'email', contactInfo: 'cs@music-flo.com',                description: '이메일 접수 후 3-5영업일' },
  { id: 'spotify',      name: '스포티파이',    category: '음악',  icon: '💚', dispatchType: 'email', contactInfo: 'support@spotify.com',              description: '이메일 접수 후 3-5영업일' },
  { id: 'bugs',         name: '벅스',          category: '음악',  icon: '🐛', dispatchType: 'email', contactInfo: 'cs@bugs.co.kr',                   description: '이메일 접수 후 3-5영업일' },

  // 포털
  { id: 'naver',        name: '네이버',        category: '포털',  icon: '🟩', dispatchType: 'email', contactInfo: 'privacy@navercorp.com',            description: '이메일 접수 후 5-7영업일' },
  { id: 'kakao',        name: '카카오',        category: '포털',  icon: '💛', dispatchType: 'email', contactInfo: 'cs@kakaocorp.com',                description: '이메일 접수 후 5-7영업일' },
  { id: 'google',       name: '구글',          category: '포털',  icon: '🔍', dispatchType: 'email', contactInfo: 'support-kr@google.com',            description: '이메일 접수 후 7-10영업일' },
  { id: 'daum',         name: '다음',          category: '포털',  icon: '🌐', dispatchType: 'email', contactInfo: 'cs@kakaocorp.com',                description: '카카오와 동일 처리' },

  // SNS
  { id: 'instagram',    name: '인스타그램',    category: 'SNS',   icon: '📸', dispatchType: 'email', contactInfo: 'support@instagram.com',            description: '이메일 접수 후 7-14영업일' },
  { id: 'facebook',     name: '페이스북',      category: 'SNS',   icon: '👤', dispatchType: 'email', contactInfo: 'support@facebook.com',             description: '이메일 접수 후 7-14영업일' },
  { id: 'twitter',      name: '트위터(X)',      category: 'SNS',   icon: '🐦', dispatchType: 'email', contactInfo: 'privacy@x.com',                   description: '이메일 접수 후 7-14영업일' },
  { id: 'youtube',      name: '유튜브',        category: 'SNS',   icon: '▶️', dispatchType: 'email', contactInfo: 'support-kr@google.com',            description: '구글 계정과 동일 처리' },

  // 통신 (이메일로 처리)
  { id: 'skt',          name: 'SKT',           category: '통신',  icon: '📱', dispatchType: 'email', contactInfo: 'privacy@sktelecom.com',            description: '이메일 접수 후 5-7영업일' },
  { id: 'kt',           name: 'KT',            category: '통신',  icon: '📡', dispatchType: 'email', contactInfo: 'privacy@kt.com',                   description: '이메일 접수 후 5-7영업일' },
  { id: 'lgu',          name: 'LG U+',         category: '통신',  icon: '🔴', dispatchType: 'email', contactInfo: 'privacy@lguplus.co.kr',            description: '이메일 접수 후 5-7영업일' },

  // 클라우드
  { id: 'navercloud',   name: '네이버 클라우드', category: '클라우드', icon: '☁️', dispatchType: 'email', contactInfo: 'privacy@navercorp.com',        description: '네이버 계정과 동일 처리' },
  { id: 'icloud',       name: 'iCloud',        category: '클라우드', icon: '🍎', dispatchType: 'email', contactInfo: 'privacy@apple.com',             description: '이메일 접수 후 7-14영업일' },
  { id: 'googledrive',  name: '구글 드라이브',  category: '클라우드', icon: '💾', dispatchType: 'email', contactInfo: 'support-kr@google.com',         description: '구글 계정과 동일 처리' },

  // 금융
  { id: 'toss',         name: '토스',          category: '금융',  icon: '💸', dispatchType: 'email', contactInfo: 'cs@toss.im',                      description: '이메일 접수 후 5-7영업일' },
  { id: 'kakaopay',     name: '카카오페이',    category: '금융',  icon: '💳', dispatchType: 'email', contactInfo: 'cs@kakaopay.com',                 description: '이메일 접수 후 5-7영업일' },
  { id: 'payco',        name: '페이코',        category: '금융',  icon: '🅿️', dispatchType: 'email', contactInfo: 'cs@payco.com',                    description: '이메일 접수 후 5-7영업일' },
  { id: 'naverpay',     name: '네이버페이',    category: '금융',  icon: '💰', dispatchType: 'email', contactInfo: 'privacy@navercorp.com',            description: '이메일 접수 후 5-7영업일' },
]

// 카테고리별 그룹핑
export const SERVICE_BY_CATEGORY = SERVICE_CATALOG.reduce((acc, service) => {
  if (!acc[service.category]) acc[service.category] = []
  acc[service.category].push(service)
  return acc
}, {} as Record<ServiceCategory, ServiceItem[]>)

// 카테고리 순서
export const CATEGORY_ORDER: ServiceCategory[] = ['OTT', '음악', '포털', 'SNS', '통신', '클라우드', '금융']

// ID로 서비스 찾기
export function getServiceById(id: string): ServiceItem | undefined {
  return SERVICE_CATALOG.find(s => s.id === id)
}
