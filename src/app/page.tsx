'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

// 5개 서비스 브랜드 아이콘 (SVG 인라인)
function BrandBadge({ id, name }: { id: string; name: string }) {
  const colors: Record<string, string> = {
    instagram: 'linear-gradient(135deg, #FFDC80, #FCAF45, #F77737, #C13584, #833AB4)',
    facebook: '#1877F2',
    kakaotalk: '#FEE500',
    google: '#fff',
    twitter: '#000',
  }
  const textColors: Record<string, string> = {
    instagram: '#fff',
    facebook: '#fff',
    kakaotalk: '#3A1D1D',
    google: '#4285F4',
    twitter: '#fff',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    }}>
      <div style={{
        width: '52px', height: '52px',
        borderRadius: '14px',
        background: colors[id] || '#eee',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px',
        border: id === 'google' ? '1px solid #e0e0e0' : 'none',
      }}>
        {id === 'instagram' && '📸'}
        {id === 'facebook' && <span style={{ color: '#fff', fontWeight: 900, fontSize: '22px' }}>f</span>}
        {id === 'kakaotalk' && '💬'}
        {id === 'google' && (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {id === 'twitter' && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-label-alternative)' }}>
        {name}
      </span>
    </div>
  )
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    // 로그인 상태 확인
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          email: u.email || '',
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || '유저',
        })
      }
      setUserLoading(false)
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      document.querySelector('.landing-header')?.classList.toggle('scrolled', !e.isIntersecting)
    }, { threshold: 0 })
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  const services = [
    { id: 'instagram', name: '인스타그램' },
    { id: 'facebook', name: '페이스북' },
    { id: 'kakaotalk', name: '카카오톡' },
    { id: 'google', name: '구글' },
    { id: 'twitter', name: '트위터 X' },
  ]

  return (
    <div style={{ background: 'var(--color-background-normal-normal)', minHeight: '100dvh' }}>

      {/* ── 헤더 ── */}
      <header className="landing-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-line-normal-normal)',
        padding: '0 20px',
        height: 'var(--nav-h)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'box-shadow 0.2s',
      }}>
        <Logo width={100} height={30} />

        {/* 우측: 로그인 상태에 따라 다른 UI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userLoading ? (
            <div style={{ width: '80px', height: '32px', borderRadius: '8px', background: 'var(--color-coolNeutral-96)' }} />
          ) : user ? (
            // 로그인 상태: 이름 + 내 신청 + 로그아웃
            <>
              <span style={{ fontSize: '13px', color: 'var(--color-label-alternative)', fontWeight: 600 }}>
                {user.name}님
              </span>
              <Link href="/dashboard" style={{
                padding: '7px 14px', borderRadius: 'var(--radius-8)',
                fontSize: '13px', fontWeight: 700,
                background: 'var(--color-primary-normal)', color: '#fff',
                textDecoration: 'none',
              }}>
                내 신청
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '7px 12px', borderRadius: 'var(--radius-8)',
                  fontSize: '13px', fontWeight: 600,
                  background: 'none',
                  border: '1px solid var(--color-line-normal-normal)',
                  color: 'var(--color-label-alternative)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            // 비로그인 상태: 로그인 + 시작하기
            <>
              <Link href="/login" style={{
                padding: '7px 14px', borderRadius: 'var(--radius-8)',
                fontSize: '13px', fontWeight: 600,
                color: 'var(--color-label-alternative)', textDecoration: 'none',
              }}>
                로그인
              </Link>
              <Link href="/login?next=/apply" style={{
                padding: '7px 14px', borderRadius: 'var(--radius-8)',
                fontSize: '13px', fontWeight: 700,
                background: 'var(--color-primary-normal)', color: '#fff',
                textDecoration: 'none',
              }}>
                시작하기
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section ref={heroRef} style={{ padding: '56px 24px 48px', textAlign: 'center' }}>
        <div className="animate-slide-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--color-blue-95)', borderRadius: '100px',
          padding: '6px 14px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-normal)', letterSpacing: '0.01em' }}>
            🏛️ 디지털 유산 행정 대행 서비스
          </span>
        </div>

        <h1 className="animate-slide-up" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '34px', fontWeight: 800, lineHeight: 1.25,
          letterSpacing: '-0.03em', color: 'var(--color-label-strong)',
          marginBottom: '20px', animationDelay: '0.05s',
        }}>
          떠나신 분의 디지털 흔적,<br />
          <span style={{ color: 'var(--color-primary-normal)' }}>에프텀</span>이 대신 정리해요
        </h1>

        <p className="animate-slide-up" style={{
          fontSize: '16px', color: 'var(--color-label-alternative)', lineHeight: 1.7,
          marginBottom: '40px', animationDelay: '0.1s',
        }}>
          SNS · 포털 · 메신저까지<br />
          한 번의 신청으로 법적 위임 처리합니다.
        </p>

        {/* 서비스 배지 */}
        <div className="animate-slide-up" style={{
          display: 'flex', justifyContent: 'center', gap: '16px',
          marginBottom: '40px', animationDelay: '0.12s',
          flexWrap: 'wrap',
        }}>
          {services.map(s => (
            <BrandBadge key={s.id} id={s.id} name={s.name} />
          ))}
        </div>

        {/* CTA 버튼 */}
        <div className="animate-slide-up" style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          animationDelay: '0.15s',
        }}>
          {user ? (
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button block>내 신청 현황 보기 →</Button>
            </Link>
          ) : (
            <Link href="/login?next=/apply" style={{ textDecoration: 'none' }}>
              <Button block>지금 무료로 신청하기</Button>
            </Link>
          )}
          <p style={{ fontSize: '13px', color: 'var(--color-label-assistive)', letterSpacing: '0.01em' }}>
            평균 처리 기간 5~7 영업일 · 완전 무료
          </p>
        </div>
      </section>

      {/* ── 신뢰 지표 ── */}
      <section style={{
        background: 'var(--color-coolNeutral-99)', padding: '28px 24px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
        textAlign: 'center',
        borderTop: '1px solid var(--color-line-normal-normal)',
        borderBottom: '1px solid var(--color-line-normal-normal)',
      }}>
        {[
          { num: '5개', label: '지원 서비스' },
          { num: '100%', label: '법적 위임 처리' },
          { num: '₩0', label: '서비스 이용료' },
        ].map(({ num, label }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--color-primary-normal)', letterSpacing: '-0.02em' }}>{num}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-label-alternative)', marginTop: '4px', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── 이용 방법 ── */}
      <section style={{ padding: '48px 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800,
          letterSpacing: '-0.03em', marginBottom: '28px', color: 'var(--color-label-strong)',
        }}>
          딱 3단계면 완료돼요
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { step: '01', icon: '📝', title: '고인 정보 & 서비스 선택', desc: '이름, 생년월일, 사망일을 입력하고 해지할 SNS·포털을 선택해요' },
            { step: '02', icon: '📁', title: '서류 업로드 & 서명', desc: '사망진단서, 가족관계증명서, 신분증을 업로드하고 위임장에 서명해요' },
            { step: '03', icon: '✅', title: '에프텀이 처리 완료', desc: '각 기업에 해지 요청서를 보내고 완료까지 진행 상황을 알려드려요' },
          ].map(({ step, icon, title, desc }, i) => (
            <div key={step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: i === 0 ? 'var(--color-primary-normal)' : 'var(--color-coolNeutral-96)',
                color: i === 0 ? '#fff' : 'var(--color-label-normal)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
                zIndex: 2,
              }}>
                {i === 0 ? '1' : i === 1 ? '2' : '3'}
              </div>
              {i < 2 && <div style={{
                position: 'absolute', top: '44px', left: '22px', width: '1.5px', height: 'calc(100% - 8px)',
                background: 'var(--color-line-normal-normal)', zIndex: 1,
              }} />}
              <div style={{ paddingBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-label-strong)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                  {icon} {title}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-label-alternative)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '8px', background: 'var(--color-background-normal-alternative)' }} />

      {/* ── 하단 CTA ── */}
      <section style={{
        padding: '56px 24px',
        background: 'var(--color-label-strong)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800,
          color: '#fff', marginBottom: '12px', letterSpacing: '-0.03em',
        }}>
          지금 바로 시작하세요
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', marginBottom: '32px', lineHeight: 1.6 }}>
          어려운 행정 절차, 에프텀이<br />대신 처리해드립니다
        </p>
        {user ? (
          <Link href="/apply?reset=true" style={{ textDecoration: 'none' }}>
            <Button style={{ background: '#fff', color: 'var(--color-label-strong)' }}>
              새 신청 시작하기
            </Button>
          </Link>
        ) : (
          <Link href="/login?next=/apply" style={{ textDecoration: 'none' }}>
            <Button style={{ background: '#fff', color: 'var(--color-label-strong)' }}>
              무료 신청 시작하기
            </Button>
          </Link>
        )}
      </section>

      {/* ── 푸터 ── */}
      <footer style={{
        padding: '36px 24px',
        background: 'var(--color-label-strong)',
        color: '#ffffff',
        fontSize: '12px', lineHeight: 1.7,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Logo width={80} height={24} dark={true} />
        <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
          <p>에프텀 (Afterm)</p>
          <p>대표자: 윤용현 | 사업자등록번호: 000-00-00000</p>
          <p>서울특별시 강남구 테헤란로 000, 0층</p>
          <p>고객센터: 1588-0000 (평일 10:00~18:00)</p>
          <p>이메일: support@afterm.co.kr</p>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
          <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.9)', textDecoration: 'none' }}>이용약관</Link>
          <Link href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.9)', textDecoration: 'none', fontWeight: 600 }}>개인정보처리방침</Link>
        </div>
        <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
          © 2026 Afterm. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
