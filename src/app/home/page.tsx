'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

const STEPS = [
  { key: 'submitted',  label: '접수 완료',   icon: '📋' },
  { key: 'reviewing',  label: '서류 확인',   icon: '🔍' },
  { key: 'processing', label: '처리 중',     icon: '⚙️' },
  { key: 'completed',  label: '완료',        icon: '✅' },
]

// 안심상속 원스톱 등 행정 가이드 카드
const GUIDES = [
  {
    tag: '안심상속',
    title: '안심상속 원스톱 서비스',
    desc: '금융·부동산·세금 정보를\n한 번에 조회하는 방법',
    color: '#EBF3FF',
    accent: '#163272',
    icon: '🏛️',
  },
  {
    tag: '연금',
    title: '유족연금 신청 방법',
    desc: '고인의 국민연금·공무원연금\n유족급여 청구 절차',
    color: '#F0FDF4',
    accent: '#15803D',
    icon: '💰',
  },
  {
    tag: '금융',
    title: '은행 계좌 사망 신고',
    desc: '사망 이후 계좌 동결·해지·\n상속 이전 처리 안내',
    color: '#FFF7ED',
    accent: '#C2410C',
    icon: '🏦',
  },
  {
    tag: '통신',
    title: '휴대폰·인터넷 해지',
    desc: '이동통신·인터넷 서비스\n사망자 명의 해지 방법',
    color: '#F5F3FF',
    accent: '#7C3AED',
    icon: '📱',
  },
  {
    tag: '보험',
    title: '생명보험 사망 보험금',
    desc: '사망 보험금 청구에 필요한\n서류와 처리 기간 안내',
    color: '#FFF1F2',
    accent: '#BE123C',
    icon: '📄',
  },
]

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      // 유저 케이스 조회
      const { data } = await supabase
        .from('cases')
        .select('*, case_services(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setCaseData(data)
      setLoading(false)
    }
    load()
  }, [])

  const userName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '고객'

  const stepIndex = caseData
    ? STEPS.findIndex(s => s.key === caseData.status)
    : -1

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{ background: '#163272', padding: '20px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* 배경 원형 */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <Image src="/logo-blue.png" alt="AFTERM" width={80} height={24}
            style={{ objectFit: 'contain', objectPosition: 'left', filter: 'brightness(0) invert(1)' }} />
          <button
            onClick={() => router.push('/home/myinfo')}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 4px' }}>안녕하세요 👋</p>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            {userName}님의 행정 현황
          </h1>

          {/* 진행 상태 카드 */}
          {loading ? (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>불러오는 중...</p>
            </div>
          ) : caseData ? (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 2px', fontWeight: 600 }}>고인</p>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>{caseData.deceased_name}님</p>
                </div>
                <span style={{
                  background: '#22c55e', color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '4px 12px', borderRadius: 100,
                }}>처리 중</span>
              </div>
              {/* 4단계 진행바 */}
              <div style={{ display: 'flex', gap: 6 }}>
                {STEPS.map((s, i) => (
                  <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <div style={{
                      width: '100%', height: 4, borderRadius: 2,
                      background: i <= stepIndex ? '#22c55e' : 'rgba(255,255,255,0.2)',
                      transition: 'background 0.3s',
                    }} />
                    <span style={{ fontSize: 10, color: i <= stepIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: 'center' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px', backdropFilter: 'blur(8px)' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 12px' }}>
                아직 신청이 없어요.<br />지금 바로 디지털 유산 정리를 시작해보세요.
              </p>
              <Link href="/apply" style={{
                display: 'inline-block', background: '#fff', color: '#163272',
                fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10,
                textDecoration: 'none',
              }}>
                신청하기 →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── 서비스 진행 현황 (케이스 있을 때) ── */}
      {caseData && (caseData.case_services?.length ?? 0) > 0 && (
        <div style={{ padding: '24px 24px 0' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: '0 0 14px' }}>서비스 진행 현황</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(caseData.case_services || []).slice(0, 4).map((svc: any) => (
              <div key={svc.id} style={{
                background: '#fff', borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div>
                  <p style={{ fontSize: 13, color: '#888', margin: '0 0 2px', fontWeight: 600 }}>{svc.service_category}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{svc.service_name}</p>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
                  background: svc.status === 'done' ? '#DCFCE7' : svc.status === 'processing' ? '#EFF6FF' : '#F3F4F6',
                  color: svc.status === 'done' ? '#15803D' : svc.status === 'processing' ? '#1D4ED8' : '#6B7280',
                }}>
                  {svc.status === 'done' ? '완료' : svc.status === 'processing' ? '처리중' : '대기'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 행정 가이드 섹션 ── */}
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: 0 }}>
            {userName}님을 위한 행정 가이드
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GUIDES.map((g) => (
            <div key={g.tag} style={{
              background: '#fff', borderRadius: 16, padding: '16px 18px',
              display: 'flex', gap: 14, alignItems: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>{g.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: g.accent,
                  background: g.color, padding: '2px 8px', borderRadius: 100,
                }}>{g.tag}</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '5px 0 3px' }}>{g.title}</p>
                <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{g.desc}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* ── 빠른 문의 배너 ── */}
      <div style={{ padding: '24px 24px 8px' }}>
        <button
          onClick={() => window.open('http://pf.kakao.com/_cxfNAX/chat', '_blank')}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #163272 0%, #1e4db7 100%)',
            border: 'none', borderRadius: 16, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            textAlign: 'left',
          }}>
          <div style={{ fontSize: 28 }}>💬</div>
          <div>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 3px' }}>에프텀 담당자에게 문의하기</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>카카오톡으로 편하게 연락하세요</p>
          </div>
          <svg style={{ marginLeft: 'auto' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
