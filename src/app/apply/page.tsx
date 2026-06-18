'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

// ─── 공통 ───────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff',
    }}>
      {children}
    </div>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, padding: '40px 24px 120px' }}>{children}</div>
}

function Dock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, padding: '16px 24px',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50,
    }}>
      {children}
    </div>
  )
}

function PrimaryBtn({ children, onClick, disabled }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '17px', borderRadius: 14,
      background: disabled ? '#E5E9EF' : '#2563EB',
      color: disabled ? '#9CA3AF' : '#fff',
      fontSize: 16, fontWeight: 800, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', letterSpacing: '-0.02em', transition: 'background 0.15s',
    }}>
      {children}
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 52, height: 52, borderRadius: 12, border: '1.5px solid #E5E9EF',
      background: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>←</button>
  )
}

function Question({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: '#111827',
        letterSpacing: '-0.03em', lineHeight: 1.35, margin: 0, whiteSpace: 'pre-line',
      }}>{label}</h2>
      {sub && <p style={{ fontSize: 14, color: '#9CA3AF', margin: '8px 0 0', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  )
}

function CheckCircle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: checked ? '#2563EB' : '#fff',
      border: `2px solid ${checked ? '#2563EB' : '#D1D5DB'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 0,
    }}>
      {checked && (
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
          <path d="M1 3.5L4 6.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}

function SelectCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '20px', borderRadius: 14, textAlign: 'left', width: '100%',
      background: selected ? '#EBF3FF' : '#F8FAFC',
      border: `1.5px solid ${selected ? '#2563EB' : '#E5E9EF'}`,
      fontSize: 16, fontWeight: 600, color: selected ? '#2563EB' : '#374151',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {label}
      {selected && (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="#2563EB"/>
          <path d="M6 10L9 13L14 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}

// ─── Step 1: 약관 동의 ───────────────────────────
const TERMS = [
  { key: 'privacy',  label: '개인정보 수집·이용 동의', href: '/privacy' },
  { key: 'delegate', label: '디지털 계정 대행 위임 동의', href: null },
  { key: 'esign',    label: '전자서명 법적 효력 동의', href: null },
]

function StepTerms({ onNext }: { onNext: () => void }) {
  const [agreed, setAgreed] = useState<Record<string, boolean>>({})
  const allAgreed = TERMS.every(t => agreed[t.key])

  const toggleAll = () => {
    if (allAgreed) { setAgreed({}); return }
    const all: Record<string, boolean> = {}
    TERMS.forEach(t => { all[t.key] = true })
    setAgreed(all)
  }

  return (
    <Screen>
      <Body>
        <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>시작하기 전에</p>
        <Question label={'약관에\n동의해 주세요'} />

        <button onClick={toggleAll} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          background: allAgreed ? '#EBF3FF' : '#F8FAFC',
          border: `1.5px solid ${allAgreed ? '#2563EB' : '#E5E9EF'}`,
          borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
          marginBottom: 8, transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'left',
        }}>
          <CheckCircle checked={allAgreed} onClick={() => {}} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: allAgreed ? '#2563EB' : '#111827' }}>전체 동의</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>서비스 이용 필수 항목 모두 동의</div>
          </div>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {TERMS.map(term => (
            <div key={term.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 4px', borderBottom: '1px solid #F3F4F6',
            }}>
              <CheckCircle
                checked={!!agreed[term.key]}
                onClick={() => setAgreed(prev => ({ ...prev, [term.key]: !prev[term.key] }))}
              />
              <span style={{ flex: 1, fontSize: 14, color: '#374151' }}>
                <span style={{ color: '#2563EB', fontWeight: 700, fontSize: 12 }}>(필수) </span>
                {term.label}
              </span>
              {term.href && (
                <a href={term.href} target="_blank" style={{ fontSize: 12, color: '#C4C4CC', textDecoration: 'none' }}>보기</a>
              )}
            </div>
          ))}
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#C4C4CC', lineHeight: 1.7, padding: '12px 0' }}>
          수집된 개인정보 및 서류는 디지털 계정 해지 대행 목적으로만 사용되며,<br />
          업무 완료 후 30일 이내 파기됩니다.
        </p>
      </Body>
      <Dock><PrimaryBtn disabled={!allAgreed} onClick={onNext}>동의하고 시작하기</PrimaryBtn></Dock>
    </Screen>
  )
}

// ─── Step 2: 유가족 확인 ─────────────────────────
function StepFamilyCheck({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null)
  return (
    <Screen>
      <Body>
        <Question label={'신청인이 고인의\n유가족이신가요?'} sub="에프텀 서비스는 유가족만 신청할 수 있습니다" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SelectCard label="네, 유가족입니다" selected={selected === 'yes'} onClick={() => setSelected('yes')} />
          <SelectCard label="아니요, 유가족이 아닙니다" selected={selected === 'no'} onClick={() => setSelected('no')} />
        </div>
        {selected === 'no' && (
          <div style={{
            marginTop: 16, padding: '14px 16px', borderRadius: 12,
            background: '#FFF7ED', border: '1px solid #FED7AA',
          }}>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0, lineHeight: 1.7, fontWeight: 600 }}>
              에프텀은 고인의 유가족 대상 서비스입니다.<br />
              유가족 외 신청은 접수가 불가합니다.
            </p>
          </div>
        )}
      </Body>
      <Dock>
        <PrimaryBtn disabled={!selected} onClick={() => selected === 'yes' ? onYes() : onNo()}>
          {selected === 'no' ? '서비스 종료하기' : '계속하기'}
        </PrimaryBtn>
      </Dock>
    </Screen>
  )
}

// ─── 날짜 3칸 입력 (자동 포커스 이동) ───────────
function DateFields({ value, onChange, error }: {
  value: string
  onChange: (v: string) => void
  error?: boolean
}) {
  const parts = value ? value.split('-') : ['', '', '']
  const year = parts[0] || ''
  const month = parts[1] || ''
  const day = parts[2] || ''

  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef   = useRef<HTMLInputElement>(null)

  const update = (y: string, m: string, d: string) => {
    onChange(`${y}-${m}-${d}`)
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    border: 0, borderBottom: `2px solid ${hasError ? '#EF4444' : '#2563EB'}`,
    background: 'transparent', fontSize: 22, fontWeight: 700,
    color: '#111827', outline: 'none', fontFamily: 'inherit',
    textAlign: 'center', width: '100%', padding: '8px 0',
    boxSizing: 'border-box',
  })

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 8 }}>
      <div style={{ flex: 2 }}>
        <input
          type="text" inputMode="numeric" placeholder="1960" maxLength={4}
          value={year} autoFocus
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            update(v, month, day)
            if (v.length === 4) monthRef.current?.focus()
          }}
          style={inputStyle(error)}
        />
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: '4px 0 0' }}>년</p>
      </div>
      <div style={{ flex: 1 }}>
        <input
          ref={monthRef}
          type="text" inputMode="numeric" placeholder="01" maxLength={2}
          value={month}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
            update(year, v, day)
            if (v.length === 2) dayRef.current?.focus()
          }}
          style={inputStyle(error)}
        />
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: '4px 0 0' }}>월</p>
      </div>
      <div style={{ flex: 1 }}>
        <input
          ref={dayRef}
          type="text" inputMode="numeric" placeholder="01" maxLength={2}
          value={day}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
            update(year, month, v)
          }}
          style={inputStyle(error)}
        />
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: '4px 0 0' }}>일</p>
      </div>
    </div>
  )
}

// ─── Step 3: 고인 정보 ───────────────────────────
type DeceasedField = 'name' | 'birth' | 'death' | 'phone'

const DECEASED_FIELDS: {
  key: DeceasedField; question: string; sub: string; placeholder: string; optional?: boolean
}[] = [
  { key: 'name',  question: '고인의 성함을\n알려주세요', sub: '실명으로 입력해 주세요 (기업 CS 접수에 사용)', placeholder: '예: 홍길동' },
  { key: 'birth', question: '고인의 생년월일은\n언제인가요?', sub: '계정 조회 및 서류 작성에 사용됩니다', placeholder: '' },
  { key: 'death', question: '사망일은\n언제인가요?', sub: '사망진단서의 사망일과 동일해야 합니다', placeholder: '' },
  { key: 'phone', question: '고인의 휴대폰 번호를\n알고 계신가요?', sub: '모르시면 건너뛰셔도 됩니다', placeholder: '010-0000-0000', optional: true },
]

function StepDeceased({
  deceasedInfo,
  onUpdate,
  onNext,
  onBack,
}: {
  deceasedInfo: { name: string; birthDate: string; deathDate: string; phone: string }
  onUpdate: (k: DeceasedField, v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const [fieldIdx, setFieldIdx] = useState(0)
  const [error, setError] = useState('')
  const field = DECEASED_FIELDS[fieldIdx]
  const isLast = fieldIdx === DECEASED_FIELDS.length - 1

  const getValue = () => {
    if (field.key === 'name') return deceasedInfo.name
    if (field.key === 'birth') return deceasedInfo.birthDate
    if (field.key === 'death') return deceasedInfo.deathDate
    return deceasedInfo.phone
  }

  const isDateField = field.key === 'birth' || field.key === 'death'

  const validateDate = (v: string) => {
    const parts = v.split('-')
    return parts.length === 3 && parts[0].length === 4 && parts[1].length >= 1 && parts[2].length >= 1
  }

  const goNext = () => {
    setError('')
    if (!field.optional) {
      if (isDateField && !validateDate(getValue())) {
        setError('년, 월, 일을 모두 입력해 주세요')
        return
      }
      if (!isDateField && !getValue().trim()) {
        setError('성함을 입력해 주세요')
        return
      }
    }
    if (isLast) onNext()
    else setFieldIdx(i => i + 1)
  }

  return (
    <Screen>
      <Body>
        <div key={field.key}>
          <Question label={field.question} sub={field.sub} />
          {isDateField ? (
            <DateFields
              value={getValue()}
              onChange={v => { onUpdate(field.key, v); setError('') }}
              error={!!error}
            />
          ) : (
            <input
              type={field.key === 'phone' ? 'tel' : 'text'}
              inputMode={field.key === 'phone' ? 'numeric' : undefined}
              placeholder={field.placeholder}
              value={getValue()}
              autoFocus
              onChange={e => {
                let v = e.target.value
                if (field.key === 'phone') {
                  const d = v.replace(/\D/g, '').slice(0, 11)
                  if (d.length <= 3) v = d
                  else if (d.length <= 7) v = `${d.slice(0,3)}-${d.slice(3)}`
                  else v = `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
                }
                onUpdate(field.key, v)
                setError('')
              }}
              onKeyDown={e => e.key === 'Enter' && goNext()}
              style={{
                width: '100%', height: 52, border: 0,
                borderBottom: `2px solid ${error ? '#EF4444' : '#2563EB'}`,
                background: 'transparent', fontSize: 20, fontWeight: 700,
                color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          )}
          {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 12, fontWeight: 600 }}>{error}</p>}
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => fieldIdx === 0 ? onBack() : setFieldIdx(i => i - 1)} />
          <PrimaryBtn onClick={goNext}>
            {isLast && field.optional && !getValue() ? '건너뛰기' : '계속하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── Step 4: 신청인 정보 ─────────────────────────
const RELATIONS = ['자녀', '배우자', '부모', '형제/자매', '손자/손녀', '기타']

function StepApplicant({
  onNext, onBack,
}: {
  onNext: (name: string, relation: string, phone: string) => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [innerStep, setInnerStep] = useState<'name' | 'relation' | 'phone'>('name')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const n = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
      if (n) setName(n)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const phoneFormat = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`
  }

  return (
    <Screen>
      <Body>
        {innerStep === 'name' && (
          <div key="name">
            <Question label={'신청인 성함을\n입력해 주세요'} sub="위임장에 기재됩니다. 반드시 실명으로 입력해 주세요" />
            <input type="text" placeholder="예: 홍길동" value={name} autoFocus
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setInnerStep('relation')}
              style={{
                width: '100%', height: 52, border: 0, borderBottom: '2px solid #2563EB',
                background: 'transparent', fontSize: 20, fontWeight: 700,
                color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 12, color: '#EF4444', marginTop: 8, fontWeight: 600 }}>
              ⚠ 실명 미기재 시 서비스 진행이 불가합니다
            </p>
          </div>
        )}
        {innerStep === 'relation' && (
          <div key="relation">
            <Question label={`${name}님과\n고인의 관계는요?`} sub="해당 관계를 선택해 주세요" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RELATIONS.map(r => (
                <button key={r} onClick={() => setRelation(r)} style={{
                  padding: '11px 20px', borderRadius: 50,
                  border: `1.5px solid ${relation === r ? '#2563EB' : '#E5E9EF'}`,
                  background: relation === r ? '#EBF3FF' : '#fff',
                  color: relation === r ? '#2563EB' : '#374151',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
        {innerStep === 'phone' && (
          <div key="phone">
            <Question label={'신청인 전화번호를\n입력해 주세요'} sub="결제 인증에 사용됩니다" />
            <input type="tel" inputMode="numeric" placeholder="010-0000-0000" value={phone} autoFocus
              onChange={e => setPhone(phoneFormat(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && phone.length >= 12 && onNext(name, relation, phone)}
              style={{
                width: '100%', height: 52, border: 0, borderBottom: '2px solid #2563EB',
                background: 'transparent', fontSize: 20, fontWeight: 700,
                color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => {
            if (innerStep === 'name') onBack()
            else if (innerStep === 'relation') setInnerStep('name')
            else setInnerStep('relation')
          }} />
          <PrimaryBtn
            disabled={innerStep === 'name' ? !name.trim() : innerStep === 'relation' ? !relation : !phone}
            onClick={() => {
              if (innerStep === 'name') setInnerStep('relation')
              else if (innerStep === 'relation') setInnerStep('phone')
              else onNext(name, relation, phone)
            }}
          >
            {innerStep === 'phone' ? '다음 단계' : '계속하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── Step 5: 사망진단서 보유 확인 ───────────────
function StepDeathCertCheck({ onYes, onNo, onBack }: { onYes: () => void; onNo: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null)
  return (
    <Screen>
      <Body>
        <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>서류 준비</p>
        <Question label={'사망진단서가\n필요합니다'} />

        {/* 준비 안내 박스 - 선택 전에 항상 표시 */}
        <div style={{
          padding: '18px 18px', borderRadius: 14, marginBottom: 28,
          background: '#EFF6FF', border: '1px solid #BFDBFE',
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF', margin: '0 0 10px' }}>
            서비스 진행을 위해 반드시 필요합니다
          </p>
          <ul style={{ fontSize: 13, color: '#374151', margin: 0, padding: '0 0 0 14px', lineHeight: 2.1 }}>
            <li>사망을 처리한 <strong>병원 원무과</strong>에서 발급</li>
            <li><strong>관할 보건소</strong> (사망신고 후 발급 가능)</li>
            <li><strong>정부24</strong> 온라인 발급 (gov.kr)</li>
          </ul>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '10px 0 0', lineHeight: 1.6 }}>
            아직 없으시다면 먼저 발급받으신 후 신청을 진행해 주세요
          </p>
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
          사망진단서를 준비하셨나요?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SelectCard label="네, 준비했습니다" selected={selected === 'yes'} onClick={() => setSelected('yes')} />
          <SelectCard label="아직 없습니다" selected={selected === 'no'} onClick={() => setSelected('no')} />
        </div>

        {selected === 'no' && (
          <div style={{
            marginTop: 16, padding: '14px 16px', borderRadius: 12,
            background: '#FFFBEB', border: '1px solid #FCD34D',
          }}>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0, lineHeight: 1.7, fontWeight: 600 }}>
              사망진단서 발급 후 다시 돌아와<br />신청을 완료해 주세요
            </p>
          </div>
        )}
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={onBack} />
          <PrimaryBtn disabled={!selected} onClick={() => selected === 'yes' ? onYes() : onNo()}>
            {selected === 'no' ? '나중에 신청하기' : '계속하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── 메인 플로우 ─────────────────────────────────
// 순서: 약관 → 유가족확인 → 사망진단서확인 → 고인정보 → 신청인
type FlowStep = 'terms' | 'family' | 'deathcert' | 'deceased' | 'applicant'

function ApplyFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { deceasedInfo, setDeceasedInfo, setCaseId, setStep, setDelegation, resetStore } = useApplyStore()
  const supabase = createClient()
  const [flowStep, setFlowStep] = useState<FlowStep>('terms')
  const [delegatorName, setDelegatorName] = useState('')
  const [delegatorRelation, setDelegatorRelation] = useState('')
  const [delegatorPhone, setDelegatorPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const { caseId } = useApplyStore.getState()
    if (searchParams.get('reset') === 'true') { resetStore(); return }
    if (caseId) {
      supabase.from('cases').select('status').eq('id', caseId).single()
        .then(({ data }) => { if (!data || data.status !== 'draft') resetStore() })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveCaseAndNext = async (name?: string, relation?: string, phone?: string) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const existingCaseId = useApplyStore.getState().caseId
      const dName = name ?? delegatorName
      const dRelation = relation ?? delegatorRelation
      const dPhone = phone ?? delegatorPhone

      if (existingCaseId) {
        await supabase.from('cases').update({
          deceased_name: deceasedInfo.name,
          deceased_birth: deceasedInfo.birthDate,
          deceased_death: deceasedInfo.deathDate,
          deceased_phone: deceasedInfo.phone || null,
          delegator_phone: dPhone || null,
        }).eq('id', existingCaseId)
        await supabase.from('delegations').upsert({
          case_id: existingCaseId,
          delegator_name: dName,
          delegator_relation: dRelation,
          delegator_phone: dPhone || null,
        }, { onConflict: 'case_id' })
      } else {
        const { data, error } = await supabase.from('cases').insert({
          user_id: user.id,
          deceased_name: deceasedInfo.name,
          deceased_birth: deceasedInfo.birthDate,
          deceased_death: deceasedInfo.deathDate,
          deceased_phone: deceasedInfo.phone || null,
          delegator_phone: dPhone || null,
          status: 'draft',
        }).select('id').single()
        if (error) throw error
        setCaseId(data.id)
        await supabase.from('delegations').upsert({
          case_id: data.id,
          delegator_name: dName,
          delegator_relation: dRelation,
          delegator_phone: dPhone || null,
        }, { onConflict: 'case_id' })
      }

      setDelegation({ delegatorName: dName, delegatorRelation: dRelation, signatureData: '' })
      setStep(1)
      router.push('/apply/services')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // 순서: 약관 → 유가족 → 사망진단서 → 고인정보 → 신청인 → (저장 후 services)
  if (flowStep === 'terms') return <StepTerms onNext={() => setFlowStep('family')} />
  if (flowStep === 'family') return (
    <StepFamilyCheck
      onYes={() => setFlowStep('deathcert')}
      onNo={() => router.push('/home')}
    />
  )
  if (flowStep === 'deathcert') return (
    <StepDeathCertCheck
      onYes={() => setFlowStep('deceased')}
      onNo={() => router.push('/home')}
      onBack={() => setFlowStep('family')}
    />
  )
  if (flowStep === 'deceased') return (
    <StepDeceased
      deceasedInfo={deceasedInfo}
      onUpdate={(k, v) => {
        const storeKey = k === 'birth' ? 'birthDate' : k === 'death' ? 'deathDate' : k
        setDeceasedInfo({ [storeKey]: v })
      }}
      onNext={() => setFlowStep('applicant')}
      onBack={() => setFlowStep('deathcert')}
    />
  )
  if (flowStep === 'applicant') return (
    <StepApplicant
      onNext={(name, relation, phone) => {
        setDelegatorName(name)
        setDelegatorRelation(relation)
        setDelegatorPhone(phone)
        saveCaseAndNext(name, relation, phone)
      }}
      onBack={() => setFlowStep('deceased')}
    />
  )
  return null
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div />}>
      <ApplyFlow />
    </Suspense>
  )
}
