'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return }
    if (!agreed) { setError('서비스 이용약관에 동의해 주세요'); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? '이미 가입된 이메일입니다'
        : '회원가입 중 오류가 발생했습니다')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
      }}>
        <Link href="/" className="logo">after<span>m</span></Link>
      </div>

      <div style={{ flex: 1, padding: '40px 24px 100px' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 className="section-title" style={{ marginBottom: '8px' }}>회원가입</h1>
          <p className="section-desc">에프텀 서비스를 무료로 이용해 보세요</p>
        </div>

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">이름 <span className="required">*</span></label>
            <input className="form-input" type="text" placeholder="홍길동" value={name}
              onChange={e => setName(e.target.value)} required autoComplete="name" />
          </div>

          <div className="form-group">
            <label className="form-label">이메일 <span className="required">*</span></label>
            <input className="form-input" type="email" placeholder="example@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 <span className="required">*</span></label>
            <input className="form-input" type="password" placeholder="8자 이상 입력" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 확인 <span className="required">*</span></label>
            <input className="form-input" type="password" placeholder="비밀번호 재입력" value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)} required autoComplete="new-password" />
          </div>

          <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '16px', background: 'var(--color-bg)', borderRadius: '12px' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '1px', flexShrink: 0, accentColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-text)' }}>서비스 이용약관</strong> 및{' '}
              <strong style={{ color: 'var(--color-text)' }}>개인정보처리방침</strong>에 동의합니다.
              개인정보는 서비스 제공 목적으로만 사용됩니다.
            </span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
