'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!pw) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })

    if (res.ok) {
      // 쿠키가 확실히 적용되도록 전체 페이지 이동
      window.location.href = '/admin'
    } else {
      setError('비밀번호가 올바르지 않습니다.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0a0f1e',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>
            after<span style={{ color: '#0066ff' }}>m</span>
          </span>
          <span style={{
            display: 'inline-block', background: 'rgba(0,102,255,0.15)', color: '#3385ff',
            fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
            marginLeft: 8, verticalAlign: 'middle',
          }}>CONSOLE</span>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '10px 0 0' }}>
            관리자 전용 액세스
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)', padding: '32px 28px',
        }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8 }}>
            관리자 비밀번호
          </label>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !pw}
            style={{
              width: '100%', marginTop: 20, padding: '14px', background: '#0066ff',
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', opacity: pw ? 1 : 0.5,
            }}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}
