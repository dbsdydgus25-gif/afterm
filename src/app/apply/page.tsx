'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_CATALOG } from '@/lib/services-catalog'
import type { TrackType } from '@/lib/services-catalog'
import { Suspense } from 'react'
import DocScanner from '@/components/ui/DocScanner'

// ─── 공통 컴포넌트 ─────────────────────────────────────
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

function StepLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 700, color: '#2563EB',
      letterSpacing: '0.06em', margin: '0 0 12px', opacity: 0.7,
    }}>{label}</p>
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

// ProgressBar 제거 (사용자 요청)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProgressBar({ current }: { current: number }) {
  return null
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

// ─── Step 1: 약관 동의 ─────────────────────────────────
const TERMS = [
  {
    key: 'privacy',
    label: '개인정보 수집·이용 동의',
    href: '/privacy',
    content: `[수집 항목] 성명, 생년월일, 연락처, 고인 정보(성명·사망일·사망진단서), 가족관계, 서명 데이터

[수집 목적] 디지털 계정 해지·삭제·추모계정 전환 행정 대행 서비스 제공

[보유 기간] 업무 완료 후 30일 이내 파기 (단, 관련 법령에 따라 일정 기간 보관될 수 있음)

[제3자 제공] 플랫폼사(구글·메타·카카오 등)에 서비스 처리 목적으로만 제공하며, 그 외 제3자에게 제공하지 않습니다.

동의를 거부하실 수 있으며, 거부 시 서비스 이용이 제한됩니다.`,
  },
  {
    key: 'delegate',
    label: '디지털 계정 대행 위임 동의',
    href: null,
    content: `본인은 에프텀(이하 "수임인")에게 고인의 디지털 유산 처리에 관한 다음의 행정 행위를 위임합니다.

【제1항 위임 범위】
① 소셜미디어·포털·OTT·클라우드 등 디지털 계정의 해지, 삭제, 추모계정 전환 신청
② 관련 서류(사망진단서·가족관계증명서 등)의 각 기관 제출
③ 이동통신·구독 서비스 해지 신청
④ 금융 계좌의 사망 통보 및 지급 정지 요청 (자산 처분 권한 제외)

【제2항 사후 위임 존속】
민법 제127조에도 불구하고, 본 위임의 효력은 위임인의 사망으로 종료되지 아니하며 사망 시점부터 발생합니다.

【제3항 면책】
수임인이 본 위임 범위 내에서 수행한 행위에 대하여 법정 상속인은 민·형사상 이의를 제기할 수 없습니다. 플랫폼의 내부 방침 또는 불가항력적 사유로 인한 처리 지연·거절에 대해 수임인은 책임을 지지 않습니다.`,
  },
  {
    key: 'esign',
    label: '전자서명 법적 효력 동의',
    href: null,
    content: `본 서비스에서 수집하는 전자서명(캔버스 서명)은 전자서명법 제3조에 따라 자필 서명과 동일한 법적 효력을 가집니다.

【전자서명의 법적 근거】
• 전자서명법 제3조: 전자서명은 법령상 서명·날인·기명날인으로서의 효력을 가집니다.
• 본인인증(핸드폰 인증) 로그와 서명 시각 타임스탬프가 위임장에 함께 기록되어 증명력을 높입니다.

【서명의 용도】
수집된 서명 이미지는 에프텀이 발행하는 위임장 PDF에만 사용되며, 이외의 목적으로 사용되지 않습니다.

동의 시 본인이 직접 서명한 것으로 간주되며, 서명 후 위임장이 법적 효력을 갖습니다.`,
  },
]

