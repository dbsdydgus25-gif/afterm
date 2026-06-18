'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

// ── 약관 동의 ──────────────────────────────────────────────
function TermsScreen({ onAgree }: { onAgree: () => void }) {
  const TERMS = [
    { key: 'service', label: '이용약관 동의', required: true, href: '/terms' },
    { key: 'privacy', label: '개인정보 처리방침 동의', required: true, href: '/privacy' },
    { key: 'delegate', label: '디지털 계정 해지 대행 위임 동의', required: true, href: null },
    { key: 'age', label: '만 19세 이상입니다', required: true, href: null },
  ]
  const [agreed, setAgreed] = useState<Record<string, boolean>>({})
  const allRequired = TERMS.every(t => agreed[t.key])
  const toggleAll = () => {
    if (allRequired) setAgreed({})
    else { const all: Record<string, boolean> = {}; TERMS.forEach(t => { all[t.key] = true }); setAgreed(all) }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff' }}>
      <div style={{ flex: 1, padding: '40px 24px 120px' }}>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6, fontWeight: 600 }}>시작하기 전에</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 32, lineHeight: 1.3, letterSpacing: '-0.03em' }}>
          약관에 동의해 주세요
        </h2>
        <button onClick={toggleAll} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          background: allRequired ? '#2563EB' : '#F4F6F9',
          border: `1.5px solid ${allRequired ? '#2563EB' : '#E8EAF0'}`,
          borderRadius: 14, padding: '18px 20px', cursor: 'pointer', marginBottom: 12,
          fontFamily: 'inherit',
        }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, border: `2px solid ${allRequired ? '#fff' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {allRequired && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: allRequired ? '#fff' : '#111827' }}>전체 동의</div>
            <div style={{ fontSize: 12, color: allRequired ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginTop: 2 }}>서비스 이용을 위한 필수 항목에 모두 동의합니다</div>
          </div>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TERMS.map(term => (
            <div key={term.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', borderBottom: '1px solid #F3F4F6' }}>
              <button onClick={() => setAgreed(prev => ({ ...prev, [term.key]: !prev[term.key] }))} style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${agreed[term.key] ? '#2563EB' : '#CBD5E1'}`,
                background: agreed[term.key] ? '#2563EB' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
              }}>
                {agreed[term.key] && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <span style={{ flex: 1, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>(필수) </span>{term.label}
              </span>
              {term.href && <a href={term.href} target="_blank" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', flexShrink: 0 }}>보기 →</a>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E8EAF0', fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
          수집된 서류는 디지털 계정 해지 대행 목적으로만 사용되며,<br />업무 완료 후 30일 이내 파기됩니다.
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50 }}>
        <button disabled={!allRequired} onClick={onAgree} style={{
          width: '100%', padding: '17px', borderRadius: 14,
          background: allRequired ? '#2563EB' : '#E5E9EF',
          color: allRequired ? '#fff' : '#9CA3AF',
          fontSize: 16, fontWeight: 800, border: 'none',
          cursor: allRequired ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', letterSpacing: '-0.02em',
        }}>동의하고 시작하기</button>
      </div>
    </div>
  )
}

// ── 날짜 3칸 입력 ──────────────────────────────────────────
function DateFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [y, m, d] = parts
  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef = useRef<HTMLInputElement>(null)
  const update = (year: string, month: string, day: string) => {
    if (year && month && day) onChange(`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`)
    else onChange('')
  }
  const inputStyle = {
    padding: '16px 12px', fontSize: 22, fontWeight: 700, color: '#111827',
    border: 'none', borderBottom: '2px solid #E5E9EF', background: 'transparent',
    textAlign: 'center' as const, outline: 'none', fontFamily: 'inherit',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="text" inputMode="numeric" placeholder="YYYY" value={y} maxLength={4}
        onChange={e => { const v = e.target.value.replace(/\D/g, ''); update(v, m, d); if (v.length === 4) monthRef.current?.focus() }}
        style={{ ...inputStyle, width: 80 }} autoFocus />
      <span style={{ color: '#9CA3AF', fontSize: 18 }}>년</span>
      <input ref={monthRef} type="text" inputMode="numeric" placeholder="MM" value={m} maxLength={2}
        onChange={e => { const v = e.target.value.replace(/\D/g, ''); update(y, v, d); if (v.length === 2) dayRef.current?.focus() }}
        style={{ ...inputStyle, width: 56 }} />
      <span style={{ color: '#9CA3AF', fontSize: 18 }}>월</span>
      <input ref={dayRef} type="text" inputMode="numeric" placeholder="DD" value={d} maxLength={2}
        onChange={e => { const v = e.target.value.replace(/\D/g, ''); update(y, m, v) }}
        style={{ ...inputStyle, width: 56 }} />
      <span style={{ color: '#9CA3AF', fontSize: 18 }}>일</span>
    </div>
  )
}

