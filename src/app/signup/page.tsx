'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function SignupPage() {
  const router = useRouter()
  // 스텝별 단일 입력 방식
  const [step, setStep] = useState<'name' | 'email' | 'password' | 'agree'>('name')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const STEPS = ['name', 'email', 'password', 'agree'] as const
  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  const handleNext = () => {
    setError('')
    if (step === 'name') {
      if (!name.trim()) { setError('이름을 입력해 주세요'); return }
      setStep('email')
    } else if (step === 'email') {
      if (!email.includes('@')) { setError('올바른 이메일을 입력해 주세요'); return }
      setStep('password')
    } else if (step === 'password') {
      if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return }
      if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
      setStep('agree')
    }
  }

  const handleSubmit = async () => {
    if (!agreed) { setError('약관에 동의해 주세요'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message === 'User already registered' ? '이미 가입된 이메일입니다' : '회원가입 중 오류가 발생했습니다')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step !== 'agree') handleNext()
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F8FA' }}>
      {/* 상단 헤더 */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => {
            if (step === 'name') router.push('/login')
            else setStep(STEPS[stepIndex - 1])
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: '#4A5568', padding: '4px',
            fontFamily: 'inherit',
          }}
        >
          ←
        </button>
        <Logo width={100} height={30} />
        <div style={{ width: '32px' }} />
      </div>

      {/* 진행 바 */}
      <div style={{ padding: '0 20px 0', marginBottom: '4px' }}>
        <div style={{ height: '3px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#3B6FE8', borderRadius: '100px',
            width: `${progress}%`, transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* 스텝 콘텐츠 */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>

        {/* 오류 메시지 */}
        {error && (
          <div style={{
            background: '#FEF2F2', borderRadius: '10px', padding: '12px 14px',
            fontSize: '13px', color: '#DC2626', marginBottom: '16px',
            display: 'flex', gap: '8px',
          }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* STEP: 이름 */}
        {step === 'name' && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3B6FE8', marginBottom: '12px', letterSpacing: '0.04em' }}>1 / 4</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '8px', lineHeight: 1.3 }}>
              이름이 무엇인가요?
            </h2>
            <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '32px' }}>서비스 이용 및 위임장에 사용됩니다</p>
            <input
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                width: '100%', height: '56px', padding: '0 0',
                border: 'none', borderBottom: '2.5px solid #E2E8F0',
                fontSize: '22px', fontWeight: 700, fontFamily: 'inherit',
                color: '#1A1A2E', background: 'transparent', outline: 'none',
                letterSpacing: '-0.02em',
              }}
              onFocus={e => e.target.style.borderBottomColor = '#3B6FE8'}
              onBlur={e => e.target.style.borderBottomColor = '#E2E8F0'}
            />
          </div>
        )}

        {/* STEP: 이메일 */}
        {step === 'email' && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3B6FE8', marginBottom: '12px', letterSpacing: '0.04em' }}>2 / 4</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '8px', lineHeight: 1.3 }}>
              이메일 주소를<br />알려주세요
            </h2>
            <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '32px' }}>로그인 및 알림 수신에 사용됩니다</p>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              inputMode="email"
              autoComplete="email"
              style={{
                width: '100%', height: '56px', padding: '0 0',
                border: 'none', borderBottom: '2.5px solid #E2E8F0',
                fontSize: '20px', fontWeight: 700, fontFamily: 'inherit',
                color: '#1A1A2E', background: 'transparent', outline: 'none',
                letterSpacing: '-0.01em',
              }}
              onFocus={e => e.target.style.borderBottomColor = '#3B6FE8'}
              onBlur={e => e.target.style.borderBottomColor = '#E2E8F0'}
            />
          </div>
        )}

        {/* STEP: 비밀번호 */}
        {step === 'password' && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3B6FE8', marginBottom: '12px', letterSpacing: '0.04em' }}>3 / 4</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '8px', lineHeight: 1.3 }}>
              비밀번호를<br />설정해 주세요
            </h2>
            <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '32px' }}>8자 이상, 영문/숫자 조합을 권장합니다</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <input
                type="password"
                placeholder="비밀번호 (8자 이상)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                autoComplete="new-password"
                style={{
                  width: '100%', height: '52px', padding: '0 0',
                  border: 'none', borderBottom: '2.5px solid #E2E8F0',
                  fontSize: '20px', fontFamily: 'inherit',
                  color: '#1A1A2E', background: 'transparent', outline: 'none',
                }}
                onFocus={e => e.target.style.borderBottomColor = '#3B6FE8'}
                onBlur={e => e.target.style.borderBottomColor = '#E2E8F0'}
              />
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="new-password"
                style={{
                  width: '100%', height: '52px', padding: '0 0',
                  border: 'none',
                  borderBottom: `2.5px solid ${passwordConfirm && password !== passwordConfirm ? '#EF4444' : '#E2E8F0'}`,
                  fontSize: '20px', fontFamily: 'inherit',
                  color: '#1A1A2E', background: 'transparent', outline: 'none',
                }}
                onFocus={e => e.target.style.borderBottomColor = password === passwordConfirm ? '#3B6FE8' : '#EF4444'}
                onBlur={e => e.target.style.borderBottomColor = passwordConfirm && password !== passwordConfirm ? '#EF4444' : '#E2E8F0'}
              />
            </div>
          </div>
        )}

        {/* STEP: 약관 동의 */}
        {step === 'agree' && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3B6FE8', marginBottom: '12px', letterSpacing: '0.04em' }}>4 / 4</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '8px', lineHeight: 1.3 }}>
              마지막으로<br />약관에 동의해 주세요
            </h2>
            <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '32px' }}>안전한 서비스 이용을 위해 필요합니다</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '[필수] 서비스 이용약관', sub: '에프텀 서비스 이용에 관한 약관' },
                { label: '[필수] 개인정보 처리방침', sub: '고인 정보 처리 목적 및 방법' },
                { label: '[필수] 위임장 작성 및 대행 동의', sub: '디지털 유산 해지 대행 서비스 동의' },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '16px', background: agreed ? '#EEF3FD' : '#F7F8FA',
                  borderRadius: '12px', border: `1.5px solid ${agreed ? '#3B6FE8' : '#E2E8F0'}`,
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: agreed ? '#3B6FE8' : '#E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {agreed && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#9AA3B2', marginTop: '2px' }}>{item.sub}</div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setAgreed(!agreed)}
                style={{
                  marginTop: '8px', padding: '14px',
                  borderRadius: '12px', border: `2px solid ${agreed ? '#3B6FE8' : '#E2E8F0'}`,
                  background: agreed ? '#3B6FE8' : 'transparent',
                  color: agreed ? '#fff' : '#4A5568',
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {agreed ? '✓ 전체 동의 완료' : '전체 동의하기'}
              </button>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* 하단 버튼 */}
        <div style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          {step !== 'agree' ? (
            <button
              onClick={handleNext}
              style={{
                width: '100%', height: '54px', borderRadius: '14px', border: 'none',
                background: '#1A1A2E', color: '#fff', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              계속하기 →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!agreed || loading}
              style={{
                width: '100%', height: '54px', borderRadius: '14px', border: 'none',
                background: agreed && !loading ? '#3B6FE8' : '#E2E8F0',
                color: agreed ? '#fff' : '#9AA3B2',
                fontSize: '16px', fontWeight: 700,
                cursor: agreed && !loading ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {loading ? '가입 중...' : '가입 완료하기'}
            </button>
          )}

          {step === 'name' && (
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#9AA3B2' }}>
              이미 계정이 있으신가요?{' '}
              <Link href="/login" style={{ color: '#3B6FE8', fontWeight: 700, textDecoration: 'none' }}>로그인</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
