'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          background: '#FEF2F2', borderRadius: '10px', padding: '14px 16px',
          fontSize: '14px', color: '#DC2626', display: 'flex', gap: '8px', alignItems: 'center',
        }}>
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#4A5568' }}>이메일</label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          style={{
            height: '52px', padding: '0 16px',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            fontSize: '16px', fontFamily: 'inherit', outline: 'none',
            color: '#1A1A2E', background: '#fff',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#3B6FE8'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#4A5568' }}>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            height: '52px', padding: '0 16px',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            fontSize: '16px', fontFamily: 'inherit', outline: 'none',
            color: '#1A1A2E', background: '#fff',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#3B6FE8'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          height: '54px', borderRadius: '12px', border: 'none',
          background: loading ? '#9AA3B2' : '#1A1A2E',
          color: '#fff', fontSize: '16px', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginTop: '8px',
          transition: 'background 0.15s',
        }}
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#F7F8FA',
    }}>
      {/* 상단 여백 + 로고 */}
      <div style={{
        padding: '60px 32px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      }}>
        <Image src="/logo.jpg" alt="AFTERM" width={120} height={36} style={{ objectFit: 'contain', objectPosition: 'left' }} />
        <div style={{ marginTop: '32px' }}>
          <h1 style={{
            fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em',
            color: '#1A1A2E', marginBottom: '8px', lineHeight: 1.2,
          }}>
            안녕하세요,<br />다시 오셨네요
          </h1>
          <p style={{ fontSize: '15px', color: '#9AA3B2', fontWeight: 400 }}>
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
        <Suspense fallback={<div style={{ height: '200px' }} />}>
          <LoginForm />
        </Suspense>

        <div style={{ marginTop: '28px', textAlign: 'center' }}>
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
