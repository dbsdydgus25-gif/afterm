'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type EditType = 'name' | 'phone' | 'password' | null

export default function ProfileEditClient({
  initialName, initialPhone, initialEmail,
}: {
  initialName: string; initialPhone: string; initialEmail: string;
}) {
  const supabase = createClient()
  const [editing, setEditing] = useState<EditType>(null)
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone === '전화번호 미등록' ? '' : initialPhone)
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null)

  // 이름 편집 상태
  const [nameInput, setNameInput] = useState(name)

  // 휴대폰 편집 상태
  const [phoneInput, setPhoneInput] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [timer, setTimer] = useState(0)
  const [sending, setSending] = useState(false)

  // 비밀번호 편집 상태
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  // 타이머
  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const openEdit = (type: EditType) => {
    setEditing(type)
    setNameInput(name)
    setPhoneInput('')
    setOtpCode('')
    setOtpSent(false)
    setOtpVerified(false)
    setTimer(0)
    setSending(false)
    setPw(''); setPw2('')
  }

  // ─── 이름 저장 ───
  const saveName = async () => {
    if (!nameInput.trim()) return showToast('이름을 입력해주세요', false)
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } })
    if (error) return showToast('저장 실패: ' + error.message, false)
    // profiles 테이블도 업데이트
    await supabase.from('profiles').update({ name: nameInput.trim() }).eq('id', (await supabase.auth.getUser()).data.user!.id)
    setName(nameInput.trim())
    setEditing(null)
    showToast('이름이 변경되었습니다')
  }

  // ─── OTP 발송 ───
  const sendOtp = async () => {
    const cleaned = phoneInput.replace(/\D/g, '')
    if (cleaned.length < 10) return showToast('올바른 휴대폰 번호를 입력해주세요', false)
    setSending(true)
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    })
    setSending(false)
    if (res.ok) {
      setOtpSent(true)
      setTimer(180)
      showToast('인증번호를 발송했습니다')
    } else {
      showToast('발송 실패, 다시 시도해주세요', false)
    }
  }

  // ─── OTP 확인 ───
  const verifyOtp = async () => {
    const cleaned = phoneInput.replace(/\D/g, '')
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, code: otpCode }),
    })
    if (res.ok) {
      setOtpVerified(true)
      showToast('인증 완료!')
    } else {
      const { error } = await res.json()
      showToast(error || '인증번호가 올바르지 않습니다', false)
    }
  }

  // ─── 휴대폰 저장 ───
  const savePhone = async () => {
    if (!otpVerified) return showToast('먼저 인증을 완료해주세요', false)
    const cleaned = phoneInput.replace(/\D/g, '')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ phone: cleaned }).eq('id', user!.id)
    await supabase.auth.updateUser({ data: { phone: cleaned } })
    setPhone(cleaned)
    setEditing(null)
    showToast('휴대폰 번호가 변경되었습니다')
  }

  // ─── 비밀번호 저장 ───
  const savePassword = async () => {
    if (pw.length < 6) return showToast('비밀번호는 6자 이상이어야 합니다', false)
    if (pw !== pw2) return showToast('비밀번호가 일치하지 않습니다', false)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return showToast('변경 실패: ' + error.message, false)
    setEditing(null)
    showToast('비밀번호가 변경되었습니다')
  }

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
    return p
  }

  const displayPhone = phone ? formatPhone(phone) : '전화번호 미등록'

  return (
    <>
      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok !== false ? 'rgba(22,50,114,0.9)' : 'rgba(239,68,68,0.9)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '10px 20px', borderRadius: 99, zIndex: 600, whiteSpace: 'nowrap',
        }}>{toast.msg}</div>
      )}

      {/* 프로필 카드 */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E8EAF0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)', marginBottom: 32, overflow: 'hidden',
      }}>
        {/* 이름 */}
        <div onClick={() => openEdit('name')} style={{
          padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EBF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              👤
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>이름</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{name}</p>
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#163272', fontWeight: 700, background: '#EBF3FF', padding: '4px 10px', borderRadius: 99 }}>변경</span>
        </div>

        {/* 휴대폰 */}
        <div onClick={() => openEdit('phone')} style={{
          padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              📱
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>휴대폰</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{displayPhone}</p>
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#15803D', fontWeight: 700, background: '#F0FDF4', padding: '4px 10px', borderRadius: 99 }}>변경·인증</span>
        </div>

        {/* 이메일 (수정 불가) */}
        <div style={{
          padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #F3F4F6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              ✉️
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>이메일</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#6B7280', margin: 0 }}>{initialEmail}</p>
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#D1D5DB', fontWeight: 600 }}>변경불가</span>
        </div>

        {/* 비밀번호 */}
        <div onClick={() => openEdit('password')} style={{
          padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🔑
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600 }}>비밀번호</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>••••••••</p>
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#C2410C', fontWeight: 700, background: '#FFF7ED', padding: '4px 10px', borderRadius: 99 }}>변경</span>
        </div>
      </div>

      {/* ─── 바텀시트 모달 ─── */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setEditing(null)}>
          <div style={{
            background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
            width: '100%', maxWidth: 480,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 99, margin: '0 auto 20px' }} />

            {/* ── 이름 편집 ── */}
            {editing === 'name' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 20px' }}>이름 변경</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>새 이름</p>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="실명을 입력해주세요"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none', marginBottom: 20,
                }}
              />
              <button onClick={saveName} style={{
                width: '100%', padding: '16px', borderRadius: 14, background: '#163272',
                color: '#fff', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
              }}>저장</button>
            </>)}

            {/* ── 휴대폰 편집 ── */}
            {editing === 'phone' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>휴대폰 번호 변경</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>새 번호로 인증 후 변경됩니다</p>

              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>새 휴대폰 번호</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="010-0000-0000"
                  type="tel"
                  disabled={otpVerified}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 14,
                    border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                    boxSizing: 'border-box', outline: 'none',
                    background: otpVerified ? '#F9FAFB' : '#fff',
                  }}
                />
                <button onClick={sendOtp} disabled={sending || otpVerified || (timer > 0 && otpSent)} style={{
                  padding: '14px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: otpVerified ? '#D1FAE5' : '#163272', color: otpVerified ? '#15803D' : '#fff',
                  fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {otpVerified ? '✓ 완료' : sending ? '발송 중...' : timer > 0 ? `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}` : otpSent ? '재발송' : '인증요청'}
                </button>
              </div>

              {otpSent && !otpVerified && (<>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>인증번호 6자리</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="인증번호 입력"
                    type="tel"
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: 14,
                      border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                  <button onClick={verifyOtp} style={{
                    padding: '14px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: '#163272', color: '#fff', fontSize: 13, fontWeight: 700,
                  }}>확인</button>
                </div>
              </>)}

              {!otpSent && <div style={{ marginBottom: 20 }} />}

              <button onClick={savePhone} disabled={!otpVerified} style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: otpVerified ? '#163272' : '#E5E7EB',
                color: otpVerified ? '#fff' : '#9CA3AF',
                fontSize: 16, fontWeight: 800, border: 'none', cursor: otpVerified ? 'pointer' : 'not-allowed',
              }}>
                {otpVerified ? '변경 완료' : '인증 후 변경 가능'}
              </button>
            </>)}

            {/* ── 비밀번호 편집 ── */}
            {editing === 'password' && (<>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>비밀번호 변경</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>새 비밀번호를 입력해주세요 (6자 이상)</p>

              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>새 비밀번호</p>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none', marginBottom: 12,
                }}
              />
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px', fontWeight: 600 }}>비밀번호 확인</p>
              <input
                type="password"
                value={pw2}
                onChange={e => setPw2(e.target.value)}
                placeholder="비밀번호 재입력"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: `1.5px solid ${pw2 && pw !== pw2 ? '#EF4444' : '#E5E7EB'}`,
                  fontSize: 15, fontWeight: 600,
                  boxSizing: 'border-box', outline: 'none', marginBottom: 4,
                }}
              />
              {pw2 && pw !== pw2 && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 16px' }}>비밀번호가 일치하지 않습니다</p>
              )}
              <div style={{ marginBottom: 20 }} />
              <button onClick={savePassword} style={{
                width: '100%', padding: '16px', borderRadius: 14, background: '#163272',
                color: '#fff', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
              }}>변경하기</button>
            </>)}
          </div>
        </div>
      )}
    </>
  )
}
