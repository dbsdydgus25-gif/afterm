'use client'

import { useState, useEffect } from 'react'
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
  const { selectedServices, deceasedInfo, updateServiceField, setStep } = useApplyStore()

  const [svcIdx, setSvcIdx] = useState(0)
  const [fieldIdx, setFieldIdx] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

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
      {/* 진행 바: 서비스 정보 입력은 8단계 이후라 별도 표시 */}
      <div style={{ padding: '12px 24px 0', display: 'flex', gap: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: '#2563EB' }} />
        ))}
      </div>

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
