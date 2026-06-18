'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Section = null | 'name' | 'phone' | 'password'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<Section>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // 이름
  const [nameInput, setNameInput] = useState('')

  // 휴대폰
  const [phoneInput, setPhoneInput] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [timer, setTimer] = useState(0)
  const [sending, setSending] = useState(false)

  // 비밀번호
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '')
      setPhone(user.user_metadata?.phone || user.phone || '')
      setEmail(user.email || '')
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
    setTimeout(() => setToast(null), 2200)
  }

  const openSection = (s: Section) => {
    setSection(s)
    setNameInput(name)
    setPhoneInput('')
    setOtpCode(''); setOtpSent(false); setOtpVerified(false); setTimer(0); setSending(false)
    setPw(''); setPw2('')
  }

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
    return p
  }

  const saveName = async () => {
    if (!nameInput.trim()) return showToast('이름을 입력해주세요', false)
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } })
    await supabase.from('profiles').update({ name: nameInput.trim() }).eq('id', user!.id)
    setSaving(false)
    setName(nameInput.trim())
    setSection(null)
    showToast('이름이 변경되었습니다')
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
    if (res.ok) { setOtpVerified(true); showToast('인증 완료!') }
    else { const { error } = await res.json(); showToast(error || '인증번호가 올바르지 않습니다', false) }
  }

  const savePhone = async () => {
    if (!otpVerified) return
    setSaving(true)
    const cleaned = phoneInput.replace(/\D/g, '')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ phone: cleaned }).eq('id', user!.id)
    await supabase.auth.updateUser({ data: { phone: cleaned } })
    setSaving(false)
    setPhone(cleaned)
    setSection(null)
    showToast('휴대폰 번호가 변경되었습니다')
  }

  const savePassword = async () => {
    if (pw.length < 6) return showToast('비밀번호는 6자 이상이어야 합니다', false)
    if (pw !== pw2) return showToast('비밀번호가 일치하지 않습니다', false)
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) return showToast('변경 실패: ' + error.message, false)
    setSection(null)
    showToast('비밀번호가 변경되었습니다')
  }

  const pwStrength = (p: string) => {
    if (!p) return null
    if (p.length < 6) return { label: '너무 짧음', color: '#EF4444', pct: '25%' }
    if (p.length < 9) return { label: '보통', color: '#F59E0B', pct: '55%' }
    if (p.length < 12) return { label: '강함', color: '#10B981', pct: '80%' }
    return { label: '매우 강함', color: '#059669', pct: '100%' }
  }
  const strength = pwStrength(pw)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6F9' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const Row = ({ label, value, badge, onClick }: { label: string; value?: string; badge?: React.ReactNode; onClick?: () => void }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
        cursor: onClick ? 'pointer' : 'default',
        background: '#fff', transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {badge}
        {value && <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{value}</span>}
        {onClick && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C9D4" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(22,50,114,0.08)!important;outline:none!important}
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok !== false ? '#111827' : '#EF4444',
          color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 24px',
          borderRadius: 99, zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)', animation: 'slideUp 0.2s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.ok !== false ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => section ? setSection(null) : router.back()} style={{ background: 'none', border: 'none', padding: '8px 8px 8px 0', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.01em' }}>
          {section === 'name' ? '이름 변경' : section === 'phone' ? '전화번호 인증' : section === 'password' ? '비밀번호 변경' : '계정 설정'}
        </h1>
      </div>

      {/* ─── 메인 목록 ─── */}
      {!section && (
        <div style={{ padding: '24px 20px' }}>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E8EAF0' }}>
            <Row
              label="이름 변경"
              value={name}
              onClick={() => openSection('name')}
            />
            <Row
              label="전화번호 인증"
              value={phone ? formatPhone(phone) : '미등록'}
              badge={phone ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EBF3FF', padding: '3px 8px', borderRadius: 99 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>인증완료</span>
                </div>
              ) : undefined}
              onClick={() => openSection('phone')}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #F3F4F6', background: '#fff',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>이메일 주소</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 3px' }}>{email}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#FEE500', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900 }}>K</span>
                  카카오로 로그인된 이메일입니다
                </p>
              </div>
            </div>
            <Row
              label="비밀번호 변경"
              onClick={() => openSection('password')}
            />
          </div>

          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            style={{ width: '100%', marginTop: 16, padding: '18px', background: '#fff', border: '1px solid #E8EAF0', borderRadius: 16, fontSize: 15, fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}
          >
            로그아웃
          </button>
        </div>
      )}

      {/* ─── 이름 변경 ─── */}
      {section === 'name' && (
        <div style={{ padding: '32px 20px' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.6 }}>
            변경된 이름은 에프텀 서비스 전체에 반영됩니다.
          </p>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>이름</label>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            placeholder="실명을 입력해주세요"
            autoFocus
            style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 16, fontWeight: 600, boxSizing: 'border-box', background: '#fff', color: '#111827', marginBottom: 32 }}
          />
          <button onClick={saveName} disabled={saving || !nameInput.trim()} style={{
            width: '100%', padding: '18px', borderRadius: 14, border: 'none',
            background: nameInput.trim() ? '#2563EB' : '#E5E7EB',
            color: nameInput.trim() ? '#fff' : '#9CA3AF',
            fontSize: 16, fontWeight: 800, cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saving ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> 저장 중...</> : '저장하기'}
          </button>
        </div>
      )}

      {/* ─── 전화번호 인증 ─── */}
      {section === 'phone' && (
        <div style={{ padding: '32px 20px' }}>
          {phone && !otpVerified && (
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>현재 번호</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{formatPhone(phone)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EBF3FF', padding: '5px 10px', borderRadius: 99 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>인증완료</span>
              </div>
            </div>
          )}

          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>새 전화번호</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              placeholder="010-0000-0000"
              type="tel"
              disabled={otpVerified}
              style={{
                flex: 1, padding: '16px 18px', borderRadius: 12,
                border: `1.5px solid ${otpVerified ? '#10B981' : '#E5E7EB'}`,
                fontSize: 16, fontWeight: 600, boxSizing: 'border-box',
                background: otpVerified ? '#F0FDF4' : '#fff',
                color: otpVerified ? '#059669' : '#111827',
              }}
            />
            <button onClick={sendOtp} disabled={sending || otpVerified || timer > 0} style={{
              padding: '16px 16px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13,
              background: otpVerified ? '#D1FAE5' : (sending || timer > 0) ? '#F3F4F6' : '#2563EB',
              color: otpVerified ? '#059669' : (sending || timer > 0) ? '#9CA3AF' : '#fff',
              cursor: (otpVerified || timer > 0) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', minWidth: 88,
            }}>
              {otpVerified ? '✓ 완료' : sending ? '발송 중' : timer > 0 ? `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}` : otpSent ? '재발송' : '인증 요청'}
            </button>
          </div>

          {otpSent && !otpVerified && (
            <div style={{ animation: 'slideUp 0.2s ease' }}>
              <div style={{ background: '#EBF3FF', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>💬</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', margin: '0 0 1px' }}>인증번호를 발송했습니다</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>카카오톡 또는 문자로 6자리를 확인해주세요</p>
                </div>
              </div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>인증번호 6자리</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <input
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  onKeyDown={e => e.key === 'Enter' && otpCode.length >= 4 && verifyOtp()}
                  placeholder="· · · · · ·"
                  type="tel"
                  style={{
                    flex: 1, padding: '16px', borderRadius: 12, border: '1.5px solid #E5E7EB',
                    fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: 10,
                    boxSizing: 'border-box', background: '#fff', color: '#111827',
                  }}
                />
                <button onClick={verifyOtp} disabled={otpCode.length < 4} style={{
                  padding: '16px 20px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14,
                  background: otpCode.length >= 4 ? '#2563EB' : '#E5E7EB',
                  color: otpCode.length >= 4 ? '#fff' : '#9CA3AF',
                  cursor: otpCode.length >= 4 ? 'pointer' : 'not-allowed',
                }}>확인</button>
              </div>
            </div>
          )}

          {!otpSent && <div style={{ marginBottom: 28 }} />}

          <button onClick={savePhone} disabled={!otpVerified || saving} style={{
            width: '100%', padding: '18px', borderRadius: 14, border: 'none',
            background: otpVerified ? '#2563EB' : '#E5E7EB',
            color: otpVerified ? '#fff' : '#9CA3AF',
            fontSize: 16, fontWeight: 800, cursor: otpVerified ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saving ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> 저장 중...</> : otpVerified ? '번호 변경하기' : '인증 후 변경 가능'}
          </button>
        </div>
      )}

      {/* ─── 비밀번호 변경 ─── */}
      {section === 'password' && (
        <div style={{ padding: '32px 20px' }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px', marginBottom: 28, display: 'flex', gap: 10 }}>
            <span>⚠️</span>
            <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.6 }}>영문·숫자·특수문자 조합, 8자 이상을 권장합니다</p>
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>새 비밀번호</label>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="6자 이상"
              autoFocus
              style={{ width: '100%', padding: '16px 52px 16px 18px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
            />
            <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
              {showPw ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          {strength && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ height: 3, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: strength.pct, background: strength.color, borderRadius: 99, transition: 'all 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: strength.color }}>{strength.label}</span>
            </div>
          )}
          {!strength && <div style={{ marginBottom: 20 }} />}

          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>비밀번호 확인</label>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <input
              type={showPw2 ? 'text' : 'password'}
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              placeholder="비밀번호 재입력"
              style={{
                width: '100%', padding: '16px 52px 16px 18px', borderRadius: 12,
                border: `1.5px solid ${pw2 && pw !== pw2 ? '#EF4444' : pw2 && pw === pw2 ? '#10B981' : '#E5E7EB'}`,
                fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
                background: pw2 && pw === pw2 ? '#F0FDF4' : '#fff', color: '#111827',
              }}
            />
            <button onClick={() => setShowPw2(v => !v)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
              {showPw2 ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          {pw2 && pw !== pw2 && <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, margin: '0 0 24px' }}>✕ 비밀번호가 일치하지 않습니다</p>}
          {pw2 && pw === pw2 && pw.length >= 6 && <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600, margin: '0 0 24px' }}>✓ 비밀번호가 일치합니다</p>}
          {(!pw2 || pw.length < 6) && <div style={{ marginBottom: 24 }} />}

          <button onClick={savePassword} disabled={saving || pw.length < 6 || pw !== pw2} style={{
            width: '100%', padding: '18px', borderRadius: 14, border: 'none',
            background: pw.length >= 6 && pw === pw2 ? '#2563EB' : '#E5E7EB',
            color: pw.length >= 6 && pw === pw2 ? '#fff' : '#9CA3AF',
            fontSize: 16, fontWeight: 800,
            cursor: pw.length >= 6 && pw === pw2 ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saving ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> 변경 중...</> : '비밀번호 변경하기'}
          </button>
        </div>
      )}
    </div>
  )
}
