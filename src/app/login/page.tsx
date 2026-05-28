'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
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
    <div>
      {/* 소셜 로그인 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {/* 카카오 */}
        <button
          onClick={handleKakao}
          disabled={!!socialLoading}
          style={{
            height: '52px', borderRadius: '12px', border: 'none',
            background: '#FEE500', color: '#191919',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
            opacity: socialLoading && socialLoading !== 'kakao' ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <span style={{ fontSize: '20px' }}>💬</span>
          {socialLoading === 'kakao' ? '연결 중...' : '카카오로 계속하기'}
        </button>

        {/* 구글 */}
        <button
          onClick={handleGoogle}
          disabled={!!socialLoading}
          style={{
            height: '52px', borderRadius: '12px',
            border: '1.5px solid #E2E8F0', background: '#fff',
            color: '#1A1A2E', fontSize: '15px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: socialLoading && socialLoading !== 'google' ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {/* 구글 G 아이콘 */}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        <span style={{ fontSize: '12px', color: '#9AA3B2', fontWeight: 500 }}>또는 이메일로</span>
        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
      </div>

      {/* 이메일/비밀번호 폼 */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', borderRadius: '10px', padding: '12px 14px',
            fontSize: '13px', color: '#DC2626', display: 'flex', gap: '8px',
          }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          style={{
            height: '52px', padding: '0 16px',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            fontSize: '15px', fontFamily: 'inherit', outline: 'none',
            color: '#1A1A2E', background: '#fff', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#3B6FE8'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            height: '52px', padding: '0 16px',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            fontSize: '15px', fontFamily: 'inherit', outline: 'none',
            color: '#1A1A2E', background: '#fff', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#3B6FE8'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            height: '52px', borderRadius: '12px', border: 'none',
            background: loading ? '#9AA3B2' : '#1A1A2E',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s',
          }}
        >
          {loading ? '로그인 중...' : '이메일로 로그인'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F8FA' }}>
      {/* 상단 */}
      <div style={{ padding: '60px 32px 32px', display: 'flex', flexDirection: 'column' }}>
        <Logo width={110} height={34} />
        <div style={{ marginTop: '32px' }}>
          <h1 style={{
            fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em',
            color: '#1A1A2E', marginBottom: '6px', lineHeight: 1.2,
          }}>
            다시 오셨네요
          </h1>
          <p style={{ fontSize: '14px', color: '#9AA3B2' }}>
            계속하려면 로그인해 주세요
          </p>
        </div>
      </div>

      {/* 폼 카드 */}
      <div style={{
        flex: 1, background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 40px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}>
        <Suspense fallback={<div style={{ height: '260px' }} />}>
          <LoginForm />
        </Suspense>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9AA3B2' }}>
            아직 계정이 없으신가요?{' '}
            <Link href="/signup" style={{ color: '#3B6FE8', fontWeight: 700, textDecoration: 'none' }}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
