'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { getTrackConfig } from '@/lib/services-catalog'
import Button from '@/components/ui/Button'

type Phase = 'precheck' | 'fields'

export default function ServiceInfoPage() {
  const router = useRouter()
  const { selectedServices, updateServiceField, setStep } = useApplyStore()

  const [phase, setPhase] = useState<Phase>('precheck')
  // 현재 서비스 인덱스, 현재 필드 인덱스
  const [svcIdx, setSvcIdx] = useState(0)
  const [fieldIdx, setFieldIdx] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  if (selectedServices.length === 0) { router.push('/apply/services'); return null }

  const service = selectedServices[svcIdx]
  const cfg = service ? getTrackConfig(service.id, service.track) : null

  if (!service || !cfg) { router.push('/apply/services'); return null }

  const fields = cfg.fields
  const currentField = fields[fieldIdx]
  const isLastField = fieldIdx === fields.length - 1
  const isLastService = svcIdx === selectedServices.length - 1
  const totalPlatforms = selectedServices.length

  // 전체 필드 수 계산 (진행 바용)
  const totalFields = selectedServices.reduce((acc, s) => {
    const c = getTrackConfig(s.id, s.track)
    return acc + (c?.fields.length || 0)
  }, 0)
  const doneFields = selectedServices.slice(0, svcIdx).reduce((acc, s) => {
    const c = getTrackConfig(s.id, s.track)
    return acc + (c?.fields.length || 0)
  }, 0) + fieldIdx

  const trackColor = service.track === 'memorial' ? '#2563EB' : '#DC2626'

  // 다음 필드 또는 다음 서비스로 이동
  const goNext = () => {
    if (isLastField) {
      if (isLastService) {
        setStep(2)
        router.push('/apply/documents')
      } else {
        setSvcIdx(i => i + 1)
        setFieldIdx(0)
        setInputValue(selectedServices[svcIdx + 1]?.fieldValues?.[getTrackConfig(selectedServices[svcIdx + 1].id, selectedServices[svcIdx + 1].track)?.fields?.[0]?.key || ''] || '')
        setError('')
      }
    } else {
      setFieldIdx(i => i + 1)
      setInputValue(service.fieldValues[fields[fieldIdx + 1]?.key] || '')
      setError('')
    }
  }

  const goPrev = () => {
    if (fieldIdx > 0) {
      setFieldIdx(i => i - 1)
      setInputValue(service.fieldValues[fields[fieldIdx - 1]?.key] || '')
      setError('')
    } else if (svcIdx > 0) {
      const prevSvc = selectedServices[svcIdx - 1]
      const prevCfg = getTrackConfig(prevSvc.id, prevSvc.track)
      const prevFields = prevCfg?.fields || []
      setSvcIdx(i => i - 1)
      setFieldIdx(prevFields.length - 1)
      setInputValue(prevSvc.fieldValues[prevFields[prevFields.length - 1]?.key] || '')
      setError('')
    }
  }

  const handleNext = () => {
    if (currentField?.required && !inputValue.trim()) {
      setError('필수 항목이에요')
      return
    }
    if (currentField) {
      updateServiceField(service.id, currentField.key, inputValue.trim())
    }
    goNext()
  }

  const handleSkip = () => {
    if (currentField) {
      updateServiceField(service.id, currentField.key, '')
    }
    goNext()
  }

  // ── Phase 1: 사전 확인 ──
  if (phase === 'precheck') {
    return (
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 24, textAlign: 'center' }}>🔍</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.4, textAlign: 'center' }}>
          계정 정보를<br />알고 계신가요?
        </h2>
        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.8, textAlign: 'center', margin: '0 0 12px' }}>
          에프텀 서비스 진행을 위해서는<br />
          <strong style={{ color: '#111' }}>고인의 계정 닉네임 또는 URL</strong>이<br />
          반드시 필요해요.
        </p>

        {/* 선택된 플랫폼 목록 */}
        <div style={{ background: '#F9FAFB', borderRadius: 14, padding: '16px 20px', margin: '20px 0 32px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', margin: '0 0 10px', letterSpacing: '0.05em' }}>
            신청하실 서비스
          </p>
          {selectedServices.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: s.track === 'memorial' ? '#2563EB' : '#DC2626', fontWeight: 700 }}>
                {s.track === 'memorial' ? '🕯️ 추모' : '🗑️ 삭제'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => {
              setInputValue(service.fieldValues[currentField?.key || ''] || '')
              setPhase('fields')
            }}
            style={{
              padding: '18px', borderRadius: 14, border: 'none',
              background: '#163272', color: '#fff',
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
            }}
          >
            네, 알고 있어요 →
          </button>
          <button
            onClick={() => router.push('/apply/documents')}
            style={{
              padding: '16px', borderRadius: 14,
              border: '1.5px solid #E5E7EB', background: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#6B7280',
            }}
          >
            잘 모르겠어요 (나중에 입력)
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          모르셔도 진행 가능하지만,<br />계정 확인이 어려울 경우 처리가 지연될 수 있어요
        </p>
      </div>
    )
  }

  // ── Phase 2: 툭툭 필드 입력 ──
  const progressPct = totalFields > 0 ? Math.round((doneFields / totalFields) * 100) : 0

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 진행 바 */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width 0.4s',
            width: `${progressPct}%`,
            background: trackColor,
          }} />
        </div>
      </div>

      {/* 서비스 헤더 */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: service.track === 'memorial' ? '#EFF6FF' : '#FEF2F2', color: trackColor }}>
          {service.name} {service.track === 'memorial' ? '🕯️ 추모' : '🗑️ 삭제'}
        </span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{svcIdx + 1}/{totalPlatforms}</span>
      </div>

      {/* 질문 */}
      <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontSize: 26, fontWeight: 900, color: '#111',
            margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.4,
          }}>
            {currentField?.label}
          </h2>
          {currentField?.tip && (
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 32px', lineHeight: 1.6 }}>
              {currentField.tip}
            </p>
          )}
          {!currentField?.tip && <div style={{ marginBottom: 32 }} />}

          {/* 입력 */}
          {currentField?.type === 'select' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentField.options?.map(opt => (
                <button
                  key={opt}
                  onClick={() => setInputValue(opt)}
                  style={{
                    padding: '16px 20px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                    border: `2px solid ${inputValue === opt ? trackColor : '#E5E7EB'}`,
                    background: inputValue === opt ? (service.track === 'memorial' ? '#EFF6FF' : '#FEF2F2') : '#fff',
                    fontSize: 15, fontWeight: 600,
                    color: inputValue === opt ? trackColor : '#374151',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <input
                type={currentField?.type || 'text'}
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder={currentField?.placeholder || ''}
                autoFocus
                style={{
                  width: '100%', padding: '0 0 14px',
                  border: 'none', borderBottom: `2px solid ${error ? '#DC2626' : trackColor}`,
                  fontSize: 22, fontWeight: 700, outline: 'none',
                  background: 'transparent', color: '#111',
                  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  boxSizing: 'border-box',
                }}
              />
              {error && <p style={{ fontSize: 13, color: '#DC2626', marginTop: 8 }}>{error}</p>}
            </div>
          )}
        </div>

        {/* 주의사항 */}
        {cfg.warnings && fieldIdx === fields.length - 1 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            {cfg.warnings.slice(0, 2).map((w, i) => (
              <p key={i} style={{ fontSize: 12, color: '#92400E', margin: i === 0 ? 0 : '4px 0 0', lineHeight: 1.5 }}>⚠️ {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="cta-dock" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {(fieldIdx > 0 || svcIdx > 0) && (
            <button
              onClick={goPrev}
              style={{ padding: '18px 20px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#374151', flexShrink: 0 }}
            >
              ←
            </button>
          )}
          <Button block onClick={handleNext}>
            {isLastField && isLastService ? '서류 업로드로 →' : '다음 →'}
          </Button>
        </div>
        {!currentField?.required && (
          <button
            onClick={handleSkip}
            style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', fontSize: 14, color: '#9CA3AF', cursor: 'pointer', fontWeight: 600 }}
          >
            모르겠어요, 건너뛸게요
          </button>
        )}
      </div>
    </div>
  )
}
