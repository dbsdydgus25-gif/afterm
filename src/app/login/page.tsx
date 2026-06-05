'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/Topbar'
import Button from '@/components/ui/Button'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/home'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'kakao' | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  // 이메일/비밀번호 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    console.log('로그인 시도:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('로그인 에러:', error)
      setError(`로그인 실패: ${error.message || '이메일 또는 비밀번호가 올바르지 않습니다'}`)
      setLoading(false)
      return
    }
    console.log('로그인 성공:', data)
    window.location.href = next
  }

  // 구글 로그인
  const handleGoogle = async () => {
    setSocialLoading('google')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    })
  }

  // 카카오 로그인
  const handleKakao = async () => {
    setSocialLoading('kakao')
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    })
  }

  return (
    <div className="screen-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800,
          color: 'var(--color-label-strong)', marginBottom: '8px', letterSpacing: '-0.02em'
        }}>
          다시 오셨네요
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)' }}>
          계속하려면 로그인해 주세요
        </p>
      </div>

      {/* 소셜 로그인 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        <button onClick={handleKakao} disabled={!!socialLoading} style={{
          height: '52px', borderRadius: 'var(--radius-12)', border: 'none',
          background: '#FEE500', color: '#191919',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: socialLoading && socialLoading !== 'kakao' ? 0.5 : 1, transition: 'all 0.2s'
        }}>
          <span style={{ fontSize: '20px' }}>💬</span>
          {socialLoading === 'kakao' ? '연결 중...' : '카카오로 계속하기'}
        </button>

        <button onClick={handleGoogle} disabled={!!socialLoading} style={{
          height: '52px', borderRadius: 'var(--radius-12)',
          border: '1px solid var(--color-line-normal-normal)', background: '#fff',
          color: 'var(--color-label-strong)', fontSize: '15px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: socialLoading && socialLoading !== 'google' ? 0.5 : 1, transition: 'all 0.2s'
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          {socialLoading === 'google' ? '연결 중...' : '구글로 계속하기'}
        </button>
      </div>

      {/* 구분선 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-line-normal-normal)' }} />
        <span style={{ fontSize: '13px', color: 'var(--color-label-assistive)', fontWeight: 600 }}>또는 이메일로</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-line-normal-normal)' }} />
      </div>

      {/* 이메일/비밀번호 폼 */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div className="card-soft" style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-status-negative)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <input type="email" placeholder="이메일" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호" className="input" value={password} onChange={e => setPassword(e.target.value)} required />

        <Button type="submit" disabled={loading} block style={{ marginTop: '16px' }}>
          {loading ? '로그인 중...' : '이메일로 로그인'}
        </Button>
      </form>

      {/* 회원가입 유도 */}
      <div style={{ marginTop: '32px', textAlign: 'center', paddingBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-label-alternative)', margin: 0 }}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: 'var(--color-primary-normal)', fontWeight: 700, textDecoration: 'none' }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="screen">
      <Topbar title="로그인" onBack={() => {
        // router.back() 대신 홈으로 명시 이동
        // 소셜 로그인 OAuth 리다이렉트 후 히스토리 스택이 없어 back()이 에러 발생하는 버그 방지
        if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back()
        } else {
          window.location.href = '/'
        }
      }} />
      <Suspense fallback={<div />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
