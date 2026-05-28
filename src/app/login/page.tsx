'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// useSearchParams는 Suspense 경계 안에서만 사용 가능
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">이메일 <span className="required">*</span></label>
        <input className="form-input" type="email" placeholder="example@email.com"
          value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
      </div>

      <div className="form-group">
        <label className="form-label">비밀번호 <span className="required">*</span></label>
        <input className="form-input" type="password" placeholder="비밀번호 입력"
          value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
      }}>
        <Link href="/" className="logo">after<span>m</span></Link>
      </div>

      <div style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 className="section-title" style={{ marginBottom: '8px' }}>로그인</h1>
          <p className="section-desc">에프텀 서비스를 이용하시려면 로그인해 주세요</p>
        </div>

        {/* useSearchParams를 사용하는 컴포넌트를 Suspense로 래핑 */}
        <Suspense fallback={<div style={{ height: '200px' }} />}>
          <LoginForm />
        </Suspense>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
            아직 계정이 없으신가요?{' '}
            <Link href="/signup" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
