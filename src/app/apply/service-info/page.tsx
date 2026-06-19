'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { getTrackConfig } from '@/lib/services-catalog'
import { createClient } from '@/lib/supabase/client'
import { Screen, Body, Dock, PrimaryBtn, BackBtn, StepLabel, Question, ProgressBar } from '../_components'

const AUTO_FILL_KEYS = new Set([
  'requester_name', 'requester_email', 'deceased_name', 'deceased_profile_name',
  'deceased_death_date', 'deceased_phone', 'requester_country',
])

export default function ServiceInfoPage() {
  const router = useRouter()
  const supabase = createClient()
  const { selectedServices, deceasedInfo, updateServiceField, setStep, setDeceasedInfo } = useApplyStore()

  const [svcIdx, setSvcIdx] = useState(0)
  const [fieldIdx, setFieldIdx] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrDone, setOcrDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email || ''
      const name = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

      for (const svc of selectedServices) {
        const cfg = getTrackConfig(svc.id, svc.track)
        if (!cfg) continue
        for (const field of cfg.fields) {
          if (!AUTO_FILL_KEYS.has(field.key)) continue
          let val = ''
          if (field.key === 'requester_name') val = name
          else if (field.key === 'requester_email') val = email
          else if (field.key === 'deceased_name' || field.key === 'deceased_profile_name') val = deceasedInfo.name
          else if (field.key === 'deceased_death_date') val = deceasedInfo.deathDate
          else if (field.key === 'deceased_phone') val = deceasedInfo.phone
          else if (field.key === 'requester_country') val = '대한민국'
          if (val) updateServiceField(svc.id, field.key, val)
        }
      }
      setReady(true)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null
  if (selectedServices.length === 0) { router.push('/apply'); return null }

  const service = selectedServices[svcIdx]
  const cfg = service ? getTrackConfig(service.id, service.track) : null
  if (!service || !cfg) { router.push('/apply'); return null }

  const fields = cfg.fields.filter(f => !AUTO_FILL_KEYS.has(f.key))
  const currentField = fields[fieldIdx]
  const isLastField = fieldIdx === fields.length - 1
  const isLastService = svcIdx === selectedServices.length - 1
  const totalPlatforms = selectedServices.length
  const trackColor = service.track === 'memorial' ? '#2563EB' : '#DC2626'

  // 필드 없는 서비스 자동 스킵
  if (fields.length === 0) {
    if (isLastService) { setStep(2); router.push('/apply/documents') }
    else { setSvcIdx(i => i + 1); setFieldIdx(0) }
    return null
  }

  const goNext = () => {
    if (isLastField) {
      if (isLastService) { setStep(2); router.push('/apply/documents') }
      else {
        const nextSvc = selectedServices[svcIdx + 1]
        const nextCfg = getTrackConfig(nextSvc.id, nextSvc.track)
        const nextFields = (nextCfg?.fields || []).filter(f => !AUTO_FILL_KEYS.has(f.key))
        setSvcIdx(i => i + 1); setFieldIdx(0)
        setInputValue(nextSvc.fieldValues?.[nextFields[0]?.key] || ''); setError('')
      }
    } else {
      const nextField = fields[fieldIdx + 1]
      setFieldIdx(i => i + 1)
      setInputValue(service.fieldValues[nextField?.key] || ''); setError('')
    }
  }

  const goPrev = () => {
    if (fieldIdx > 0) {
      setFieldIdx(i => i - 1)
      setInputValue(service.fieldValues[fields[fieldIdx - 1]?.key] || ''); setError('')
    } else if (svcIdx > 0) {
      const prevSvc = selectedServices[svcIdx - 1]
      const prevCfg = getTrackConfig(prevSvc.id, prevSvc.track)
      const prevFields = (prevCfg?.fields || []).filter(f => !AUTO_FILL_KEYS.has(f.key))
      setSvcIdx(i => i - 1); setFieldIdx(prevFields.length - 1)
      setInputValue(prevSvc.fieldValues[prevFields[prevFields.length - 1]?.key] || ''); setError('')
    } else {
      router.push('/apply')
    }
  }

  const handleOcr = async (file: File) => {
    setOcrLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/ocr/death-certificate', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.name || data.deathDate) {
        if (data.name) setDeceasedInfo({ name: data.name })
        if (data.deathDate) setDeceasedInfo({ deathDate: data.deathDate })
        // 이미 auto-fill된 값 업데이트
        for (const svc of selectedServices) {
          const cfg2 = getTrackConfig(svc.id, svc.track)
          if (!cfg2) continue
          for (const field of cfg2.fields) {
            if (field.key === 'deceased_name' || field.key === 'deceased_profile_name') {
              if (data.name) updateServiceField(svc.id, field.key, data.name)
            }
            if (field.key === 'deceased_death_date') {
              if (data.deathDate) updateServiceField(svc.id, field.key, data.deathDate)
            }
          }
        }
        setOcrDone(true)
      } else {
        alert('사망진단서에서 정보를 찾지 못했습니다. 직접 입력해 주세요.')
      }
    } catch {
      alert('OCR 처리 중 오류가 발생했습니다. 직접 입력해 주세요.')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleNext = () => {
    if (!currentField) { goNext(); return }
    if (currentField.required && !inputValue.trim()) {
      setError('필수 항목이에요'); return
    }
    const saveValue = currentField.prefix
      ? currentField.prefix + inputValue.trim()
      : inputValue.trim()
    updateServiceField(service.id, currentField.key, saveValue)
    goNext()
  }

  return (
    <Screen>
      <Body>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: service.track === 'memorial' ? '#EFF6FF' : '#FEF2F2',
            color: trackColor,
          }}>
            {service.name} {service.track === 'memorial' ? '추모' : '삭제'}
          </span>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
            {svcIdx + 1}/{totalPlatforms}
          </span>
        </div>

        {/* 사망진단서 OCR 자동 입력 */}
        {svcIdx === 0 && fieldIdx === 0 && (
          <div style={{
            marginBottom: 20, borderRadius: 14, overflow: 'hidden',
            border: ocrDone ? '1.5px solid #10B981' : '1.5px solid #E5E9EF',
            background: ocrDone ? '#F0FDF4' : '#F8FAFC',
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleOcr(f)
                e.target.value = ''
              }}
            />
            {ocrDone ? (
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: 0 }}>사망진단서 인식 완료</p>
                  <p style={{ fontSize: 12, color: '#059669', margin: '2px 0 0' }}>고인 정보가 자동으로 입력되었습니다</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  다시 업로드
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                style={{
                  width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  background: 'none', border: 'none', cursor: ocrLoading ? 'default' : 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 24 }}>{ocrLoading ? '⏳' : '📄'}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>
                    {ocrLoading ? '사망진단서 분석 중...' : '사망진단서로 자동 입력'}
                  </p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                    {ocrLoading ? '잠시만 기다려 주세요' : '이미지 업로드 시 고인 정보가 자동으로 채워집니다'}
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        <StepLabel label="계정 정보 입력" />
        <Question
          label={currentField?.label || ''}
          sub={currentField?.tip}
        />

        {currentField?.type === 'select' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentField.options?.map(opt => (
              <button key={opt} onClick={() => setInputValue(opt)} style={{
                padding: '18px 20px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                border: `1.5px solid ${inputValue === opt ? trackColor : '#E5E9EF'}`,
                background: inputValue === opt
                  ? (service.track === 'memorial' ? '#EBF3FF' : '#FEF2F2') : '#F8FAFC',
                fontSize: 15, fontWeight: 600,
                color: inputValue === opt ? trackColor : '#374151',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline',
              borderBottom: `2px solid ${error ? '#EF4444' : trackColor}`,
            }}>
              {currentField?.prefix && (
                <span style={{
                  fontSize: 18, fontWeight: 700, color: '#9CA3AF',
                  whiteSpace: 'nowrap', paddingBottom: 10,
                  fontFamily: 'inherit',
                }}>
                  {currentField.prefix.replace('https://', '')}
                </span>
              )}
              <input
                key={`${svcIdx}-${fieldIdx}`}
                type={currentField?.type === 'url' ? 'text' : (currentField?.type || 'text')}
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder={currentField?.placeholder || ''}
                autoFocus
                style={{
                  flex: 1, padding: '0 0 10px', border: 'none',
                  fontSize: 20, fontWeight: 700, outline: 'none',
                  background: 'transparent', color: '#111827',
                  fontFamily: 'inherit', minWidth: 0,
                }}
              />
            </div>
            {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 8, fontWeight: 600 }}>{error}</p>}
          </div>
        )}

        {/* 마지막 필드에 주의사항 */}
        {cfg.warnings && fieldIdx === fields.length - 1 && cfg.warnings.length > 0 && (
          <div style={{
            marginTop: 24, background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 12, padding: '14px 16px',
          }}>
            {cfg.warnings.slice(0, 2).map((w, i) => (
              <p key={i} style={{ fontSize: 13, color: '#92400E', margin: i === 0 ? 0 : '6px 0 0', lineHeight: 1.6 }}>
                ⚠ {w}
              </p>
            ))}
          </div>
        )}
      </Body>

      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={goPrev} />
          <PrimaryBtn
            disabled={currentField?.type === 'select' ? !inputValue : false}
            onClick={handleNext}
          >
            {isLastField && isLastService ? '서류 업로드로 이동' : '계속하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}
