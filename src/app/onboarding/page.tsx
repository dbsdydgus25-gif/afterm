'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

/* ─── 단계 표시바 ─── */
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i < current ? '#163272' : '#e8eaed',
          transition: 'background .3s',
        }} />
      ))}
    </div>
  )
}

/* ─── 공통 입력 스타일 ─── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '15px 16px',
  border: 'none', borderBottom: '2px solid #e0e0e0',
  fontSize: 16, outline: 'none', background: 'transparent',
  boxSizing: 'border-box', transition: 'border-color .2s',
}

/* ─── STEP 1: 휴대폰 인증 ─── */
function StepPhone({ onNext, kakaoToken }: { onNext: (phone: string) => void; kakaoToken: string | null }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [sendChannel, setSendChannel] = useState<'kakao' | 'sms'>('sms')

  useEffect(() => {
    if (timer <= 0) return
    const id = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timer])

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) { setError('올바른 휴대폰 번호를 입력해주세요'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          kakaoToken: kakaoToken || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSendChannel(data.channel || 'sms')
      setSent(true); setTimer(180)
    } catch {
      setError('인증번호 발송에 실패했습니다. 다시 시도해주세요.')
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (code.length < 4) { setError('인증번호를 입력해주세요'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ''), code }),
      })
      if (!res.ok) throw new Error()
      setVerified(true)
    } catch {
      setError('인증번호가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 8px', lineHeight: 1.35, wordBreak: 'keep-all' }}>
        휴대폰 번호를<br />인증해주세요
      </h1>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 36px' }}>
        카카오톡으로 인증번호를 보내드려요
      </p>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          disabled={verified}
          style={{ ...inputStyle, borderColor: verified ? '#163272' : '#e0e0e0', paddingRight: 90 }}
        />
        <button
          onClick={sendOtp}
          disabled={loading || verified || timer > 0}
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#163272', fontWeight: 700, fontSize: 14,
            opacity: verified || timer > 0 ? 0.4 : 1,
          }}
        >
          {timer > 0 ? `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}` : sent ? '재발송' : '인증요청'}
        </button>
      </div>

      {sent && !verified && (
        <p style={{ fontSize: 12, color: '#888', margin: '-8px 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {sendChannel === 'kakao'
            ? '💬 카카오톡으로 인증번호를 보냈어요'
            : '📱 문자(SMS)로 인증번호를 보냈어요'}
        </p>
      )}
      {sent && !verified && (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            type="number"
            placeholder="인증번호 6자리"
            value={code}
            onChange={e => setCode(e.target.value.slice(0, 6))}
            style={{ ...inputStyle, borderColor: '#e0e0e0', paddingRight: 70 }}
          />
          <button
            onClick={verifyOtp}
            disabled={loading}
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#163272', fontWeight: 700, fontSize: 14,
            }}
          >
            확인
          </button>
        </div>
      )}

      {verified && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 13, marginBottom: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          인증 완료
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '4px 0 0' }}>{error}</p>}

      <button
        onClick={() => verified && onNext(phone.replace(/\D/g, ''))}
        disabled={!verified}
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '18px 24px',
          background: verified ? '#163272' : '#e0e0e0',
          border: 'none', cursor: verified ? 'pointer' : 'default',
          fontSize: 16, fontWeight: 700,
          color: verified ? '#fff' : '#aaa',
          transition: 'background .2s',
        }}
      >
        다음
      </button>
    </div>
  )
}

