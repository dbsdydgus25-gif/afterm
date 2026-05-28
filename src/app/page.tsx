'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

// 랜딩 페이지 - 에프텀 MVP1
// 신뢰감 있는 원티드 스타일 디자인
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 스크롤 시 헤더 그림자 처리
    const observer = new IntersectionObserver(([e]) => {
      document.querySelector('.landing-header')?.classList.toggle('scrolled', !e.isIntersecting)
    }, { threshold: 0 })
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100dvh' }}>
      {/* ── 헤더 ── */}
      <header className="landing-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 20px',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'box-shadow 0.2s',
      }}>
        <span className="logo">after<span>m</span></span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/login" style={{
            padding: '8px 16px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-2)', textDecoration: 'none',
          }}>로그인</Link>
          <Link href="/signup" style={{
            padding: '8px 16px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600,
            background: 'var(--color-primary)', color: '#fff',
            textDecoration: 'none',
          }}>시작하기</Link>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section ref={heroRef} style={{ padding: '56px 24px 48px', textAlign: 'center' }}>
        <div className="animate-fade-in" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--color-accent-light)', borderRadius: '100px',
          padding: '6px 14px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)' }}>
            🏛️ 디지털 유산 행정 대행 서비스
          </span>
        </div>

        <h1 className="animate-fade-in" style={{
          fontSize: '30px', fontWeight: 900, lineHeight: 1.25,
          letterSpacing: '-0.04em', color: 'var(--color-primary)',
          marginBottom: '20px', animationDelay: '0.05s',
        }}>
          고인의 디지털 구독,<br />
          에프텀이 대신<br />
          처리해드릴게요
        </h1>

        <p className="animate-fade-in" style={{
          fontSize: '16px', color: 'var(--color-text-2)', lineHeight: 1.7,
          marginBottom: '36px', animationDelay: '0.1s',
        }}>
          사망진단서 한 장으로<br />
          넷플릭스부터 통신사까지<br />
          한 번에 해지 신청하세요
        </p>

        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', animationDelay: '0.15s' }}>
          <Link href="/signup" className="btn btn-primary" style={{ display: 'block' }}>
            무료로 신청 시작하기
          </Link>
          <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
            평균 처리 기간 5~7 영업일 · 지금 바로 신청 가능
          </p>
        </div>
      </section>

      {/* ── 신뢰 지표 ── */}
      <section style={{
        background: 'var(--color-bg)', padding: '28px 24px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
        textAlign: 'center',
      }}>
        {[
          { num: '28+', label: '지원 서비스' },
          { num: '100%', label: '법적 위임 처리' },
          { num: '무료', label: '서비스 이용' },
        ].map(({ num, label }) => (
          <div key={label}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.03em' }}>{num}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '4px', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── 이용 방법 ── */}
      <section style={{ padding: '48px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '32px', color: 'var(--color-primary)' }}>
          이용 방법
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { step: '01', icon: '📋', title: '고인 정보 입력', desc: '이름, 생년월일, 사망일, 연락처를 입력하고 해지할 서비스를 선택해요' },
            { step: '02', icon: '📄', title: '서류 업로드 & 서명', desc: '사망진단서, 가족관계증명서, 신분증을 촬영해 업로드하고 위임장에 서명해요' },
            { step: '03', icon: '📨', title: '에프텀이 처리', desc: '에프텀이 각 기업에 해지 요청서를 대신 발송하고 진행상황을 알려드려요' },
            { step: '04', icon: '✅', title: '처리 완료 알림', desc: '서비스별 처리 결과를 실시간으로 확인하고 완료 알림을 받아요' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'var(--color-accent-light)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>STEP {step}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-thick" />

      {/* ── 지원 서비스 ── */}
      <section style={{ padding: '48px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          지원 서비스
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-3)', marginBottom: '24px' }}>총 28개 주요 서비스 지원</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['넷플릭스','웨이브','티빙','멜론','지니','스포티파이','네이버','카카오','구글','인스타','페이스북','SKT','KT','LG U+','토스','카카오페이','왓챠','쿠팡플레이','디즈니+','유튜브','플로','벅스','다음','트위터','iCloud','페이코','네이버페이','네이버클라우드'].map(name => (
            <span key={name} style={{
              padding: '6px 12px', borderRadius: '100px',
              border: '1px solid var(--color-border)',
              fontSize: '13px', color: 'var(--color-text-2)',
              background: 'var(--color-surface)',
            }}>{name}</span>
          ))}
        </div>
      </section>

      <div className="divider-thick" />

      {/* ── FAQ ── */}
      <section style={{ padding: '48px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>
          자주 묻는 질문
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { q: '비용이 드나요?', a: '현재 에프텀은 무료로 서비스를 제공합니다.' },
            { q: '고인의 아이디를 모르면 어떻게 하나요?', a: '아이디를 몰라도 괜찮아요. 각 기업 CS는 이름, 생년월일, 전화번호로 계정을 조회해 처리해드립니다.' },
            { q: '서류는 어떻게 제출하나요?', a: '스마트폰 카메라로 촬영해 앱 내에서 직접 업로드하시면 됩니다.' },
            { q: '처리 기간은 얼마나 걸리나요?', a: '서비스마다 다르지만 평균 5~7 영업일 내에 처리됩니다. 일부 SNS는 최대 14일이 소요될 수 있습니다.' },
          ].map(({ q, a }) => (
            <div key={q} style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>Q. {q}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section style={{
        padding: '48px 24px',
        background: 'var(--color-primary)',
        textAlign: 'center',
        margin: '0 -0px',
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.03em' }}>
          지금 바로 시작하세요
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', lineHeight: 1.6 }}>
          어려운 행정 절차, 에프텀이<br />대신 처리해드립니다
        </p>
        <Link href="/signup" style={{
          display: 'block', padding: '16px 24px',
          background: '#fff', color: 'var(--color-primary)',
          borderRadius: '12px', fontWeight: 800, fontSize: '16px',
          textDecoration: 'none', letterSpacing: '-0.02em',
        }}>
          무료 신청 시작하기 →
        </Link>
      </section>

      {/* ── 푸터 ── */}
      <footer style={{ padding: '32px 24px', background: '#0F0F1A' }}>
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>
            after<span style={{ color: 'var(--color-accent)' }}>m</span>
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          주식회사 에프텀<br />
          디지털 유산 행정 대행 서비스<br />
          고객센터: afterm001@gmail.com
        </p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
          {['서비스 이용약관', '개인정보처리방침'].map(t => (
            <span key={t} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
