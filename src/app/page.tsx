'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function FadeSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const SERVICES = [
  {
    id: 'instagram',
    label: 'Instagram',
    bg: 'linear-gradient(135deg,#FFDC80,#FCAF45,#F77737,#C13584,#833AB4)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    bg: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'google',
    label: 'Google',
    bg: '#fff',
    border: '1.5px solid #e5e7eb',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'kakao',
    label: 'KakaoTalk',
    bg: '#FEE500',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#3C1E1E" d="M12 3C6.477 3 2 6.582 2 11c0 2.89 1.815 5.44 4.584 6.965L5.5 21l4.326-2.876A11.91 11.91 0 0012 18.2c5.523 0 10-3.582 10-8.2S17.523 3 12 3z"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X',
    bg: '#000',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

function useCountdown(initialSecs = 50 * 60) {
  const [secs, setSecs] = useState(initialSecs)
  useEffect(() => {
    const id = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [])
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function LandingPage() {
  const countdown = useCountdown()

  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
      background: '#fff',
      minHeight: '100vh',
      maxWidth: 480,
      margin: '0 auto',
      overflowX: 'hidden',
    }}>

      {/* ── 헤더 ── */}
      <header style={{
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <Image src="/logo.jpg" alt="AFTERM" width={88} height={26} style={{ objectFit: 'contain', objectPosition: 'left' }} />
        <Link href="/login" style={{
          fontSize: 13, color: '#1a3a7c', fontWeight: 600,
          textDecoration: 'none', padding: '7px 16px',
          border: '1.5px solid #1a3a7c', borderRadius: 8,
        }}>
          로그인
        </Link>
      </header>

      {/* ── SECTION 1: 히어로 ── */}
      <section style={{
        padding: '52px 24px 68px',
        background: 'linear-gradient(155deg,#0b1d47 0%,#163272 50%,#1c4494 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 배경 장식 */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.035)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />

        <FadeSection>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            padding: '5px 12px',
            borderRadius: 20,
            marginBottom: 24,
            textTransform: 'uppercase',
          }}>
            디지털 유산 대행 서비스
          </span>

          <h1 style={{
            color: '#fff',
            fontSize: 38,
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 20px',
            wordBreak: 'keep-all',
            letterSpacing: '-0.5px',
          }}>
            아직도<br />
            <span style={{ color: '#89bfff' }}>정리할 게</span><br />
            남았다고요?
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.68)',
            fontSize: 15,
            lineHeight: 1.75,
            margin: '0 0 36px',
            wordBreak: 'keep-all',
          }}>
            장례 이후 남겨진 디지털 유산,<br />
            에프텀이 전부 대신 처리해드립니다.
          </p>

          <Link href="/apply" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            color: '#0b1d47',
            borderRadius: 14,
            padding: '15px 28px',
            fontWeight: 800,
            fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            letterSpacing: '-0.2px',
          }}>
            무료로 신청하기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </FadeSection>
      </section>

      {/* ── SECTION 2: 감정 공감 ── */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <FadeSection>
          <p style={{ color: '#aaa', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            많은 분들이 겪고 있어요
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', lineHeight: 1.45, margin: '0 0 10px', wordBreak: 'keep-all' }}>
            장례 이후 쌓여있는
          </h2>
          <p style={{
            fontSize: 30,
            color: '#1a3a7c',
            margin: '0 0 20px',
            fontFamily: "'Nanum Pen Script', 'Gaegu', cursive",
            lineHeight: 1.3,
          }}>
            고인의 디지털 유산
          </p>
          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>
            아직 해지되지 않은 구독, 정리되지 않은 계정들.<br />
            가족 중 누가 처리해야 할지 몰라<br />그냥 두고 계신가요?
          </p>
        </FadeSection>
      </section>

      {/* ── SECTION 3: 디지털 유산이란? ── */}
      <section style={{ padding: '0 24px 60px' }}>
        <FadeSection>
          <div style={{ background: '#f4f7ff', borderRadius: 24, padding: '32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg,#163272,#1c4494)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <span style={{ fontSize: 24, color: '#163272', fontFamily: "'Nanum Pen Script', cursive", lineHeight: 1 }}>
                디지털 유산?
              </span>
            </div>

            {/* 서비스 아이콘 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 26, flexWrap: 'wrap' }}>
              {SERVICES.map(s => (
                <div key={s.id} style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: s.bg,
                  border: (s as { border?: string }).border ?? 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}>
                  {s.icon}
                </div>
              ))}
            </div>

            <p style={{ color: '#333', fontSize: 15, lineHeight: 2.0, margin: 0, wordBreak: 'keep-all' }}>
              고인이 이별 전 가지고 있던<br />
              <strong style={{ color: '#163272' }}>숨겨진 돈부터</strong><br />
              고인의 사진, 영상들<br /><br />
              모든 디지털 자산은<br />
              이제 <strong>유산이 되었습니다</strong>
            </p>
          </div>
        </FadeSection>
      </section>

      {/* ── SECTION 4: 에프텀 약속 ── */}
      <section style={{ padding: '0 24px 60px' }}>
        <FadeSection>
          <div style={{
            background: 'linear-gradient(135deg,#0b1d47,#1c4494)',
            borderRadius: 24, padding: '44px 28px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" style={{ marginBottom: 18 }}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.5, wordBreak: 'keep-all' }}>
              에프텀이 고인의<br />
              장례 그 이후를<br />
              함께 하겠습니다
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.75, margin: 0, wordBreak: 'keep-all' }}>
              슬픔의 시간에 행정 부담까지<br />지지 않아도 됩니다.
            </p>
          </div>
        </FadeSection>
      </section>

      {/* ── SECTION 5: 어떻게 하나요? ── */}
      <section style={{ padding: '0 24px 60px' }}>
        <FadeSection>
          <p style={{ color: '#1a3a7c', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1.5, margin: '0 0 28px', wordBreak: 'keep-all' }}>
            간편 가입부터<br />
            간단한 서류 제출로
          </h2>
        </FadeSection>

        {[
          { num: '01', title: '회원가입', desc: '이름, 이메일, 전화번호만 입력하면 끝' },
          { num: '02', title: '서류 3종 업로드', desc: '사망진단서 · 가족관계증명서 · 신분증' },
          { num: '03', title: '서비스 선택 & 서명', desc: '처리할 계정 선택 후 위임장에 서명' },
          { num: '04', title: '에프텀이 처리', desc: '접수 후 모든 대행은 저희가 담당합니다' },
        ].map((step, i) => (
          <FadeSection key={step.num} delay={i * 70}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: '#eef3ff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#163272' }}>{step.num}</span>
              </div>
              <div style={{ paddingTop: 2 }}>
                <p style={{ fontWeight: 700, color: '#111', fontSize: 15, margin: '0 0 3px' }}>{step.title}</p>
                <p style={{ color: '#777', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          </FadeSection>
        ))}

        <FadeSection delay={280}>
          <div style={{ marginTop: 8, padding: '18px 20px', background: '#f0f6ff', borderRadius: 14, borderLeft: '4px solid #163272' }}>
            <p style={{ color: '#163272', fontSize: 14, margin: 0, lineHeight: 1.75, fontWeight: 700, wordBreak: 'keep-all' }}>
              남겨진 포인트·혜택은<br />
              <span style={{ color: '#111', fontWeight: 500 }}>가족에게 돌아올 수 있습니다</span>
            </p>
          </div>
        </FadeSection>
      </section>

      {/* ── SECTION 6: 공감 메시지 ── */}
      <section style={{ padding: '0 24px 60px' }}>
        <FadeSection>
          <div style={{ background: '#fafbff', borderRadius: 24, padding: '36px 24px', textAlign: 'center', border: '1px solid #e8eeff' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#e8f0ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#163272" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 12px', lineHeight: 1.55, wordBreak: 'keep-all' }}>
              이별 후 슬프기도 잠시,<br />
              행정처리로 어려움<br />겪지 마세요
            </h2>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8, margin: 0, wordBreak: 'keep-all' }}>
              에프텀이 그 이후의 기간을<br />함께하겠습니다
            </p>
          </div>
        </FadeSection>
      </section>

      {/* ── SECTION 7: CTA ── */}
      <section style={{ padding: '0 24px 48px' }}>
        <FadeSection>
          <div style={{
            background: 'linear-gradient(135deg,#0b1d47,#163272)',
            borderRadius: 24, padding: '40px 24px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            {/* 타이머 배지 */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.13)', borderRadius: 20,
              padding: '6px 14px', marginBottom: 22,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffd666" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ color: '#ffd666', fontSize: 13, fontWeight: 700 }}>남은 시간 {countdown}</span>
            </div>

            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.4, wordBreak: 'keep-all' }}>
              지금 신청하면<br />
              <span style={{ color: '#89bfff' }}>행정 처리 무료</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 28px', lineHeight: 1.65, wordBreak: 'keep-all' }}>
              선착순 50분 한정 혜택입니다
            </p>

            <Link href="/apply" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#fff', color: '#0b1d47',
              borderRadius: 14, padding: '17px 0',
              fontWeight: 800, fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
              letterSpacing: '-0.2px',
            }}>
              신청하기
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>

            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 14, margin: '14px 0 0' }}>
              신용카드 없이 · 약정 없이 · 지금 바로
            </p>
          </div>
        </FadeSection>
      </section>

      {/* ── 푸터 ── */}
      <footer style={{ background: '#f6f7f9', padding: '32px 24px 48px', borderTop: '1px solid #e8eaed' }}>
        <Image
          src="/logo.jpg"
          alt="AFTERM"
          width={72}
          height={22}
          style={{ objectFit: 'contain', objectPosition: 'left', opacity: 0.45, marginBottom: 18 }}
        />
        <div style={{ color: '#aaa', fontSize: 11, lineHeight: 2.1 }}>
          <p style={{ margin: 0 }}>상호명: 에프텀</p>
          <p style={{ margin: 0 }}>대표자: 윤용현</p>
          <p style={{ margin: 0 }}>사업자번호: 221-20-19292</p>
          <p style={{ margin: 0 }}>소재지: 경기도 평택시 지산로 128 9층</p>
          <p style={{ margin: 0 }}>이메일: afterm001@gmail.com</p>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          <Link href="/terms" style={{ color: '#bbb', fontSize: 11, textDecoration: 'none' }}>이용약관</Link>
          <Link href="/privacy" style={{ color: '#bbb', fontSize: 11, textDecoration: 'none' }}>개인정보처리방침</Link>
        </div>
        <p style={{ color: '#d0d0d0', fontSize: 10, margin: '16px 0 0' }}>
          © 2026 Afterm. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
