import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import HomeChatButton from './HomeChatButton'

const GUIDES = [
  { tag: '안심상속', title: '안심상속 원스톱 서비스', desc: '금융·부동산·세금 정보를 한 번에 조회하는 방법', color: '#EBF3FF', accent: '#163272', icon: '🏛️' },
  { tag: '연금',    title: '유족연금 신청 방법',     desc: '국민연금·공무원연금 유족급여 청구 절차',        color: '#F0FDF4', accent: '#15803D', icon: '💰' },
  { tag: '금융',    title: '은행 계좌 사망 신고',    desc: '계좌 동결·해지·상속 이전 처리 안내',           color: '#FFF7ED', accent: '#C2410C', icon: '🏦' },
  { tag: '통신',    title: '휴대폰·인터넷 해지',     desc: '사망자 명의 이동통신·인터넷 해지 방법',         color: '#F5F3FF', accent: '#7C3AED', icon: '📱' },
  { tag: '보험',    title: '생명보험 사망 보험금',   desc: '사망 보험금 청구 서류와 처리 기간 안내',         color: '#FFF1F2', accent: '#BE123C', icon: '📄' },
]

const STEPS = [
  { key: 'submitted',  label: '접수 완료', color: '#2563EB' },
  { key: 'reviewing',  label: '서류 확인', color: '#7C3AED' },
  { key: 'processing', label: '처리 중',   color: '#D97706' },
  { key: 'completed',  label: '완료',      color: '#059669' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Kakao 액세스 토큰 (provider_token) — JS SDK & REST API 인증용
  const { data: { session } } = await supabase.auth.getSession()
  const kakaoToken = session?.provider_token ?? null

  const userName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '고객'

  // 케이스 조회
  const { data: caseData } = await supabase
    .from('cases')
    .select('*, case_services(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const stepIndex = caseData ? STEPS.findIndex(s => s.key === caseData.status) : -1

  return (
    <div>
      {/* 헤더 블루 카드 */}
      <div style={{ background: '#163272', padding: '20px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <Image src="/logo-blue.png" alt="AFTERM" width={90} height={26}
            style={{ objectFit: 'contain', objectPosition: 'left', filter: 'brightness(0) invert(1)' }} />
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

        <div style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 4px' }}>안녕하세요 👋</p>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            {userName}님의 행정 현황
          </h1>

          {caseData ? (
            <div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px', backdropFilter: 'blur(8px)', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 2px', fontWeight: 600 }}>고인</p>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>{caseData.deceased_name}님</p>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                  background: caseData.status === 'completed' ? '#22c55e' : caseData.status === 'processing' ? '#f59e0b' : caseData.status === 'reviewing' ? '#8b5cf6' : '#3b82f6',
                  color: '#fff',
                }}>
                  {caseData.status === 'completed' ? '처리 완료' : caseData.status === 'processing' ? '처리 중' : caseData.status === 'reviewing' ? '서류 확인' : '접수 완료'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {STEPS.map((s, i) => {
                  const isCurrent = i === stepIndex
                  const isPast = i < stepIndex
                  return (
                    <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                      <div style={{
                        width: '100%', height: 4, borderRadius: 2,
                        background: isCurrent ? '#fff' : isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                        transition: 'background .3s',
                      }} />
                      <span style={{
                        fontSize: 10, textAlign: 'center',
                        color: isCurrent ? '#fff' : isPast ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                        fontWeight: isCurrent ? 800 : 500,
                      }}>
                        {isCurrent ? `● ${s.label}` : s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <Link href="/apply?reset=true" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px',
              fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              + 새 신청하기
            </Link>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 12px' }}>
                아직 신청이 없어요.<br />지금 바로 디지털 유산 정리를 시작해보세요.
              </p>
              <Link href="/apply" style={{
                display: 'inline-block', background: '#fff', color: '#163272',
                fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
              }}>
                신청하기 →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 서비스 진행 현황 — 가로 스크롤 카드 */}
      {caseData && (caseData.case_services?.length ?? 0) > 0 && (
        <div style={{ padding: '24px 0 0' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: '0 0 14px', padding: '0 24px' }}>서비스 진행 현황</h2>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 24px 8px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none', scrollbarWidth: 'none',
          }}>
            {(caseData.case_services || []).map((svc: any) => {
              const isDone = svc.status === 'done'
              const isProc = svc.status === 'processing' || svc.status === 'dispatched' || svc.status === 'received'
              const statusLabel = isDone ? '완료' : isProc ? '처리중' : '대기'
              const statusBg = isDone ? '#DCFCE7' : isProc ? '#EFF6FF' : '#F3F4F6'
              const statusColor = isDone ? '#15803D' : isProc ? '#1D4ED8' : '#6B7280'
              return (
                <div key={svc.id} style={{
                  flexShrink: 0, width: 148, background: '#fff',
                  borderRadius: 18, padding: '18px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <span style={{ fontSize: 28 }}>
                    {svc.service_category === '통신' ? '📱' :
                     svc.service_category === '금융' ? '🏦' :
                     svc.service_category === '보험' ? '📄' :
                     svc.service_category === '포털' ? '💻' : '📋'}
                  </span>
                  <div>
                    <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px', fontWeight: 600 }}>{svc.service_category}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: 0, wordBreak: 'keep-all', lineHeight: 1.3 }}>{svc.service_name}</p>
                  </div>
                  <span style={{
                    alignSelf: 'flex-start', fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 100,
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

      {/* 행정 가이드 */}
      <div style={{ padding: '28px 24px 0' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: '0 0 14px' }}>
          {userName}님을 위한 행정 가이드
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GUIDES.map(g => (
            <div key={g.tag} style={{
              background: '#fff', borderRadius: 16, padding: '16px 18px',
              display: 'flex', gap: 14, alignItems: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: g.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>{g.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: g.accent, background: g.color, padding: '2px 8px', borderRadius: 100 }}>{g.tag}</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '5px 0 3px' }}>{g.title}</p>
                <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.5 }}>{g.desc}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          ))}
        </div>
      </div>

      {/* 채팅 배너 */}
      <div style={{ padding: '24px 24px 8px' }}>
        <HomeChatButton kakaoToken={kakaoToken} />
      </div>
    </div>
  )
}
