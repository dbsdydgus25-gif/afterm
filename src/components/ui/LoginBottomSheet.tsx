'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginBottomSheet({ open, onClose, onSuccess, redirectTo = '/home' }: {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectTo?: string
}) {
  const [mode, setMode] = useState<'main' | 'email'>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!open) { setMode('main'); setError('') }
  }, [open])

  const handleKakao = async () => {
    setLoading('kakao')
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('email'); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(null)
    if (err) { setError('이메일 또는 비밀번호가 올바르지 않습니다'); return }
    if (onSuccess) onSuccess()
    else window.location.href = redirectTo
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 310,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .3s ease',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: open ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
        transition: 'transform .35s cubic-bezier(.32,0,.24,1)',
        width: '100%', maxWidth: 480, background: '#fff',
        borderRadius: '24px 24px 0 0', padding: `0 24px calc(40px + env(safe-area-inset-bottom))`,
        zIndex: 311, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0' }} />
        </div>

        {mode === 'main' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>에프텀 시작하기</h2>
            <p style={{ color: '#888', fontSize: 13, margin: '0 0 28px' }}>카카오톡으로 1초 만에 시작하세요</p>
            <button onClick={handleKakao} disabled={!!loading} style={{
              width: '100%', padding: '15px', borderRadius: 14, background: '#FEE500',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, marginBottom: 12, fontSize: 15,
              fontWeight: 700, color: '#3C1E1E', opacity: loading ? 0.7 : 1,
            }}>
              {loading === 'kakao' ? '연결 중...' : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#3C1E1E" d="M12 3C6.477 3 2 6.582 2 11c0 2.89 1.815 5.44 4.584 6.965L5.5 21l4.326-2.876A11.91 11.91 0 0012 18.2c5.523 0 10-3.582 10-8.2S17.523 3 12 3z"/></svg>
                  카카오로 시작하기
                </>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#eee' }} />
              <span style={{ color: '#ccc', fontSize: 12 }}>또는</span>
              <div style={{ flex: 1, height: 1, background: '#eee' }} />
            </div>
            <button onClick={() => setMode('email')} style={{
              width: '100%', padding: '15px', borderRadius: 14, background: '#f7f7f7',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#555',
            }}>
              이메일로 로그인
            </button>
          </>
        )}

        {mode === 'email' && (
          <>
            <button onClick={() => setMode('main')} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px',
              color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              뒤로
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 24px' }}>이메일 로그인</h2>
            <form onSubmit={handleEmailLogin}>
              <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e0e0e0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }} />
              <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e0e0e0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }} />
              {error && <p style={{ color: '#e53e3e', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}
              <button type="submit" disabled={!!loading} style={{
                width: '100%', padding: '15px', borderRadius: 14, background: '#2563EB',
                border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff',
                marginTop: 8, opacity: loading ? 0.7 : 1,
              }}>
                {loading === 'email' ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  )
}
