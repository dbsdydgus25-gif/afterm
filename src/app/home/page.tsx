// 홈 대시보드 — 서버 컴포넌트
// 여러 케이스(고인)를 조회해 CaseCarousel에 전달
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import NotificationBell from './NotificationBell'
import ChatOpenButton from './ChatOpenButton'
import CaseCarousel from './CaseCarousel'

const GUIDES = [
  { tag: '안심상속', title: '안심상속 원스톱 서비스', desc: '금융·부동산·세금 정보를 한 번에 조회하는 방법', color: '#EBF3FF', accent: '#163272', icon: '🏛️', href: 'https://www.gov.kr/portal/service/serviceInfo/PTR000051077' },
  { tag: '연금',    title: '유족연금 신청 방법',     desc: '국민연금·공무원연금 유족급여 청구 절차',        color: '#F0FDF4', accent: '#15803D', icon: '💰', href: 'https://www.nps.or.kr/jsppage/business/bnn/bnn_03_01.jsp' },
  { tag: '금융',    title: '은행 계좌 사망 신고',    desc: '계좌 동결·해지·상속 이전 처리 안내',           color: '#FFF7ED', accent: '#C2410C', icon: '🏦', href: 'https://www.fss.or.kr/fss/main/contents.do?menuNo=200463' },
  { tag: '통신',    title: '휴대폰·인터넷 해지',     desc: '사망자 명의 이동통신·인터넷 해지 방법',         color: '#F5F3FF', accent: '#7C3AED', icon: '📱', href: 'https://www.msit.go.kr/bbs/view.do?sCode=user&mId=99&mPid=74&bbsSeqNo=94&nttSeqNo=3173329' },
  { tag: '보험',    title: '생명보험 사망 보험금',   desc: '사망 보험금 청구 서류와 처리 기간 안내',         color: '#FFF1F2', accent: '#BE123C', icon: '📄', href: 'https://www.insure.or.kr/main.do' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
          <div style={{ display: 'flex', gap: 12 }}>
            <NotificationBell />
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

      {/* ── 서비스 준비 가이드 ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          서비스 신청 전 준비하세요
        </h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 12px' }}>서류 발급 및 계정 정보 확인 방법</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: '📋', label: '사망진단서 발급', sub: '정부24에서 온라인 발급', href: 'https://www.gov.kr/portal/service/serviceInfo/PTR000051250' },
            { icon: '👨‍👩‍👧', label: '가족관계증명서', sub: '정부24에서 온라인 발급', href: 'https://efamily.scourt.go.kr' },
            { icon: '📘', label: '페이스북 계정 찾기', sub: '프로필 URL 확인 방법', href: 'https://www.facebook.com/help/211813265517027' },
            { icon: '📸', label: '인스타그램 아이디', sub: '프로필에서 @아이디 확인', href: 'https://help.instagram.com/181103882360146' },
            { icon: '🐦', label: 'X 아이디 확인', sub: '프로필에서 @username 확인', href: 'https://help.twitter.com/ko/managing-your-account' },
            { icon: '📧', label: '구글 계정 확인', sub: '고인의 Gmail 주소 확인', href: 'https://support.google.com/accounts/troubleshooter/6357590' },
          ].map(item => (
            <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#F9FAFB', borderRadius: 12, padding: '14px 12px',
                border: '1px solid #F3F4F6',
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{item.sub}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── 행정 가이드 ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          {userName}님을 위한 행정 가이드
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GUIDES.map(g => (
            <a key={g.tag} href={g.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
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
            </a>
          ))}
        </div>
      </div>

      {/* ── 이런 것도 도와드려요 (신규 배너) ── */}
      <div style={{ padding: '32px 20px 24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          이런 것도 도와드려요
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* 왼쪽: 전문가와 상담하기 */}
          <ChatOpenButton />
          {/* 오른쪽: 에프텀 소개 */}
          <Link href="/about" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '20px 16px',
              border: '1px solid #F0F0F0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                🌿
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.01em' }}>에프텀 소개</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>서비스 알아보기</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  )
}
