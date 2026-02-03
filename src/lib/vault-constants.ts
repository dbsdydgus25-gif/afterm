/**
 * Constants for Vault feature
 */

export const VAULT_CATEGORIES = {
    subscription: '구독 서비스',
    sns: 'SNS',
    other: '기타'
} as const;

export type VaultCategory = keyof typeof VAULT_CATEGORIES;

export const VAULT_REQUEST_TYPES = {
    cancel: '해지해주세요',
    withdraw: '탈퇴해주세요',
    backup_delete: '자료 백업 후 삭제'
} as const;

export type VaultRequestType = keyof typeof VAULT_REQUEST_TYPES;

export const SUBSCRIPTION_PLATFORMS = [
    '넷플릭스',
    '디즈니+',
    '웨이브',
    '티빙',
    '왓챠',
    '멜론',
    '지니뮤직',
    'FLO',
    '유튜브 프리미엄',
    '쿠팡 와우',
    '네이버 플러스',
    '마켓컬리 퍼플',
    'Apple Music',
    'Spotify'
];

export const SNS_PLATFORMS = [
    '인스타그램',
    '페이스북',
    '트위터(X)',
    '카카오톡',
    '네이버 블로그',
    '티스토리',
    '유튜브',
    '틱톡',
    '링크드인',
    '스레드'
];

export const FINANCIAL_KEYWORDS = [
    '은행', '증권', '카드', '보험', '펀드', '주식',
    'bank', 'card', 'stock', 'insurance'
];

/**
 * Check if platform name contains financial keywords
 */
export function isFinancialPlatform(platformName: string): boolean {
    const lower = platformName.toLowerCase();
    return FINANCIAL_KEYWORDS.some(keyword => lower.includes(keyword));
}
