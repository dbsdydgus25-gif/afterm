'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { getTrackConfig } from '@/lib/services-catalog'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

// 로그인 사용자 정보 또는 store 에서 자동 입력할 키 목록
const AUTO_FILL_KEYS = new Set([
  'requester_name',
  'requester_email',
  'deceased_name',
  'deceased_profile_name',
  'deceased_death_date',
  'deceased_phone',
  'requester_country',
])

export default function ServiceInfoPage() {
  const router = useRouter()
  const supabase = createClient()
  const { selectedServices, deceasedInfo, updateServiceField, setStep } = useApplyStore()

  const [svcIdx, setSvcIdx] = useState(0)
  const [fieldIdx, setFieldIdx] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [ready, setReady] = useState(false)

  // 로그인 사용자 정보 로드 + 자동 입력값 pre-populate
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email || ''
      const name = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
      setUserEmail(email)
      setUserName(name)

      // 모든 서비스의 자동 입력 필드를 미리 채워둠
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
  if (selectedServices.length === 0) { router.push('/apply/services'); return null }

  const service = selectedServices[svcIdx]
  const cfg = service ? getTrackConfig(service.id, service.track) : null
  if (!service || !cfg) { router.push('/apply/services'); return null }

  // 자동 입력 필드 제외한 표시 필드만
  const fields = cfg.fields.filter(f => !AUTO_FILL_KEYS.has(f.key))
  const currentField = fields[fieldIdx]
  const isLastField = fieldIdx === fields.length - 1
  const isLastService = svcIdx === selectedServices.length - 1
  const totalPlatforms = selectedServices.length

  // 진행 바 계산
  const totalFields = selectedServices.reduce((acc, s) => {
    const c = getTrackConfig(s.id, s.track)
    const visible = (c?.fields || []).filter(f => !AUTO_FILL_KEYS.has(f.key))
    return acc + visible.length
  }, 0)
  const doneFields = selectedServices.slice(0, svcIdx).reduce((acc, s) => {
    const c = getTrackConfig(s.id, s.track)
    const visible = (c?.fields || []).filter(f => !AUTO_FILL_KEYS.has(f.key))
    return acc + visible.length
  }, 0) + fieldIdx

  const trackColor = service.track === 'memorial' ? '#2563EB' : '#DC2626'

  const goNext = () => {
    if (isLastField) {
      if (isLastService) {
        setStep(2)
        router.push('/apply/documents')
      } else {
        const nextSvc = selectedServices[svcIdx + 1]
        const nextCfg = getTrackConfig(nextSvc.id, nextSvc.track)
        const nextFields = (nextCfg?.fields || []).filter(f => !AUTO_FILL_KEYS.has(f.key))
        setSvcIdx(i => i + 1)
        setFieldIdx(0)
        setInputValue(nextSvc.fieldValues?.[nextFields[0]?.key] || '')
        setError('')
      }
    } else {
      const nextField = fields[fieldIdx + 1]
      setFieldIdx(i => i + 1)
      setInputValue(service.fieldValues[nextField?.key] || '')
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
      const prevFields = (prevCfg?.fields || []).filter(f => !AUTO_FILL_KEYS.has(f.key))
      setSvcIdx(i => i - 1)
      setFieldIdx(prevFields.length - 1)
      setInputValue(prevSvc.fieldValues[prevFields[prevFields.length - 1]?.key] || '')
      setError('')
    } else {
      router.push('/apply/services')
    }
  }

  const handleNext = () => {
    if (!currentField) { goNext(); return }
    if (currentField.required && !inputValue.trim()) {
      setError('필수 항목이에요')
      return
    }
    const saveValue = currentField.prefix
      ? currentField.prefix + inputValue.trim()
      : inputValue.trim()
    updateServiceField(service.id, currentField.key, saveValue)
    goNext()
  }

  const handleSkip = () => {
    if (currentField) updateServiceField(service.id, currentField.key, '')
    goNext()
  }

  // 필드가 하나도 없는 서비스면 바로 다음으로
  if (fields.length === 0) {
    if (isLastService) {
      setStep(2)
      router.push('/apply/documents')
    } else {
      setSvcIdx(i => i + 1)
      setFieldIdx(0)
    }
    return null
  }

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 서비스 헤더 */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: service.track === 'memorial' ? '#EFF6FF' : '#FEF2F2',
          color: trackColor,
        }}>
          {service.name} {service.track === 'memorial' ? '추모' : '삭제'}
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
              <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: `2px solid ${error ? '#DC2626' : trackColor}` }}>
                {currentField?.prefix && (
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap', paddingBottom: 14, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
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
                    flex: 1, padding: '0 0 14px',
                    border: 'none',
                    fontSize: 22, fontWeight: 700, outline: 'none',
                    background: 'transparent', color: '#111',
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                    minWidth: 0,
                  }}
                />
              </div>
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
          <button
            onClick={goPrev}
            style={{ padding: '18px 20px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#374151', flexShrink: 0 }}
          >
            ←
          </button>
          <Button block onClick={handleNext}>
            {isLastField && isLastService ? '서류 업로드로 →' : '다음 →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
