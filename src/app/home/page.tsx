// 홈 대시보드 — 서버 컴포넌트
// 여러 케이스(고인)를 조회해 CaseCarousel에 전달
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import HomeChatButton from './HomeChatButton'
import CaseCarousel from './CaseCarousel'

const GUIDES = [
  { tag: '안심상속', title: '안심상속 원스톱 서비스', desc: '금융·부동산·세금 정보를 한 번에 조회하는 방법', color: '#EBF3FF', accent: '#163272', icon: '🏛️' },
  { tag: '연금',    title: '유족연금 신청 방법',     desc: '국민연금·공무원연금 유족급여 청구 절차',        color: '#F0FDF4', accent: '#15803D', icon: '💰' },
  { tag: '금융',    title: '은행 계좌 사망 신고',    desc: '계좌 동결·해지·상속 이전 처리 안내',           color: '#FFF7ED', accent: '#C2410C', icon: '🏦' },
  { tag: '통신',    title: '휴대폰·인터넷 해지',     desc: '사망자 명의 이동통신·인터넷 해지 방법',         color: '#F5F3FF', accent: '#7C3AED', icon: '📱' },
  { tag: '보험',    title: '생명보험 사망 보험금',   desc: '사망 보험금 청구 서류와 처리 기간 안내',         color: '#FFF1F2', accent: '#BE123C', icon: '📄' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  const kakaoToken = session?.provider_token ?? null

  const userName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '고객'

  // 모든 활성 케이스 조회 (draft 제외, 최신순)
  const { data: cases } = await supabase
    .from('cases')
    .select('id, deceased_name, status, created_at, case_services(id, status, service_name)')
    .eq('user_id', user!.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  const activeCases = cases || []

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      {/* ── 헤더 블루 영역 ── */}
      <div style={{ background: '#163272', padding: '20px 0 24px', position: 'relative', overflow: 'hidden' }}>
        {/* 배경 원 장식 */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* 상단 로고 + 아이콘 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 20px', position: 'relative' }}>
          <Image
            src="/logo-blue.png" alt="AFTERM" width={90} height={26}
            style={{ objectFit: 'contain', objectPosition: 'left', filter: 'brightness(0) invert(1)' }}
          />
          <Link href="/home/myinfo" style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* 인사말 */}
        <div style={{ padding: '0 20px', marginBottom: 16, position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 4px' }}>안녕하세요 👋</p>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {userName}님의 행정 현황
          </h1>
        </div>

        {/* 케이스 캐러셀 (클라이언트 컴포넌트) */}
        <CaseCarousel cases={activeCases} />
      </div>

      {/* ── 서비스 진행 현황 (가장 최근 케이스) ── */}
      {activeCases.length > 0 && (activeCases[0].case_services?.length ?? 0) > 0 && (
        <div style={{ padding: '24px 0 0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px', padding: '0 20px', letterSpacing: '-0.01em' }}>
            서비스 진행 현황
          </h2>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 20px 8px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none', scrollbarWidth: 'none',
          }}>
            {(activeCases[0].case_services || []).map((svc: any) => {
              const isDone = svc.status === 'done'
              const isProc = svc.status === 'dispatched' || svc.status === 'received'
              const isFailed = svc.status === 'failed'
              const statusLabel = isDone ? '완료' : isFailed ? '조치 필요' : isProc ? '진행 중' : '대기'
              const statusBg = isDone ? '#ECFDF5' : isFailed ? '#FEF2F2' : isProc ? '#EFF6FF' : '#F3F4F6'
              const statusColor = isDone ? '#059669' : isFailed ? '#DC2626' : isProc ? '#2563EB' : '#6B7280'
              const catIcon: Record<string, string> = { '통신': '📱', '금융': '🏦', '보험': '📄', '포털': '💻', 'SNS': '📸', '메신저': '💬', '구독': '💳' }
              return (
                <div key={svc.id} style={{
                  flexShrink: 0, width: 130, background: '#fff',
                  borderRadius: 16, padding: '14px 14px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  border: '1px solid #F0F0F0',
                }}>
                  <span style={{ fontSize: 24 }}>{catIcon[svc.service_category] || '📋'}</span>
                  <div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>{svc.service_category}</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.3 }}>{svc.service_name}</p>
                  </div>
                  <span style={{
                    alignSelf: 'flex-start', fontSize: 10, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 100,
                    background: statusBg, color: statusColor,
                  }}>
                    {statusLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 행정 가이드 ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          {userName}님을 위한 행정 가이드
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GUIDES.map(g => (
            <div key={g.tag} style={{
              background: '#fff', borderRadius: 14, padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer',
              border: '1px solid #F0F0F0',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: g.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
              }}>{g.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: g.accent, background: g.color, padding: '2px 7px', borderRadius: 100 }}>{g.tag}</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '4px 0 2px' }}>{g.title}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>{g.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>
      </div>

      {/* ── 이런 것도 도와드려요 (신규 배너) ── */}
      <div style={{ padding: '32px 20px 24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          이런 것도 도와드려요
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 16px',
            border: '1px solid #F0F0F0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              💬
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.01em' }}>전문 상담사와 1:1</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>평일 10-18시</p>
            </div>
          </div>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 16px',
            border: '1px solid #F0F0F0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📖
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.01em' }}>에프텀 서비스 안내</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>가이드 보기</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 채팅 배너 ── */}
      <div style={{ padding: '20px 20px 8px' }}>
        <HomeChatButton kakaoToken={kakaoToken} />
      </div>
    </div>
  )
}