function StepTerms({ onNext }: { onNext: () => void }) {
  const [agreed, setAgreed] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const allAgreed = TERMS.every(t => agreed[t.key])

  const toggleAll = () => {
    if (allAgreed) { setAgreed({}); return }
    const all: Record<string, boolean> = {}
    TERMS.forEach(t => { all[t.key] = true })
    setAgreed(all)
  }

  return (
    <Screen>
      <ProgressBar current={1} />
      <Body>
        <StepLabel label="시작하기 전에" />
        <Question label={'약관에\n동의해 주세요'} sub="서비스 이용을 위한 필수 항목에 동의해 주세요" />

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
            <div key={term.key}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 4px', borderBottom: expanded === term.key ? 'none' : '1px solid #F3F4F6',
              }}>
                <CheckCircle
                  checked={!!agreed[term.key]}
                  onClick={() => setAgreed(prev => ({ ...prev, [term.key]: !prev[term.key] }))}
                />
                <span style={{ flex: 1, fontSize: 14, color: '#374151' }}>
                  <span style={{ color: '#2563EB', fontWeight: 700, fontSize: 12 }}>(필수) </span>
                  {term.label}
                </span>
                <button
                  onClick={() => setExpanded(expanded === term.key ? null : term.key)}
                  style={{
                    fontSize: 12, color: '#6B7280', fontWeight: 600,
                    background: '#F3F4F6', border: 'none', borderRadius: 6,
                    padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  }}
                >
                  {expanded === term.key ? '닫기' : '보기'}
                </button>
                {term.href && (
                  <a href={term.href} target="_blank" style={{ fontSize: 12, color: '#C4C4CC', textDecoration: 'none' }}>↗</a>
                )}
              </div>
              {expanded === term.key && (
                <div style={{
                  background: '#F9FAFB', border: '1px solid #E5E9EF',
                  borderTop: 'none', borderRadius: '0 0 12px 12px',
                  padding: '14px 16px', marginBottom: 4,
                }}>
                  <pre style={{
                    fontSize: 12, color: '#374151', lineHeight: 1.8,
                    margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                  }}>
                    {term.content}
                  </pre>
                  <button
                    onClick={() => {
                      setAgreed(prev => ({ ...prev, [term.key]: true }))
                      setExpanded(null)
                    }}
                    style={{
                      marginTop: 12, width: '100%', padding: '10px',
                      background: '#EBF3FF', border: '1.5px solid #2563EB',
                      borderRadius: 10, color: '#2563EB', fontSize: 13,
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    이 항목에 동의합니다
                  </button>
                </div>
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

// ─── Step 2: 유가족 확인 ───────────────────────────────
function StepFamilyCheck({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null)
  return (
    <Screen>
      <ProgressBar current={2} />
      <Body>
        <StepLabel label="신청 자격 확인" />
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

// ─── Step 3: 사망진단서 확인 ───────────────────────────
function StepDeathCertCheck({ onYes, onNo, onBack }: { onYes: () => void; onNo: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null)
  return (
    <Screen>
      <ProgressBar current={3} />
      <Body>
        <StepLabel label="서류 준비 확인" />
        <Question label={'사망진단서를\n준비하셨나요?'} sub="서비스 진행을 위해 반드시 필요합니다" />

        <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
          준비 상태를 선택해 주세요
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SelectCard label="네, 준비했습니다" selected={selected === 'yes'} onClick={() => setSelected('yes')} />
          <SelectCard label="아직 없습니다" selected={selected === 'no'} onClick={() => setSelected('no')} />
        </div>

        <div style={{
          marginTop: 20, padding: '18px', borderRadius: 14,
          background: '#EFF6FF', border: '1px solid #BFDBFE',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', margin: '0 0 8px' }}>발급 방법</p>
          <ul style={{ fontSize: 13, color: '#374151', margin: 0, padding: '0 0 0 14px', lineHeight: 2.1 }}>
            <li>사망을 처리한 <strong>병원 원무과</strong>에서 발급</li>
            <li><strong>관할 보건소</strong> (사망신고 후 발급 가능)</li>
            <li><strong>정부24</strong> 온라인 발급 (gov.kr)</li>
          </ul>
        </div>

        {selected === 'no' && (
          <div style={{
            marginTop: 12, padding: '14px 16px', borderRadius: 12,
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

// ─── Step 4: 사망진단서 OCR ────────────────────────────

function DateInput({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', '']
  const year = parts[0] || '', month = parts[1] || '', day = parts[2] || ''
  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef   = useRef<HTMLInputElement>(null)
  const update = (y: string, m: string, d: string) => onChange(`${y}-${m}-${d}`)
  const iStyle: React.CSSProperties = {
    border: 0, borderBottom: '1.5px solid #D1D5DB', background: 'transparent',
    fontSize: 16, fontWeight: 700, color: '#111827', outline: 'none',
    fontFamily: 'inherit', textAlign: 'center', padding: '6px 0', width: '100%',
  }
  return (
    <div>
      {label && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 6px', fontWeight: 600 }}>{label}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <input type="text" inputMode="numeric" placeholder="YYYY" maxLength={4} value={year}
            onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,4); update(v,month,day); if(v.length===4) monthRef.current?.focus() }}
            style={iStyle}
          />
          <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', margin: '2px 0 0' }}>년</p>
        </div>
        <div style={{ flex: 1 }}>
          <input ref={monthRef} type="text" inputMode="numeric" placeholder="MM" maxLength={2} value={month}
            onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,2); update(year,v,day); if(v.length===2) dayRef.current?.focus() }}
            style={iStyle}
          />
          <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', margin: '2px 0 0' }}>월</p>
        </div>
        <div style={{ flex: 1 }}>
          <input ref={dayRef} type="text" inputMode="numeric" placeholder="DD" maxLength={2} value={day}
            onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,2); update(year,month,v) }}
            style={iStyle}
          />
          <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', margin: '2px 0 0' }}>일</p>
        </div>
      </div>
    </div>
  )
}

type AiResult = { score?: number; authentic?: boolean; issues?: string[]; licenseNumber?: string | null; hasSignature?: boolean; hospital?: string | null }

function StepOcr({
  onNext, onBack, setDeceasedInfo,
}: {
  onNext: (file: File | null, aiResult: AiResult) => void
  onBack: () => void
  setDeceasedInfo: (info: { name?: string; birthDate?: string; deathDate?: string }) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<'upload' | 'confirm'>('upload')
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [hospital, setHospital] = useState('')
  const [certFile, setCertFile] = useState<File | null>(null)
  const [aiResult, setAiResult] = useState<AiResult>({})
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/ocr/death-certificate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '처리 실패'); setLoading(false); return }
      setName(data.name || '')
      setBirthDate(data.birthDate || '')
      setDeathDate(data.deathDate || '')
      setHospital(data.hospital || '')
      setAiResult({
        score: data.score, authentic: data.authentic, issues: data.issues,
        licenseNumber: data.licenseNumber, hasSignature: data.hasSignature, hospital: data.hospital,
      })
      setCertFile(file)
      setPhase('confirm')
    } catch {
      setError('분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!name.trim()) { setError('성함을 입력해 주세요'); return }
    if (!deathDate || deathDate.split('-').length !== 3) { setError('사망일을 입력해 주세요'); return }
    setDeceasedInfo({ name: name.trim(), birthDate, deathDate })
    onNext(certFile, aiResult)
  }

  return (
    <Screen>
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); e.target.value = '' }}
      />

      {showScanner && (
        <DocScanner
          label="사망진단서"
          onCapture={file => { setShowScanner(false); handleFile(file) }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* 전체화면 로딩 오버레이 */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.96)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #E5E9EF',
            borderTop: '4px solid #2563EB', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>사망진단서 분석 중</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>잠시만 기다려 주세요</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {phase === 'upload' ? (
        <>
          <Body>
            <StepLabel label="고인 정보 확인" />
            <Question label={'사망진단서를\n업로드해 주세요'} sub="이름과 날짜를 자동으로 인식합니다" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setShowScanner(true)} style={{
                width: '100%', padding: '28px 20px', borderRadius: 20,
                border: '2px solid #111827', background: '#111827',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 36 }}>📷</span>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>카메라로 스캔</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>프레임에 맞춰 찍으면 자동 처리</p>
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{
                width: '100%', padding: '20px', borderRadius: 20,
                border: '2px dashed #BFDBFE', background: '#EFF6FF',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#2563EB', margin: 0 }}>파일 선택 (JPG·PNG·PDF)</p>
              </button>
            </div>

            {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 16, fontWeight: 600, textAlign: 'center' }}>{error}</p>}

            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E5E9EF' }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.8 }}>
                인식 항목: 성함 · 생년월일 · 사망 연월일<br />
                파일 용량 50MB 이하 · 해상도 150dpi 이상 권장
              </p>
            </div>
          </Body>
          <Dock>
            <BackBtn onClick={onBack} />
          </Dock>
        </>
      ) : (
        <>
          <Body>
            <StepLabel label="고인 정보 확인" />
            <Question label={'인식된 정보를\n확인해 주세요'} sub="틀린 내용은 바로 수정할 수 있어요" />

            {/* 추출 정보 카드 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E9EF' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px', letterSpacing: '0.05em' }}>성함</p>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="직접 입력해 주세요"
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    fontSize: 18, fontWeight: 700, color: name ? '#111827' : '#9CA3AF',
                    outline: 'none', fontFamily: 'inherit', padding: 0, boxSizing: 'border-box',
                  }}
                />
                {!name && <p style={{ fontSize: 12, color: '#F59E0B', margin: '4px 0 0', fontWeight: 600 }}>인식되지 않았습니다 — 직접 입력해 주세요</p>}
              </div>

              <div style={{ padding: '16px 18px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 8px', letterSpacing: '0.05em' }}>생년월일</p>
                <DateInput value={birthDate} onChange={setBirthDate} />
              </div>

              <div style={{ padding: '16px 18px', borderBottom: hospital ? '1px solid #F3F4F6' : undefined }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 8px', letterSpacing: '0.05em' }}>사망 연월일</p>
                <DateInput value={deathDate} onChange={setDeathDate} />
              </div>

              {hospital && (
                <div style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px', letterSpacing: '0.05em' }}>의료기관</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>{hospital}</p>
                </div>
              )}
            </div>

            {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 12, fontWeight: 600 }}>{error}</p>}

            <button onClick={() => setPhase('upload')} style={{
              marginTop: 14, fontSize: 13, color: '#6B7280', background: 'none', border: 'none',
              cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit', textDecoration: 'underline',
            }}>
              다시 업로드
            </button>
          </Body>
          <Dock>
            <PrimaryBtn onClick={handleConfirm}>확인, 다음 단계로</PrimaryBtn>
          </Dock>
        </>
      )}
    </Screen>
  )
}

// ─── Step 5: 신청인 정보 + 본인인증 ──────────────────────
const RELATIONS = ['자녀', '배우자', '부모', '형제/자매', '손자/손녀', '기타']

function StepApplicant({ onNext, onBack }: {
  onNext: (name: string, relation: string, phone: string) => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [innerStep, setInnerStep] = useState<'name' | 'relation' | 'phone' | 'verify'>('name')
  const [otpToken, setOtpToken] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [devCode, setDevCode] = useState('')  // 개발용 코드 표시
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

  const sendOtp = async () => {
    setOtpSending(true)
    setOtpError('')
    setOtpCode('')
    try {
      const res = await fetch('/api/verify/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.ok) {
        setOtpToken(data.token)
        setOtpSent(true)
        if (data.code) setDevCode(data.code)  // SMS 미연동 시 화면에 표시
      } else {
        setOtpError('인증번호 발송에 실패했습니다')
      }
    } catch {
      setOtpError('네트워크 오류가 발생했습니다')
    } finally {
      setOtpSending(false)
    }
  }

  const verifyOtp = async () => {
    setOtpError('')
    try {
      const res = await fetch('/api/verify/check-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode, token: otpToken }),
      })
      const data = await res.json()
      if (data.ok) {
        onNext(name, relation, phone)
      } else {
        setOtpError(data.error || '인증번호가 올바르지 않습니다')
      }
    } catch {
      setOtpError('인증 오류가 발생했습니다')
    }
  }

  const innerLabels = {
    name: '신청인 정보 1/4',
    relation: '신청인 정보 2/4',
    phone: '신청인 정보 3/4',
    verify: '신청인 정보 4/4',
  }

  return (
    <Screen>
      <ProgressBar current={5} />
      <Body>
        <StepLabel label={innerLabels[innerStep]} />
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
            <Question label={'핸드폰\n본인인증을 해주세요'} sub="신청인 본인 명의 번호로 인증해 주세요. 위임장에 인증 기록이 남습니다." />
            <input type="tel" inputMode="numeric" placeholder="010-0000-0000" value={phone} autoFocus
              onChange={e => setPhone(phoneFormat(e.target.value))}
              onKeyDown={e => {
                if (e.key === 'Enter' && phone.replace(/\D/g, '').length >= 10) {
                  sendOtp().then(() => setInnerStep('verify'))
                }
              }}
              style={{
                width: '100%', height: 52, border: 0, borderBottom: '2px solid #2563EB',
                background: 'transparent', fontSize: 20, fontWeight: 700,
                color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
              인증번호 6자리가 발송됩니다. 위임장에 본인인증 완료 기록이 삽입됩니다.
            </p>
          </div>
        )}
        {innerStep === 'verify' && (
          <div key="verify">
            <Question
              label={'인증번호를\n입력해 주세요'}
              sub={`${phone}로 발송된 6자리 숫자를 입력해 주세요`}
            />
            {devCode && (
              <div style={{
                padding: '12px 16px', background: '#FFFBEB', borderRadius: 10,
                border: '1px solid #FDE68A', marginBottom: 16,
                fontSize: 13, color: '#92400E', fontWeight: 600,
              }}>
                인증번호: <span style={{ fontSize: 20, letterSpacing: '0.15em', color: '#D97706' }}>{devCode}</span>
                <br /><span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>SMS 연동 전 테스트 코드 (실제 배포 시 SMS로 발송됩니다)</span>
              </div>
            )}
            <input
              type="tel" inputMode="numeric" placeholder="000000" value={otpCode} autoFocus maxLength={6}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => { if (e.key === 'Enter' && otpCode.length === 6) verifyOtp() }}
              style={{
                width: '100%', height: 52, border: 0, borderBottom: '2px solid #2563EB',
                background: 'transparent', fontSize: 28, fontWeight: 900, letterSpacing: '0.2em',
                color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {otpError && (
              <p style={{ fontSize: 13, color: '#EF4444', marginTop: 8, fontWeight: 600 }}>⚠ {otpError}</p>
            )}
            <button
              onClick={() => { sendOtp() }}
              style={{
                marginTop: 14, fontSize: 13, color: '#2563EB', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                padding: 0, textDecoration: 'underline',
              }}
            >
              {otpSending ? '발송 중...' : '인증번호 재발송'}
            </button>
          </div>
        )}
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => {
            if (innerStep === 'name') onBack()
            else if (innerStep === 'relation') setInnerStep('name')
            else if (innerStep === 'phone') setInnerStep('relation')
            else { setInnerStep('phone'); setOtpSent(false); setOtpCode(''); setDevCode('') }
          }} />
          <PrimaryBtn
            disabled={
              innerStep === 'name' ? !name.trim() :
              innerStep === 'relation' ? !relation :
              innerStep === 'phone' ? (phone.replace(/\D/g, '').length < 10 || otpSending) :
              otpCode.length !== 6
            }
            onClick={() => {
              if (innerStep === 'name') setInnerStep('relation')
              else if (innerStep === 'relation') setInnerStep('phone')
              else if (innerStep === 'phone') {
                sendOtp().then(() => setInnerStep('verify'))
              } else {
                verifyOtp()
              }
            }}
          >
            {innerStep === 'phone' ? (otpSending ? '발송 중...' : '인증번호 받기') :
             innerStep === 'verify' ? '인증 확인' :
             '계속하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── Step 6: 계정 아이디 안내 ──────────────────────────
function StepAccountNotice({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <Screen>
      <ProgressBar current={6} />
      <Body>
        <StepLabel label="서비스 선택 전 확인" />
        <Question
          label={'계정 아이디를\n알고 계셔야 합니다'}
          sub="서비스 처리를 위해 고인의 계정 아이디(이메일/전화번호)가 필요합니다"
        />
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: '#EBF3FF', border: '1.5px solid #BFDBFE',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', margin: '0 0 10px' }}>아이디를 모르는 경우</p>
          <ul style={{ fontSize: 13, color: '#374151', margin: 0, padding: '0 0 0 16px', lineHeight: 2.2 }}>
            <li>고인의 휴대폰에서 앱 로그인 확인</li>
            <li>이메일 받은 메일함에서 가입 메일 검색</li>
            <li>가족이나 지인에게 확인</li>
          </ul>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '10px 0 0', lineHeight: 1.6 }}>
            아이디를 모르시면 처리 지연이 발생할 수 있습니다
          </p>
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={onBack} />
          <div style={{ flex: 1 }}>
            <PrimaryBtn onClick={onNext}>아이디 확인했습니다</PrimaryBtn>
          </div>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── Step 7: 서비스 트랙 선택 ──────────────────────────
function StepTrack({ onSelect, onBack }: {
  onSelect: (track: TrackType) => void
  onBack: () => void
}) {
  return (
    <Screen>
      <ProgressBar current={7} />
      <Body>
        <StepLabel label="서비스 선택" />
        <Question
          label={'어떤 서비스를\n원하시나요?'}
          sub="고인의 디지털 계정을 어떻게 할지 선택해 주세요"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => onSelect('memorial')} style={{
            padding: '24px 22px', borderRadius: 16, textAlign: 'left',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(37,99,235,0.2)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>추모계정 전환</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              계정을 보존하고 추모 공간으로 만들어요
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>페이스북 · 인스타그램 · 카카오톡</div>
          </button>

          <button onClick={() => onSelect('delete')} style={{
            padding: '24px 22px', borderRadius: 16, textAlign: 'left',
            background: '#F8FAFC', border: '1.5px solid #E5E9EF',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 6 }}>계정 삭제</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              계정과 모든 데이터를 영구 삭제해요
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>구글 · 페이스북 · 트위터X</div>
          </button>
        </div>
      </Body>
      <Dock>
        <BackBtn onClick={onBack} />
      </Dock>
    </Screen>
  )
}

// ─── Step 8: 플랫폼 선택 ───────────────────────────────
const TRACK_PLATFORMS: Record<TrackType, string[]> = {
  memorial: ['facebook', 'instagram', 'kakaotalk'],
  delete:   ['google', 'facebook', 'twitter'],
}

function StepPlatforms({ onNext, onBack, saving }: {
  onNext: () => void
  onBack: () => void
  saving: boolean
}) {
  const { selectedTrack, selectedServices, toggleService } = useApplyStore()
  if (!selectedTrack) return null

  const platformIds = TRACK_PLATFORMS[selectedTrack]
  const availablePlatforms = SERVICE_CATALOG.filter(s => platformIds.includes(s.id))
  const isSelected = (id: string) => selectedServices.some(s => s.id === id)
  const trackColor = selectedTrack === 'memorial' ? '#2563EB' : '#DC2626'
  const trackLabel = selectedTrack === 'memorial' ? '추모계정 전환' : '계정 삭제'

  const handleToggle = (id: string) => {
    const svc = SERVICE_CATALOG.find(s => s.id === id)!
    toggleService(svc, selectedTrack)
  }

  return (
    <Screen>
      <ProgressBar current={8} />
      <Body>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '4px 12px', borderRadius: 20, marginBottom: 16,
          background: selectedTrack === 'memorial' ? '#EBF3FF' : '#FEF2F2',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: trackColor }}>{trackLabel}</span>
        </div>
        <Question label={'어떤 서비스를\n처리할까요?'} sub="여러 개 선택 가능해요" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {availablePlatforms.map(svc => {
            const selected = isSelected(svc.id)
            return (
              <button key={svc.id} onClick={() => handleToggle(svc.id)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 4px', background: 'none', border: 'none',
                borderBottom: '1px solid #F3F4F6', width: '100%',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: selected ? trackColor : '#fff',
                  border: `2px solid ${selected ? trackColor : '#D1D5DB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {selected && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{svc.name}</div>
                </div>
              </button>
            )
          })}
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={onBack} />
          <div style={{ flex: 1 }}>
            <PrimaryBtn
              disabled={selectedServices.length === 0 || saving}
              onClick={onNext}
            >
              {saving ? '저장 중...' : selectedServices.length > 0
                ? `${selectedServices.length}개 선택 · 다음`
                : '서비스를 선택해 주세요'}
            </PrimaryBtn>
          </div>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── 메인 플로우 (아래 참조) ──────────────────────────────
// StepDelegationAgreement, StepSignature는 apply/documents/page.tsx로 이동됨

// ─── Step: 위임 동의 (미사용 — documents 페이지에서 처리) ────
function _UnusedStepDelegationAgreement({ onNext, onBack, delegatorName }: {
  onNext: () => void
  onBack: () => void
  delegatorName: string
}) {
  const [agreed, setAgreed] = useState(false)

  return (
    <Screen>
      <ProgressBar current={6} />
      <Body>
        <StepLabel label="위임장 내용 확인" />
        <Question
          label={'위임 내용을\n확인해 주세요'}
          sub="아래 내용을 읽고, 동의하시면 서명 단계로 진행합니다"
        />

        <div style={{
          border: '1px solid #E5E9EF', borderRadius: 14,
          overflow: 'hidden', marginBottom: 20,
        }}>
          <div style={{ background: '#1E3A8A', padding: '14px 18px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>디지털 유산 사후 행정 대행 위임장</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>에프텀 (개인사업자)</div>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 380, overflowY: 'auto' }}>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 6 }}>제1조  당사자 및 목적</div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                본 위임장은 위임인({delegatorName || '본인'})의 사망 이후 발생하는 디지털 유산 정리 및 행정 대행 업무를 에프텀(수임인)에게 위탁하기 위한 문서입니다.
              </p>
            </div>

            <div style={{ height: 1, background: '#F3F4F6' }} />

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>제2조  사후 위임의 존속 특약 [핵심 법적 조항]</div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                민법 제127조에도 불구하고, 본 위임 계약 및 대리권은 위임인의 사망으로 종료되지 아니하며 그 효력이 지속됩니다. 본 위임장의 효력은 위임인의 사망 시점(사망진단서 상의 일시)부터 발생합니다.
              </p>
            </div>

            <div style={{ height: 1, background: '#F3F4F6' }} />

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 6 }}>제3조  위임 업무의 범위</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>① 디지털 플랫폼 계정 처리</p>
                <p style={{ margin: '0 0 10px', paddingLeft: 12, color: '#6B7280', fontSize: 12 }}>카카오·구글·메타(페이스북/인스타그램) 등 계정 해지·삭제·추모계정 전환 신청 및 서류 제출</p>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>② 정기 결제·구독 해지</p>
                <p style={{ margin: '0 0 10px', paddingLeft: 12, color: '#6B7280', fontSize: 12 }}>이동통신사·OTT·클라우드 등 유료 구독 서비스 해지 신청</p>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>③ 금융 계좌 사망 통보 (제한적)</p>
                <p style={{ margin: 0, paddingLeft: 12, color: '#6B7280', fontSize: 12 }}>사망 사실 통보 및 계정 동결 요청 — 자산 인출·처분 권한은 포함되지 않으며, 자산 귀속은 상속법에 따릅니다</p>
              </div>
            </div>

            <div style={{ height: 1, background: '#F3F4F6' }} />

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 6 }}>제4조  상속인 권리 제한 및 면책</div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                수임인이 위임 범위 내에서 수행한 행위(계정 삭제·해지·동결 등)는 위임인의 확고한 생전 의사에 따른 것입니다. 법정 상속인은 수임인의 정당한 업무 수행에 이의를 제기하거나 손해배상을 청구할 수 없습니다. 플랫폼 내부 방침이나 불가항력으로 인한 처리 지연·거절에 대해 수임인은 법적 책임을 지지 않습니다.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setAgreed(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            background: agreed ? '#EBF3FF' : '#F8FAFC',
            border: `1.5px solid ${agreed ? '#2563EB' : '#E5E9EF'}`,
            borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <CheckCircle checked={agreed} onClick={() => {}} />
          <span style={{ fontSize: 14, fontWeight: 700, color: agreed ? '#2563EB' : '#111827' }}>
            위 위임장 내용을 충분히 이해하였으며, 이에 동의하여 에프텀에 위임합니다
          </span>
        </button>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={onBack} />
          <PrimaryBtn disabled={!agreed} onClick={onNext}>서명하러 가기</PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── Step: 서명 (미사용 — documents 페이지에서 처리) ─────
function _UnusedStepSignature({ onNext, onBack, delegatorName }: {
  onNext: (signatureData: string) => void
  onBack: () => void
  delegatorName: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [drawing, setDrawing] = useState(false)

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
    setHasSignature(true)
    canvas.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const onPointerUp = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const confirm = () => {
    const canvas = canvasRef.current!
    const dataUrl = canvas.toDataURL('image/png')
    onNext(dataUrl)
  }

  return (
    <Screen>
      <ProgressBar current={7} />
      <Body>
        <StepLabel label="서명" />
        <Question
          label={'위임장에\n서명해 주세요'}
          sub={`${delegatorName || '신청인'}님의 서명이 위임장 PDF에 직접 삽입됩니다`}
        />

        <div style={{
          border: '2px solid #E5E9EF', borderRadius: 14,
          overflow: 'hidden', background: '#FAFBFC', position: 'relative',
        }}>
          <div style={{
            padding: '10px 14px', background: '#F3F4F6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #E5E9EF',
          }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>손가락 또는 펜으로 서명해 주세요</span>
            <button onClick={clearCanvas} style={{
              fontSize: 12, color: '#EF4444', fontWeight: 600, background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 10px', fontFamily: 'inherit',
            }}>지우기</button>
          </div>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            style={{ width: '100%', height: 200, touchAction: 'none', display: 'block', cursor: 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          {!hasSignature && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, top: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 600 }}>이곳에 서명해 주세요</span>
            </div>
          )}
        </div>

        <div style={{
          marginTop: 16, padding: '14px 16px', background: '#EBF3FF',
          borderRadius: 12, border: '1px solid #BFDBFE',
        }}>
          <p style={{ fontSize: 12, color: '#1D4ED8', lineHeight: 1.7, margin: 0 }}>
            📌 본 서명은 전자서명법 제3조에 따른 전자서명으로, 자필 서명과 동일한 법적 효력을 가집니다.
            본인인증 정보 및 서명 시각이 위임장에 함께 기록됩니다.
          </p>
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={onBack} />
          <PrimaryBtn disabled={!hasSignature} onClick={confirm}>서명 완료 · 다음</PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}

// ─── 메인 플로우 ────────────────────────────────────────
// 순서: terms(1) → family(2) → deathcert(3) → ocr(4) → applicant(5+OTP)
//       → account_notice(6) → track(7) → platforms(8)
//       → /apply/service-info → /apply/documents (서명 + 결제)
type FlowStep =
  | 'terms' | 'family' | 'deathcert' | 'ocr' | 'applicant'
  | 'account_notice' | 'track' | 'platforms'

function ApplyFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    deceasedInfo, setDeceasedInfo,
    setCaseId, setStep, setDelegation, resetStore,
    selectedTrack, selectedServices, setSelectedTrack,
    caseId,
  } = useApplyStore()
  const supabase = createClient()
  const [flowStep, setFlowStep] = useState<FlowStep>('terms')
  const [delegatorName, setDelegatorName] = useState('')
  const [delegatorRelation, setDelegatorRelation] = useState('')
  const [delegatorPhone, setDelegatorPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [pendingCertFile, setPendingCertFile] = useState<File | null>(null)
  const [pendingAiResult, setPendingAiResult] = useState<{
    score?: number; authentic?: boolean; issues?: string[]
    licenseNumber?: string | null; hasSignature?: boolean; hospital?: string | null
  } | null>(null)

  useEffect(() => {
    const { caseId: existingId } = useApplyStore.getState()
    if (searchParams.get('reset') === 'true') { resetStore(); return }
    if (existingId) {
      supabase.from('cases').select('status').eq('id', existingId).single()
        .then(({ data }) => { if (!data || data.status !== 'draft') resetStore() })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Step 5 완료 시: cases + delegations 저장, 그 다음 account_notice로 이동
  const saveCaseInfo = async (name: string, relation: string, phone: string) => {
    setSaving(true)
    setSaveError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const existingCaseId = useApplyStore.getState().caseId

      const latestDeceased = useApplyStore.getState().deceasedInfo
      if (existingCaseId) {
        await supabase.from('cases').update({
          deceased_name: latestDeceased.name,
          deceased_birth: latestDeceased.birthDate,
          deceased_death: latestDeceased.deathDate,
          deceased_phone: latestDeceased.phone || null,
          delegator_phone: phone || null,
        }).eq('id', existingCaseId)
        await supabase.from('delegations').upsert({
          case_id: existingCaseId,
          delegator_name: name,
          delegator_relation: relation,
          delegator_phone: phone || null,
        }, { onConflict: 'case_id' })
      } else {
        const { data, error } = await supabase.from('cases').insert({
          user_id: user.id,
          deceased_name: latestDeceased.name,
          deceased_birth: latestDeceased.birthDate,
          deceased_death: latestDeceased.deathDate,
          deceased_phone: latestDeceased.phone || null,
          delegator_phone: phone || null,
          status: 'draft',
        }).select('id').single()
        if (error) throw error
        setCaseId(data.id)
        await supabase.from('delegations').upsert({
          case_id: data.id,
          delegator_name: name,
          delegator_relation: relation,
          delegator_phone: phone || null,
        }, { onConflict: 'case_id' })
      }

      setDelegation({ delegatorName: name, delegatorRelation: relation, signatureData: '' })
      setDelegatorName(name)
      setDelegatorRelation(relation)
      setDelegatorPhone(phone)

      // 사망진단서 Supabase 자동 업로드
      const currentCaseId = useApplyStore.getState().caseId
      if (pendingCertFile && currentCaseId) {
        const ext = pendingCertFile.name.split('.').pop() || 'pdf'
        const path = `cases/${currentCaseId}/death_cert_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('case-documents').upload(path, pendingCertFile, { upsert: true })
        if (!upErr) {
          await supabase.from('case_documents').upsert({
            case_id: currentCaseId, doc_type: 'death_cert', storage_path: path,
            file_name: pendingCertFile.name, file_size: pendingCertFile.size, mime_type: pendingCertFile.type,
            ai_score: pendingAiResult?.score ?? null,
            ai_authentic: pendingAiResult?.authentic ?? null,
            ai_issues: pendingAiResult?.issues ?? null,
            ai_license_number: pendingAiResult?.licenseNumber ?? null,
            ai_has_signature: pendingAiResult?.hasSignature ?? null,
            ai_hospital: pendingAiResult?.hospital ?? null,
          }, { onConflict: 'case_id,doc_type' })
        }
      }

      setFlowStep('account_notice')
    } catch (e) {
      console.error(e)
      setSaveError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  // Step 8 완료 시: case_services 저장 후 service-info로 이동
  const saveServicesAndNext = async () => {
    const currentCaseId = useApplyStore.getState().caseId
    if (selectedServices.length === 0 || !currentCaseId) return
    setSaving(true)
    setSaveError('')
    try {
      await supabase.from('case_services').delete().eq('case_id', currentCaseId)
      await supabase.from('case_services').insert(selectedServices.map(s => ({
        case_id: currentCaseId,
        service_id: s.id,
        service_name: s.name,
        service_category: s.track === 'delete' ? '계정삭제' : '추모계정',
        status: 'pending',
      })))
      setStep(1)
      router.push('/apply/service-info')
    } catch (e) {
      console.error(e)
      setSaveError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {flowStep === 'terms' && <StepTerms onNext={() => setFlowStep('family')} />}
      {flowStep === 'family' && (
        <StepFamilyCheck
          onYes={() => setFlowStep('deathcert')}
          onNo={() => router.push('/home')}
        />
      )}
      {flowStep === 'deathcert' && (
        <StepDeathCertCheck
          onYes={() => setFlowStep('ocr')}
          onNo={() => router.push('/home')}
          onBack={() => setFlowStep('family')}
        />
      )}
      {flowStep === 'ocr' && (
        <StepOcr
          setDeceasedInfo={setDeceasedInfo}
          onNext={(file, ai) => { setPendingCertFile(file); setPendingAiResult(ai); setFlowStep('applicant') }}
          onBack={() => setFlowStep('deathcert')}
        />
      )}
      {flowStep === 'applicant' && (
        <StepApplicant
          onNext={(name, relation, phone) => saveCaseInfo(name, relation, phone)}
          onBack={() => setFlowStep('ocr')}
        />
      )}
      {flowStep === 'account_notice' && (
        <StepAccountNotice
          onNext={() => setFlowStep('track')}
          onBack={() => setFlowStep('applicant')}
        />
      )}
      {flowStep === 'track' && (
        <StepTrack
          onSelect={(track) => { setSelectedTrack(track); setFlowStep('platforms') }}
          onBack={() => setFlowStep('account_notice')}
        />
      )}
      {flowStep === 'platforms' && (
        <StepPlatforms
          onNext={saveServicesAndNext}
          onBack={() => setFlowStep('track')}
          saving={saving}
        />
      )}

      {/* 저장 중 로딩 오버레이 */}
      {saving && flowStep === 'applicant' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.9)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #E5E9EF',
            borderTop: '3px solid #2563EB', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>저장 중...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* 에러 토스트 */}
      {saveError && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: '#EF4444', color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, zIndex: 200, whiteSpace: 'nowrap',
        }}>
          {saveError}
        </div>
      )}
    </>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div />}>
      <ApplyFlow />
    </Suspense>
  )
}
