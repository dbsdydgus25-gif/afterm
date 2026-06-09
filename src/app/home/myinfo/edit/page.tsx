'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'name' | 'phone' | 'password'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('name')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [timer, setTimer] = useState(0)
  const [sending, setSending] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      const n = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
      const p = user.user_metadata?.phone || user.phone || ''
      setName(n); setNameInput(n)
      setPhone(p)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  useEffect(() => {
    if (tab === 'name') setTimeout(() => nameRef.current?.focus(), 200)
    if (tab === 'phone') setTimeout(() => phoneRef.current?.focus(), 200)
    setOtpSent(false); setOtpVerified(false); setOtpCode(''); setTimer(0)
    setPw(''); setPw2('')
  }, [tab])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
    return d
  }

  const saveName = async () => {
    if (!nameInput.trim()) return showToast('이름을 입력해주세요', false)
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } })
    await supabase.from('profiles').update({ name: nameInput.trim() }).eq('id', user!.id)
    setSaving(false)
    setName(nameInput.trim())
    showToast('이름이 변경되었습니다')
    setTimeout(() => router.back(), 1200)
  }

  const sendOtp = async () => {
    const cleaned = phoneInput.replace(/\D/g, '')
    if (cleaned.length < 10) return showToast('올바른 번호를 입력해주세요', false)
    setSending(true)
    const res = await fetch('/api/otp/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    })
    setSending(false)
    if (res.ok) { setOtpSent(true); setTimer(180) }
    else showToast('발송 실패. 다시 시도해주세요', false)
  }

  const verifyOtp = async () => {
    const cleaned = phoneInput.replace(/\D/g, '')
    const res = await fetch('/api/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, code: otpCode }),
    })
    if (res.ok) { setOtpVerified(true); showToast('인증이 완료되었습니다') }
    else {
      const { error } = await res.json()
      showToast(error || '인증번호가 올바르지 않습니다', false)
    }
  }

  const savePhone = async () => {
    if (!otpVerified) return
    setSaving(true)
    const cleaned = phoneInput.replace(/\D/g, '')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ phone: cleaned }).eq('id', user!.id)
    await supabase.auth.updateUser({ data: { phone: cleaned } })
    setSaving(false)
    showToast('휴대폰 번호가 변경되었습니다')
    setTimeout(() => router.back(), 1200)
  }

  const savePassword = async () => {
    if (pw.length < 6) return showToast('비밀번호는 6자 이상이어야 합니다', false)
    if (pw !== pw2) return showToast('비밀번호가 일치하지 않습니다', false)
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) return showToast('변경 실패: ' + error.message, false)
    showToast('비밀번호가 변경되었습니다')
    setTimeout(() => router.back(), 1200)
  }

  const pwStrength = (p: string) => {
    if (p.length === 0) return null
    if (p.length < 6) return { label: '너무 짧음', color: '#EF4444', width: '25%' }
    if (p.length < 8) return { label: '보통', color: '#F59E0B', width: '50%' }
    if (p.length < 12) return { label: '강함', color: '#10B981', width: '75%' }
    return { label: '매우 강함', color: '#059669', width: '100%' }
  }
  const strength = pwStrength(pw)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Pretendard' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#163272', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'name', label: '이름', icon: '👤' },
    { key: 'phone', label: '휴대폰', icon: '📱' },
    { key: 'password', label: '비밀번호', icon: '🔑' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        input:focus { border-color: #163272 !important; box-shadow: 0 0 0 3px rgba(22,50,114,0.08) !important; }
      `}</style>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok !== false ? '#111827' : '#EF4444',
          color: '#fff', fontSize: 14, fontWeight: 600,
          padding: '13px 24px', borderRadius: 99, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          animation: 'slideUp 0.25s ease',
        }}>
          <span>{toast.ok !== false ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div style={{
        background: '#fff', padding: '0 20px',
        borderBottom: '1px solid #F0F0F0',
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', height: 56,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', padding: '8px 8px 8px 0',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 0 8px', letterSpacing: '-0.01em' }}>정보 수정</h1>
      </div>

      {/* 탭 */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '16px 0 14px', border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            borderBottom: tab === t.key ? '2.5px solid #163272' : '2.5px solid transparent',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 13, fontWeight: tab === t.key ? 800 : 500, color: tab === t.key ? '#163272' : '#9CA3AF' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ padding: '32px 20px 40px', animation: 'fadeIn 0.2s ease' }} key={tab}>

        {/* ─────────── 이름 탭 ─────────── */}
        {tab === 'name' && (
          <>
            {/* 현재 이름 뱃지 */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '20px',
              border: '1px solid #E8EAF0', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#163272', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {name.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 3px', fontWeight: 600, letterSpacing: 0.3 }}>현재 이름</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>{name}</p>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              새 이름 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              ref={nameRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              placeholder="실명을 입력해주세요"
              style={{
                width: '100%', padding: '16px 18px', borderRadius: 14,
                border: '1.5px solid #E5E7EB', fontSize: 16, fontWeight: 600,
                boxSizing: 'border-box', outline: 'none', background: '#fff',
                color: '#111827', transition: 'border-color 0.15s',
                marginBottom: 8,
              }}
            />
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 32px' }}>변경 후 어드민에도 즉시 반영됩니다</p>

            <button onClick={saveName} disabled={saving || !nameInput.trim() || nameInput === name} style={{
              width: '100%', padding: '18px', borderRadius: 16,
              background: nameInput.trim() && nameInput !== name ? '#163272' : '#E5E7EB',
              color: nameInput.trim() && nameInput !== name ? '#fff' : '#9CA3AF',
              fontSize: 16, fontWeight: 800, border: 'none',
              cursor: nameInput.trim() && nameInput !== name ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}>
              {saving ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> 저장 중...</> : '저장하기'}
            </button>
          </>
        )}

        {/* ─────────── 휴대폰 탭 ─────────── */}
        {tab === 'phone' && (
          <>
            {/* 현재 번호 */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '18px 20px',
              border: '1px solid #E8EAF0', marginBottom: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 3px', fontWeight: 600 }}>현재 번호</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{phone ? formatPhone(phone) : '미등록'}</p>
              </div>
              {phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EBF3FF', padding: '5px 10px', borderRadius: 99 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#163272" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#163272' }}>인증완료</span>
                </div>
              )}
            </div>

            {/* 단계 표시 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              {['번호 입력', '인증번호 확인', '변경 완료'].map((s, i) => {
                const done = (i === 0 && otpSent) || (i === 1 && otpVerified) || (i === 2 && otpVerified)
                const active = (i === 0 && !otpSent) || (i === 1 && otpSent && !otpVerified) || (i === 2 && otpVerified)
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < 2 ? 1 : 'initial' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: done ? '#163272' : active ? '#163272' : '#E5E7EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {done ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 800, color: active ? '#fff' : '#9CA3AF' }}>{i + 1}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: active || done ? 700 : 400, color: active || done ? '#163272' : '#9CA3AF', whiteSpace: 'nowrap' }}>{s}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1, background: done ? '#163272' : '#E5E7EB', minWidth: 12 }} />}
                  </div>
                )
              })}
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>새 휴대폰 번호</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: otpSent ? 20 : 32 }}>
              <input
                ref={phoneRef}
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="010-0000-0000"
                type="tel"
                disabled={otpVerified}
                style={{
                  flex: 1, padding: '16px 18px', borderRadius: 14,
                  border: `1.5px solid ${otpVerified ? '#10B981' : '#E5E7EB'}`,
                  fontSize: 16, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none',
                  background: otpVerified ? '#F0FDF4' : '#fff',
                  color: otpVerified ? '#059669' : '#111827',
                  transition: 'all 0.15s',
                }}
              />
              <button onClick={sendOtp} disabled={sending || otpVerified || (timer > 0)} style={{
                padding: '16px 18px', borderRadius: 14, border: 'none',
                background: otpVerified ? '#D1FAE5' : (sending || timer > 0) ? '#F3F4F6' : '#163272',
                color: otpVerified ? '#059669' : (sending || timer > 0) ? '#6B7280' : '#fff',
                fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', cursor: (otpVerified || timer > 0) ? 'not-allowed' : 'pointer',
                minWidth: 86, transition: 'all 0.15s',
              }}>
                {otpVerified ? '✓ 완료' : sending ? '발송 중' : timer > 0 ? `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}` : otpSent ? '재발송' : '인증 요청'}
              </button>
            </div>

            {otpSent && !otpVerified && (
              <div style={{ animation: 'slideUp 0.2s ease' }}>
                <div style={{ background: '#EBF3FF', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>💬</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#163272', margin: '0 0 1px' }}>인증번호를 발송했습니다</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>카카오톡 또는 문자로 6자리 번호를 확인해주세요</p>
                  </div>
                </div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>인증번호 6자리</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                  <input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && otpCode.length === 6 && verifyOtp()}
                    placeholder="- - - - - -"
                    type="tel"
                    style={{
                      flex: 1, padding: '16px 18px', borderRadius: 14,
                      border: '1.5px solid #E5E7EB', fontSize: 22, fontWeight: 800,
                      boxSizing: 'border-box', outline: 'none', letterSpacing: 8,
                      textAlign: 'center', background: '#fff', color: '#111827',
                    }}
                  />
                  <button onClick={verifyOtp} disabled={otpCode.length < 4} style={{
                    padding: '16px 20px', borderRadius: 14, border: 'none',
                    background: otpCode.length >= 4 ? '#163272' : '#E5E7EB',
                    color: otpCode.length >= 4 ? '#fff' : '#9CA3AF',
                    fontSize: 14, fontWeight: 800, cursor: otpCode.length >= 4 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}>확인</button>
                </div>
              </div>
            )}

            {!otpSent && <div style={{ marginBottom: 0 }} />}

            <button onClick={savePhone} disabled={!otpVerified || saving} style={{
              width: '100%', padding: '18px', borderRadius: 16, border: 'none',
              background: otpVerified ? '#163272' : '#E5E7EB',
              color: otpVerified ? '#fff' : '#9CA3AF',
              fontSize: 16, fontWeight: 800, cursor: otpVerified ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}>
              {saving ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> 저장 중...</> : otpVerified ? '번호 변경하기' : '인증 후 변경 가능'}
            </button>
          </>
        )}

        {/* ─────────── 비밀번호 탭 ─────────── */}
        {tab === 'password' && (
          <>
            <div style={{ background: '#FFF7ED', borderRadius: 14, padding: '14px 16px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                보안을 위해 타인이 추측하기 어려운 비밀번호를 사용하세요.<br />
                영문, 숫자, 특수문자를 조합하면 더욱 안전합니다.
              </p>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              새 비밀번호 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="6자 이상 입력해주세요"
                style={{
                  width: '100%', padding: '16px 52px 16px 18px', borderRadius: 14,
                  border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none', background: '#fff',
                  color: '#111827', transition: 'border-color 0.15s',
                }}
              />
              <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}>
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {/* 비밀번호 강도 */}
            {pw && strength && (
              <div style={{ marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 99, transition: 'all 0.3s ease' }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: strength.color, margin: 0 }}>보안 강도: {strength.label}</p>
              </div>
            )}
            {!pw && <div style={{ marginBottom: 20 }} />}

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              비밀번호 확인 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <input
                type={showPw2 ? 'text' : 'password'}
                value={pw2}
                onChange={e => setPw2(e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                style={{
                  width: '100%', padding: '16px 52px 16px 18px', borderRadius: 14,
                  border: `1.5px solid ${pw2 && pw !== pw2 ? '#EF4444' : pw2 && pw === pw2 ? '#10B981' : '#E5E7EB'}`,
                  fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none', background: pw2 && pw === pw2 ? '#F0FDF4' : '#fff',
                  color: '#111827', transition: 'all 0.15s',
                }}
              />
              <button onClick={() => setShowPw2(v => !v)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}>
                {showPw2
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {pw2 && pw !== pw2 && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 24px', fontWeight: 600 }}>✕ 비밀번호가 일치하지 않습니다</p>}
            {pw2 && pw === pw2 && pw.length >= 6 && <p style={{ fontSize: 12, color: '#10B981', margin: '0 0 24px', fontWeight: 600 }}>✓ 비밀번호가 일치합니다</p>}
            {(!pw2 || (pw2 && pw === pw2 && pw.length < 6)) && <div style={{ marginBottom: 24 }} />}

            <button onClick={savePassword} disabled={saving || pw.length < 6 || pw !== pw2} style={{
              width: '100%', padding: '18px', borderRadius: 16, border: 'none',
              background: pw.length >= 6 && pw === pw2 ? '#163272' : '#E5E7EB',
              color: pw.length >= 6 && pw === pw2 ? '#fff' : '#9CA3AF',
              fontSize: 16, fontWeight: 800,
              cursor: pw.length >= 6 && pw === pw2 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}>
              {saving ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> 변경 중...</> : '비밀번호 변경하기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
