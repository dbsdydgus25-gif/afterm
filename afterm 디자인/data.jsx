// data.jsx — mock data for afterm prototype
// All copy in Korean (-요 form for UI, -습니다 for confirmations).
// Sensitive copy is left explicit ("사망일", "고인") per brand spec.

const SERVICE_CATALOG = [
  // SNS
  { id: 'instagram', name: '인스타그램', category: 'SNS', color: '#E1306C', initials: 'IG', desc: '계정 해지 · 추모 계정' },
  { id: 'facebook',  name: '페이스북',   category: 'SNS', color: '#1877F2', initials: 'f',  desc: '계정 해지 · 추모 계정' },
  { id: 'kakaostory',name: '카카오스토리',category: 'SNS', color: '#FFCD00', initials: '스', desc: '계정 해지' },
  { id: 'x',         name: 'X',          category: 'SNS', color: '#0F1419', initials: 'X',  desc: '계정 해지' },

  // OTT · 구독
  { id: 'netflix',  name: '넷플릭스',     category: 'OTT', color: '#E50914', initials: 'N',  desc: '구독 해지' },
  { id: 'disney',   name: '디즈니+',      category: 'OTT', color: '#0B57A6', initials: 'D+', desc: '구독 해지' },
  { id: 'ytpremium',name: '유튜브 프리미엄', category: 'OTT', color: '#FF0033', initials: 'YT', desc: '구독 해지' },
  { id: 'tving',    name: '티빙',         category: 'OTT', color: '#FF153C', initials: 'T',  desc: '구독 해지' },
  { id: 'watcha',   name: '왓챠',         category: 'OTT', color: '#FF0558', initials: 'W',  desc: '구독 해지' },

  // 통신사
  { id: 'skt',      name: 'SK텔레콤',    category: '통신사', color: '#E60012', initials: 'SK', desc: '회선 해지' },
  { id: 'kt',       name: 'KT',          category: '통신사', color: '#000000', initials: 'KT', desc: '회선 해지' },
  { id: 'lgu',      name: 'LG U+',       category: '통신사', color: '#E6007E', initials: 'U+', desc: '회선 해지' },
];

const CATEGORIES = ['전체', '통신사', 'SNS', 'OTT'];

// service-side processing states
//   pending       — 요청 발송 전
//   submitted     — 해지 요청서 발송됨
//   in_review     — 기업 CS 검토 중
//   completed     — 해지 완료
//   needs_action  — 추가 서류 필요

const ACTIVE_CASE = {
  id: 'case-001',
  deceased: { name: '김영순', birth: '1948.03.12', death: '2026.05.18', relation: '모친' },
  startedAt: '2026.05.21',
  services: [
    { id: 'skt',       state: 'completed',    updatedAt: '2026.05.24', note: '회선 해지 완료' },
    { id: 'netflix',   state: 'completed',    updatedAt: '2026.05.23', note: '구독 해지 · 환불 완료' },
    { id: 'ytpremium', state: 'in_review',    updatedAt: '2026.05.26', note: '구글 CS 본인확인 진행 중' },
    { id: 'instagram', state: 'in_review',    updatedAt: '2026.05.27', note: 'Meta 추모 계정 전환 신청' },
    { id: 'kakaostory',state: 'submitted',    updatedAt: '2026.05.27', note: '해지 요청서 발송됨' },
    { id: 'facebook',  state: 'needs_action', updatedAt: '2026.05.26', note: '가족관계증명서 추가 필요' },
  ],
};

const PAST_CASE = {
  id: 'case-000',
  deceased: { name: '김상호', birth: '1944.11.02', death: '2024.09.07', relation: '부친' },
  startedAt: '2024.09.10',
  completedAt: '2024.09.24',
  services: [], // not shown
};

const STATE_META = {
  pending:      { label: '대기',       color: 'var(--color-label-alternative)', bg: 'var(--color-coolNeutral-96)' },
  submitted:    { label: '요청 발송',   color: 'var(--color-primary-normal)',    bg: 'var(--color-blue-99)' },
  in_review:    { label: '검토 중',     color: 'var(--color-yellow-55)',         bg: 'var(--color-yellow-99)' },
  completed:    { label: '완료',       color: 'var(--color-green-45)',          bg: 'var(--color-green-99)' },
  needs_action: { label: '서류 필요',   color: 'var(--color-red-50)',            bg: 'var(--color-red-99)' },
};

// helper
function getService(id) { return SERVICE_CATALOG.find(s => s.id === id); }

Object.assign(window, {
  SERVICE_CATALOG, CATEGORIES, ACTIVE_CASE, PAST_CASE, STATE_META, getService,
});