/* ─── STEP 2: 비밀번호 설정 ─── */
function StepPassword({ onNext }: { onNext: (pw: string) => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [focus, setFocus] = useState<'pw' | 'pw2' | null>(null)

  const valid = pw.length >= 8
  const match = pw === pw2 && pw2.length > 0

  const handleNext = () => {
    if (!valid) { setError('비밀번호는 8자 이상이어야 합니다'); return }
    if (!match) { setError('비밀번호가 일치하지 않습니다'); return }
    onNext(pw)
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 8px', lineHeight: 1.35, wordBreak: 'keep-all' }}>
        비밀번호를<br />설정해주세요
      </h1>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 36px' }}>
        8자 이상, 영문·숫자 조합을 권장합니다
      </p>

      <div style={{ marginBottom: 20 }}>
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          onFocus={() => setFocus('pw')}
          onBlur={() => setFocus(null)}
          style={{ ...inputStyle, borderColor: focus === 'pw' ? '#163272' : '#e0e0e0' }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={pw2}
          onChange={e => { setPw2(e.target.value); setError('') }}
          onFocus={() => setFocus('pw2')}
          onBlur={() => setFocus(null)}
          style={{ ...inputStyle, borderColor: focus === 'pw2' ? '#163272' : match ? '#22c55e' : '#e0e0e0' }}
        />
        {pw2.length > 0 && (
          <p style={{ fontSize: 12, marginTop: 6, color: match ? '#22c55e' : '#ef4444' }}>
            {match ? '✓ 비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
          </p>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

      <button
        onClick={handleNext}
        disabled={!valid || !match}
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '18px 24px',
          background: valid && match ? '#163272' : '#e0e0e0',
          border: 'none', cursor: valid && match ? 'pointer' : 'default',
          fontSize: 16, fontWeight: 700,
          color: valid && match ? '#fff' : '#aaa',
          transition: 'background .2s',
        }}
      >
        완료
      </button>
    </div>
  )
}

/* ─── STEP 3: 완료 — 선택 ─── */
function StepDone({ next, userName }: { next: string; userName: string }) {
  const router = useRouter()

  return (
    <div style={{ textAlign: 'center', paddingTop: 20 }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 10px', wordBreak: 'keep-all' }}>
        {userName}님, 가입 완료!
      </h1>
      <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, margin: '0 0 48px' }}>
        에프텀에 오신 걸 환영합니다.<br />
        무엇을 하시겠어요?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => router.push(next)}
          style={{
            width: '100%', padding: '18px',
            background: '#163272', border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}
        >
          바로 신청하기 →
        </button>
        <button
          onClick={() => router.push('/home')}
          style={{
            width: '100%', padding: '18px',
            background: '#f5f5f5', border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 600, color: '#555', cursor: 'pointer',
          }}
        >
          홈으로 가기
        </button>
      </div>
    </div>
  )
}

/* ─── 메인 온보딩 ─── */
function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/home'
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [kakaoToken, setKakaoToken] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/'); return }
      // 카카오 provider_token 저장 (나에게 보내기 API용)
      if (session.provider_token) setKakaoToken(session.provider_token)
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '회원'
      setUserName(name.split(' ')[0])
    })
  }, [])

  const handlePhoneDone = (ph: string) => {
    setPhone(ph)
    setStep(2)
  }

  const handlePasswordDone = async (pw: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1) auth user_metadata 업데이트 (비밀번호 + 온보딩 완료 플래그)
    await supabase.auth.updateUser({
      password: pw,
      data: { phone, onboarding_done: true },
    })

    // 2) profiles 테이블에 전화번호 + 온보딩 완료 저장
    await supabase.from('profiles').upsert({
      id: user.id,
      phone,
      phone_verified: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    setLoading(false)
    setStep(3)
  }

  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#fff', padding: '0 0 80px',
    }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        {step > 1 && step < 3 && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
        )}
        <Image src="/logo-blue.png" alt="AFTERM" width={80} height={24} style={{ objectFit: 'contain', objectPosition: 'left' }} />
      </div>

      <div style={{ padding: '28px 24px 0' }}>
        {step < 3 && <StepBar current={step} total={2} />}

        {step === 1 && <StepPhone onNext={handlePhoneDone} kakaoToken={kakaoToken} />}
        {step === 2 && <StepPassword onNext={handlePasswordDone} />}
        {step === 3 && <StepDone next={next} userName={userName} />}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}