// ── 메인 폼 ────────────────────────────────────────────────
type Screen = 'terms' | 'name' | 'birth' | 'death' | 'phone' | 'applicant'

function ApplyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { deceasedInfo, setDeceasedInfo, setCaseId, setStep, setDelegation, resetStore } = useApplyStore()
  const supabase = createClient()

  const [screen, setScreen] = useState<Screen>('terms')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [applicantRelation, setApplicantRelation] = useState('')

  useEffect(() => {
    const { caseId } = useApplyStore.getState()
    if (searchParams.get('reset') === 'true') { resetStore(); return }
    if (caseId) {
      supabase.from('cases').select('status').eq('id', caseId).single()
        .then(({ data }) => { if (!data || data.status !== 'draft') resetStore() })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const goBack = () => {
    setError('')
    const prev: Record<Screen, Screen> = {
      terms: 'terms', name: 'terms', birth: 'name', death: 'birth', phone: 'death', applicant: 'phone',
    }
    setScreen(prev[screen])
  }

  const phoneFormat = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
  }

  const handleNext = async () => {
    setError('')
    if (screen === 'name') {
      if (!deceasedInfo.name.trim()) { setError('고인의 성함을 입력해 주세요'); return }
      setScreen('birth')
    } else if (screen === 'birth') {
      if (!deceasedInfo.birthDate) { setError('생년월일을 입력해 주세요'); return }
      setScreen('death')
    } else if (screen === 'death') {
      if (!deceasedInfo.deathDate) { setError('사망일을 입력해 주세요'); return }
      setScreen('phone')
    } else if (screen === 'phone') {
      setScreen('applicant')
    } else if (screen === 'applicant') {
      if (!applicantName.trim()) { setError('신청인 성함을 입력해 주세요'); return }
      if (!applicantRelation.trim()) { setError('고인과의 관계를 입력해 주세요'); return }
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const existingCaseId = useApplyStore.getState().caseId
        if (existingCaseId) {
          await supabase.from('cases').update({
            deceased_name: deceasedInfo.name,
            deceased_birth: deceasedInfo.birthDate,
            deceased_death: deceasedInfo.deathDate,
            deceased_phone: deceasedInfo.phone || null,
            delegator_name: applicantName,
            delegator_relation: applicantRelation,
          }).eq('id', existingCaseId)
        } else {
          const { data, error: err } = await supabase.from('cases').insert({
            user_id: user.id,
            deceased_name: deceasedInfo.name,
            deceased_birth: deceasedInfo.birthDate,
            deceased_death: deceasedInfo.deathDate,
            deceased_phone: deceasedInfo.phone || null,
            delegator_name: applicantName,
            delegator_relation: applicantRelation,
            status: 'draft',
          }).select('id').single()
          if (err) throw err
          setCaseId(data.id)
        }
        setDelegation({ delegatorName: applicantName, delegatorRelation: applicantRelation, signatureData: '' })
        setStep(1)
        router.push('/apply/services')
      } catch {
        setError('저장 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }
  }

  if (screen === 'terms') return <TermsScreen onAgree={() => setScreen('name')} />

  const SCREEN_META: Record<Exclude<Screen, 'terms'>, { question: string; sub: string }> = {
    name:      { question: '고인의 성함을\n알려주세요',             sub: '기업 CS 접수에 사용됩니다' },
    birth:     { question: '고인의 생년월일은\n언제인가요?',        sub: '계정 조회 및 서류 작성에 사용됩니다' },
    death:     { question: '사망일은\n언제인가요?',                 sub: '사망진단서의 사망일과 일치해야 합니다' },
    phone:     { question: '고인의 휴대폰 번호를\n알고 계신가요?', sub: '카카오톡 계정 확인에 필요해요 (선택)' },
    applicant: { question: '신청인 정보를\n알려주세요',             sub: '대행 위임장 작성에 사용됩니다' },
  }
  const meta = SCREEN_META[screen as Exclude<Screen, 'terms'>]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff' }}>
      <div style={{ flex: 1, padding: '40px 24px 120px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.03em', whiteSpace: 'pre-line' }}>
          {meta.question}
        </h2>
        <p style={{ fontSize: 15, color: '#9CA3AF', marginBottom: 40 }}>{meta.sub}</p>

        {screen === 'name' && (
          <input type="text" placeholder="예: 홍길동"
            value={deceasedInfo.name}
            onChange={e => { setError(''); setDeceasedInfo({ name: e.target.value }) }}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleNext()}
            style={{ width: '100%', fontSize: 28, fontWeight: 700, color: '#111827', border: 'none', borderBottom: '2px solid #E5E9EF', background: 'transparent', outline: 'none', padding: '8px 0', fontFamily: 'inherit' }}
          />
        )}
        {(screen === 'birth' || screen === 'death') && (
          <DateFields
            value={screen === 'birth' ? deceasedInfo.birthDate : deceasedInfo.deathDate}
            onChange={v => { setError(''); screen === 'birth' ? setDeceasedInfo({ birthDate: v }) : setDeceasedInfo({ deathDate: v }) }}
          />
        )}
        {screen === 'phone' && (
          <input type="tel" inputMode="tel" placeholder="010-0000-0000"
            value={deceasedInfo.phone}
            onChange={e => { setError(''); setDeceasedInfo({ phone: phoneFormat(e.target.value) }) }}
            autoFocus onKeyDown={e => e.key === 'Enter' && handleNext()}
            style={{ width: '100%', fontSize: 28, fontWeight: 700, color: '#111827', border: 'none', borderBottom: '2px solid #E5E9EF', background: 'transparent', outline: 'none', padding: '8px 0', fontFamily: 'inherit' }}
          />
        )}
        {screen === 'applicant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 8 }}>신청인 성함</label>
              <input type="text" placeholder="예: 홍길동"
                value={applicantName}
                onChange={e => { setError(''); setApplicantName(e.target.value) }}
                autoFocus
                style={{ width: '100%', fontSize: 22, fontWeight: 700, color: '#111827', border: 'none', borderBottom: '2px solid #E5E9EF', background: 'transparent', outline: 'none', padding: '8px 0', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 8 }}>고인과의 관계</label>
              <input type="text" placeholder="예: 아들, 딸, 배우자"
                value={applicantRelation}
                onChange={e => { setError(''); setApplicantRelation(e.target.value) }}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                style={{ width: '100%', fontSize: 22, fontWeight: 700, color: '#111827', border: 'none', borderBottom: '2px solid #E5E9EF', background: 'transparent', outline: 'none', padding: '8px 0', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}
        {error && (
          <p style={{ fontSize: 13, color: '#DC2626', marginTop: 12, fontWeight: 600 }}>{error}</p>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50, display: 'flex', gap: 10 }}>
        <button onClick={goBack} style={{ width: 52, height: 52, borderRadius: 12, border: '1.5px solid #E5E9EF', background: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <button onClick={handleNext} disabled={loading} style={{
          flex: 1, padding: '17px', borderRadius: 14,
          background: loading ? '#E5E9EF' : '#2563EB',
          color: loading ? '#9CA3AF' : '#fff',
          fontSize: 16, fontWeight: 800, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', letterSpacing: '-0.02em',
        }}>
          {loading ? '저장 중...' : screen === 'phone' ? '계속 (선택사항)' : screen === 'applicant' ? '다음 단계' : '계속하기'}
        </button>
      </div>
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div />}>
      <ApplyForm />
    </Suspense>
  )
}
