'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/Topbar'
import StepIndicator from '@/components/ui/StepIndicator'
import Button from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  // 스텝별 단일 입력 방식 (Toss Style)
  const [step, setStep] = useState<'name' | 'email' | 'password' | 'agree'>('name')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const STEPS = [
    { id: 'name', label: '이름' },
    { id: 'email', label: '이메일' },
    { id: 'password', label: '비밀번호' },
    { id: 'agree', label: '약관동의' }
  ]
  const stepIndex = STEPS.findIndex(s => s.id === step)

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

  const handleBack = () => {
    if (step === 'name') router.push('/login')
    else setStep(STEPS[stepIndex - 1].id as any)
  }

  return (
    <div className="screen">
      <Topbar onBack={handleBack} title="회원가입" />
      <StepIndicator steps={STEPS} current={stepIndex} />

      <div className="screen-body" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        
        {error && (
          <div className="card-soft" style={{ padding: '12px 16px', marginBottom: '24px', color: 'var(--color-status-negative)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* STEP: 이름 */}
        {step === 'name' && (
          <div className="animate-slide-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              이름이 무엇인가요?
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>서비스 이용 및 위임장에 사용됩니다</p>
            <input type="text" placeholder="예: 김영순" className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} autoFocus />
          </div>
        )}

        {/* STEP: 이메일 */}
        {step === 'email' && (
          <div className="animate-slide-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              이메일 주소를<br />알려주세요
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>로그인 및 알림 수신에 사용됩니다</p>
            <input type="email" placeholder="example@email.com" className="input" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} autoFocus />
          </div>
        )}

        {/* STEP: 비밀번호 */}
        {step === 'password' && (
          <div className="animate-slide-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              비밀번호를<br />설정해 주세요
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>8자 이상, 영문/숫자 조합을 권장합니다</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <input type="password" placeholder="비밀번호 (8자 이상)" className="input" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
              <input type="password" placeholder="비밀번호 확인" className="input" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} onKeyDown={handleKeyDown} />
            </div>
          </div>
        )}

        {/* STEP: 약관 동의 */}
        {step === 'agree' && (
          <div className="animate-slide-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              마지막으로<br />약관에 동의해 주세요
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>안전한 서비스 이용을 위해 필요합니다</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '[필수] 서비스 이용약관', sub: '에프텀 서비스 이용에 관한 약관' },
                { label: '[필수] 개인정보 처리방침', sub: '고인 정보 처리 목적 및 방법' },
                { label: '[필수] 위임장 작성 및 대행 동의', sub: '디지털 유산 해지 대행 서비스 동의' },
              ].map(item => (
                <div key={item.label} className="card-soft" onClick={() => setAgreed(!agreed)} style={{
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  borderColor: agreed ? 'var(--color-primary-normal)' : 'var(--color-line-normal-alternative)',
                  background: agreed ? 'var(--color-blue-99)' : 'var(--color-coolNeutral-99)'
                }}>
                  <div className={`checkbox ${agreed ? 'checked' : ''}`}>
                    {agreed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-strong)' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-label-alternative)', marginTop: '2px' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
              
              <Button variant={agreed ? 'primary' : 'secondary'} onClick={() => setAgreed(!agreed)} style={{ marginTop: '8px' }}>
                {agreed ? '✓ 전체 동의 완료' : '전체 동의하기'}
              </Button>
            </div>
          </div>
        )}

      </div>

      <div className="cta-dock">
        {step !== 'agree' ? (
          <Button block onClick={handleNext}>계속하기</Button>
        ) : (
          <Button block disabled={!agreed || loading} onClick={handleSubmit}>
            {loading ? '가입 중...' : '가입 완료하기'}
          </Button>
        )}
      </div>
    </div>
  )
}
