'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'name' | 'phone' | 'password'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('name')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null)

  // 유저 정보
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // 이름 입력
  const [nameInput, setNameInput] = useState('')

  // 휴대폰 OTP
  const [phoneInput, setPhoneInput] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [timer, setTimer] = useState(0)
  const [sending, setSending] = useState(false)

  // 비밀번호
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      const n = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
      const p = user.user_metadata?.phone || user.phone || ''
      setName(n); setNameInput(n)
      setPhone(p); setPhoneInput(p ? formatPhone(p) : '')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
    return p
  }

  // ─── 이름 저장 ───
  const saveName = async () => {
    if (!nameInput.trim()) return showToast('이름을 입력해주세요', false)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } })
    await supabase.from('profiles').update({ name: nameInput.trim() }).eq('id', user!.id)
    setName(nameInput.trim())
    showToast('이름이 변경되었습니다')
    setTimeout(() => router.back(), 1200)
  }

  // ─── OTP 발송 ───
  const sendOtp = async () => {
    const cleaned = phoneInput.replace(/\D/g, '')
    if (cleaned.length < 10) return showToast('올바른 번호를 입력해주세요', false)
    setSending(true)
    const res = await fetch('/api/otp/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    })
    setSending(false)
    if (res.ok) { setOtpSent(true); setTimer(180); showToast('인증번호를 발송했습니다') }
    else showToast('발송 실패, 다시 시도해주세요', false)
  }

  // ─── OTP 확인 ───
  const verifyOtp = async () => {
    const cleaned = phoneInput.replace(/\D/g, '')
    const res = await fetch('/api/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, code: otpCode }),
    })
    if (res.ok) { setOtpVerified(true); showToast('인증 완료!') }
    else {
      const { error } = await res.json()
      showToast(error || '인증번호가 올바르지 않습니다', false)
    }
  }

  // ─── 휴대폰 저장 ───
  const savePhone = async () => {
    if (!otpVerified) return showToast('인증을 먼저 완료해주세요', false)
    const cleaned = phoneInput.replace(/\D/g, '')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ phone: cleaned }).eq('id', user!.id)
    await supabase.auth.updateUser({ data: { phone: cleaned } })
    showToast('휴대폰 번호가 변경되었습니다')
    setTimeout(() => router.back(), 1200)
  }

  // ─── 비밀번호 저장 ───
  const savePassword = async () => {
    if (pw.length < 6) return showToast('비밀번호는 6자 이상이어야 합니다', false)
    if (pw !== pw2) return showToast('비밀번호가 일치하지 않습니다', false)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return showToast('변경 실패: ' + error.message, false)
    showToast('비밀번호가 변경되었습니다')
    setTimeout(() => router.back(), 1200)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Pretendard' }}>
      <div style={{ fontSize: 14, color: '#9CA3AF' }}>로딩 중...</div>
    </div>
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'name', label: '이름' },
    { key: 'phone', label: '휴대폰' },
    { key: 'password', label: '비밀번호' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9' }}>
      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok !== false ? 'rgba(22,50,114,0.92)' : 'rgba(239,68,68,0.92)',
          color: '#fff', fontSize: 14, fontWeight: 600,
          padding: '12px 24px', borderRadius: 99, zIndex: 600, whiteSpace: 'nowrap',
        }}>{toast.msg}</div>
      )}

      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>정보 수정</h1>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === t.key ? 800 : 500,
            color: tab === t.key ? '#163272' : '#9CA3AF',
            borderBottom: tab === t.key ? '2.5px solid #163272' : '2.5px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '28px 20px' }}>

        {/* ─── 이름 탭 ─── */}
        {tab === 'name' && (
          <div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>현재 이름</p>
            <div style={{ background: '#F9FAFB', borderRadius: 14, padding: '14px 16px', marginBottom: 24, border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>{name}</p>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>새 이름</p>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="실명을 입력해주세요"
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                border: '1.5px solid #E5E7EB', fontSize: 16, fontWeight: 600,
                boxSizing: 'border-box', outline: 'none', marginBottom: 32,
                background: '#fff',
              }}
            />
            <button onClick={saveName} style={{
              width: '100%', padding: '18px', borderRadius: 16, background: '#163272',
              color: '#fff', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
            }}>저장하기</button>
          </div>
        )}

        {/* ─── 휴대폰 탭 ─── */}
        {tab === 'phone' && (
          <div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>현재 번호</p>
            <div style={{ background: '#F9FAFB', borderRadius: 14, padding: '14px 16px', marginBottom: 24, border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>{phone ? formatPhone(phone) : '미등록'}</p>
            </div>

            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>새 휴대폰 번호</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="010-0000-0000"
                type="tel"
                disabled={otpVerified}
                style={{
                  flex: 1, padding: '16px', borderRadius: 14,
                  border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none',
                  background: otpVerified ? '#F0FDF4' : '#fff',
                  color: otpVerified ? '#15803D' : '#111827',
                }}
              />
              <button onClick={sendOtp} disabled={sending || otpVerified || (timer > 0)} style={{
                padding: '16px', borderRadius: 14, border: 'none', cursor: otpVerified ? 'default' : 'pointer',
                background: otpVerified ? '#D1FAE5' : '#163272',
                color: otpVerified ? '#15803D' : '#fff',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 80,
              }}>
                {otpVerified ? '✓ 완료' : sending ? '발송중' : timer > 0 ? `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}` : otpSent ? '재발송' : '인증요청'}
              </button>
            </div>

            {otpSent && !otpVerified && (
              <>
                <div style={{ background: '#EBF3FF', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#163272', margin: 0, fontWeight: 600 }}>
                    💬 카카오톡 또는 문자로 인증번호를 발송했습니다
                  </p>
                </div>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>인증번호 6자리</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                  <input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="인증번호 입력"
                    type="tel"
                    style={{
                      flex: 1, padding: '16px', borderRadius: 14,
                      border: '1.5px solid #E5E7EB', fontSize: 16, fontWeight: 700,
                      boxSizing: 'border-box', outline: 'none', letterSpacing: 4,
                    }}
                  />
                  <button onClick={verifyOtp} style={{
                    padding: '16px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: '#163272', color: '#fff', fontSize: 14, fontWeight: 700,
                  }}>확인</button>
                </div>
              </>
            )}

            {!otpSent && <div style={{ marginBottom: 32 }} />}

            <button onClick={savePhone} disabled={!otpVerified} style={{
              width: '100%', padding: '18px', borderRadius: 16, border: 'none',
              background: otpVerified ? '#163272' : '#E5E7EB',
              color: otpVerified ? '#fff' : '#9CA3AF',
              fontSize: 16, fontWeight: 800, cursor: otpVerified ? 'pointer' : 'not-allowed',
            }}>
              {otpVerified ? '번호 변경하기' : '인증 후 변경 가능'}
            </button>
          </div>
        )}

        {/* ─── 비밀번호 탭 ─── */}
        {tab === 'password' && (
          <div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>새 비밀번호</p>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="6자 이상 입력해주세요"
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                boxSizing: 'border-box', outline: 'none', marginBottom: 16, background: '#fff',
              }}
            />
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>비밀번호 확인</p>
            <input
              type="password"
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              placeholder="비밀번호를 다시 입력해주세요"
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                border: `1.5px solid ${pw2 && pw !== pw2 ? '#EF4444' : '#E5E7EB'}`,
                fontSize: 15, fontWeight: 600,
                boxSizing: 'border-box', outline: 'none', marginBottom: 4, background: '#fff',
              }}
            />
            {pw2 && pw !== pw2 && (
              <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0' }}>비밀번호가 일치하지 않습니다</p>
            )}
            {pw && pw === pw2 && (
              <p style={{ fontSize: 12, color: '#15803D', margin: '4px 0 0' }}>✓ 비밀번호가 일치합니다</p>
            )}
            <div style={{ marginBottom: 32 }} />
            <button onClick={savePassword} style={{
              width: '100%', padding: '18px', borderRadius: 16, background: '#163272',
              color: '#fff', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
            }}>변경하기</button>
          </div>
        )}
      </div>
    </div>
  )
}
