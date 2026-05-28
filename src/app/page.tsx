'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      document.querySelector('.landing-header')?.classList.toggle('scrolled', !e.isIntersecting)
    }, { threshold: 0 })
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: 'var(--color-background-normal-normal)', minHeight: '100dvh' }}>
      {/* ── 헤더 ── */}
      <header className="landing-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-line-normal-normal)',
        padding: '0 20px',
        height: 'var(--nav-h)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'box-shadow 0.2s',
      }}>
        <Logo width={100} height={30} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/login" style={{
            padding: '8px 16px', borderRadius: 'var(--radius-8)',
            fontSize: '14px', fontWeight: 600,
            color: 'var(--color-label-alternative)', textDecoration: 'none',
          }}>로그인</Link>
          <Link href="/signup" style={{
            padding: '8px 16px', borderRadius: 'var(--radius-8)',
            fontSize: '14px', fontWeight: 600,
            background: 'var(--color-primary-normal)', color: '#fff',
            textDecoration: 'none',
          }}>시작하기</Link>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section ref={heroRef} style={{ padding: '64px 24px 48px', textAlign: 'center' }}>
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
          fontSize: '34px', fontWeight: 800, lineHeight: 1.3,
          letterSpacing: '-0.03em', color: 'var(--color-label-strong)',
          marginBottom: '20px', animationDelay: '0.05s',
        }}>
          떠나신 분의 디지털 흔적,<br />
          afterm이 대신 정리해드려요
        </h1>

        <p className="animate-slide-up" style={{
          fontSize: '16px', color: 'var(--color-label-alternative)', lineHeight: 1.6,
          marginBottom: '40px', animationDelay: '0.1s', letterSpacing: '0.005em'
        }}>
          통신사 · OTT · SNS까지<br />
          한 번의 신청으로 위임 처리합니다.
        </p>

        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', animationDelay: '0.15s' }}>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <Button block>무료로 시작하기</Button>
          </Link>
          <p style={{ fontSize: '13px', color: 'var(--color-label-assistive)', letterSpacing: '0.01em' }}>
            평균 처리 기간 5~7 영업일 · 바로 신청 가능
          </p>
        </div>
      </section>

      {/* ── 신뢰 지표 ── */}
      <section style={{
        background: 'var(--color-coolNeutral-99)', padding: '32px 24px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
        textAlign: 'center',
        borderTop: '1px solid var(--color-line-normal-normal)',
        borderBottom: '1px solid var(--color-line-normal-normal)',
      }}>
        {[
          { num: '28+', label: '지원 서비스' },
          { num: '100%', label: '법적 위임 처리' },
          { num: '₩ 0', label: '서비스 이용' },
        ].map(({ num, label }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-normal)', letterSpacing: '-0.02em' }}>{num}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-label-alternative)', marginTop: '4px', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── 이용 방법 ── */}
      <section style={{ padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '32px', color: 'var(--color-label-strong)' }}>
          간편한 4단계
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { step: '01', title: '고인 정보 입력', desc: '이름, 생년월일, 사망일, 연락처를 입력하고 해지할 서비스를 선택해요' },
            { step: '02', title: '서류 업로드 & 서명', desc: '사망진단서, 가족관계증명서, 신분증을 촬영해 업로드하고 위임장에 서명해요' },
            { step: '03', title: '에프텀이 처리', desc: '에프텀이 각 기업에 해지 요청서를 대신 발송하고 진행상황을 알려드려요' },
            { step: '04', title: '처리 완료 알림', desc: '서비스별 처리 결과를 실시간으로 확인하고 완료 알림을 받아요' },
          ].map(({ step, title, desc }, i) => (
            <div key={step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: i === 0 ? 'var(--color-primary-normal)' : 'var(--color-coolNeutral-98)',
                color: i === 0 ? '#fff' : 'var(--color-label-normal)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
                border: '1px solid ' + (i === 0 ? 'transparent' : 'var(--color-line-normal-normal)'),
                zIndex: 2
              }}>{parseInt(step)}</div>
              {i < 3 && <div style={{
                position: 'absolute', top: '40px', left: '20px', width: '1.5px', height: 'calc(100% - 16px)',
                background: 'var(--color-line-normal-normal)', zIndex: 1
              }}/>}
              <div style={{ paddingBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-label-strong)', marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</div>
                <div style={{ fontSize: '14px', color: 'var(--color-label-alternative)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '8px', background: 'var(--color-background-normal-alternative)' }} />

      {/* ── FAQ ── */}
      <section style={{ padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>
          자주 묻는 질문
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { q: '비용이 드나요?', a: '현재 에프텀은 전면 무료로 서비스를 제공합니다.' },
            { q: '고인의 아이디를 모르면 어떻게 하나요?', a: '아이디를 몰라도 괜찮아요. 각 기업 CS는 이름, 생년월일, 전화번호로 계정을 조회해 처리해드립니다.' },
            { q: '서류는 어떻게 제출하나요?', a: '스마트폰 카메라로 촬영해 직접 업로드하시면 됩니다.' },
            { q: '처리 기간은 얼마나 걸리나요?', a: '서비스마다 다르지만 평균 5~7 영업일 내에 처리됩니다.' },
          ].map(({ q, a }) => (
            <div key={q} className="card-soft" style={{ padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-primary-normal)', letterSpacing: '-0.02em' }}>Q. {q}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-label-alternative)', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section style={{
        padding: '56px 24px',
        background: 'var(--color-label-strong)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-0.03em' }}>
          비용 없이 시작하세요
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: 1.6 }}>
          어려운 행정 절차, 에프텀이<br />대신 처리해드립니다
        </p>
        <Link href="/signup" style={{ textDecoration: 'none' }}>
          <Button style={{ background: '#fff', color: 'var(--color-label-strong)' }}>
            무료 신청 시작하기
          </Button>
        </Link>
      </section>

      {/* ── 푸터 ── */}
      <footer style={{
        padding: '40px 24px',
        background: 'var(--color-label-strong)',
        color: 'var(--color-label-assistive)',
        fontSize: '12px', lineHeight: 1.6,
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Logo width={80} height={24} dark={true} />
        <div style={{ marginTop: '20px' }}>
          <p>에프텀 (Afterm)</p>
          <p>대표자: 윤용현 | 사업자등록번호: 000-00-00000</p>
          <p>서울특별시 강남구 테헤란로 000, 0층</p>
          <p>고객센터: 1588-0000 (평일 10:00 - 18:00)</p>
          <p>이메일: support@afterm.co.kr</p>
        </div>
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <Link href="/terms" style={{ color: 'var(--color-label-alternative)', textDecoration: 'none' }}>이용약관</Link>
          <Link href="/privacy" style={{ color: 'var(--color-label-alternative)', textDecoration: 'none', fontWeight: 600 }}>개인정보처리방침</Link>
        </div>
        <div style={{ marginTop: '32px' }}>
          © 2026 Afterm. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
