'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { getTrackConfig } from '@/lib/services-catalog'
import Button from '@/components/ui/Button'

export default function ServiceInfoPage() {
  const router = useRouter()
  const { selectedServices, updateServiceField, setStep } = useApplyStore()
  const [svcIdx, setSvcIdx] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const service = selectedServices[svcIdx]
  if (!service) { router.push('/apply/services'); return null }

  const track = service.track
  const cfg = getTrackConfig(service.id, track)
  if (!cfg) { router.push('/apply/services'); return null }

  const isLastService = svcIdx === selectedServices.length - 1
  const totalServices = selectedServices.length

  const validate = () => {
    const errs: Record<string, string> = {}
    for (const field of cfg.fields) {
      if (field.required && !service.fieldValues[field.key]?.trim()) {
        errs[field.key] = `${field.label}을(를) 입력해주세요`
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    if (!isLastService) {
      setSvcIdx(i => i + 1)
      setErrors({})
    } else {
      setStep(2)
      router.push('/apply/documents')
    }
  }

  const trackColor = track === 'delete' ? '#DC2626' : '#2563EB'
  const trackBg = track === 'delete' ? '#FFF5F5' : '#EFF6FF'
  const trackBorder = track === 'delete' ? '#FECACA' : '#BFDBFE'
  const trackLabel = track === 'delete' ? '🗑️ 계정 삭제' : '🕯️ 추모 계정 전환'

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 진행 바 */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>
            {svcIdx + 1} / {totalServices}
          </span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>정보 입력</span>
        </div>
        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${((svcIdx + 1) / totalServices) * 100}%`, background: trackColor, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* 헤더 */}
      <div style={{ padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: trackBg, color: trackColor, border: `1px solid ${trackBorder}` }}>
            {trackLabel}
          </span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {service.name} 정보 입력
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
          신청에 필요한 정보를 입력해주세요
        </p>
      </div>

      {/* 대행 가능 여부 안내 */}
      <div style={{ padding: '0 24px 16px' }}>
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: cfg.agentCanHandle ? '#ECFDF5' : '#FFFBEB',
          border: `1px solid ${cfg.agentCanHandle ? '#A7F3D0' : '#FDE68A'}`,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.agentCanHandle ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cfg.agentCanHandle ? '#065F46' : '#92400E', marginBottom: 2 }}>
              {cfg.agentCanHandle ? '에프텀 대행 가능' : '직접 신청 필요'}
            </div>
            <div style={{ fontSize: 12, color: cfg.agentCanHandle ? '#047857' : '#78350F', lineHeight: 1.5 }}>
              {cfg.agentCanHandleNote}
            </div>
          </div>
        </div>
      </div>

      {/* 필드 입력 */}
      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cfg.fields.map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                {field.label}
                {field.required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  value={service.fieldValues[field.key] || ''}
                  onChange={e => { updateServiceField(service.id, field.key, e.target.value); setErrors(p => ({ ...p, [field.key]: '' })) }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10,
                    border: `1.5px solid ${errors[field.key] ? '#DC2626' : '#E5E7EB'}`,
                    fontSize: 14, outline: 'none', background: '#fff',
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  }}
                >
                  <option value="">선택해주세요</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={service.fieldValues[field.key] || ''}
                  onChange={e => { updateServiceField(service.id, field.key, e.target.value); setErrors(p => ({ ...p, [field.key]: '' })) }}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10,
                    border: `1.5px solid ${errors[field.key] ? '#DC2626' : '#E5E7EB'}`,
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  }}
                />
              )}

              {field.tip && !errors[field.key] && (
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>{field.tip}</p>
              )}
              {errors[field.key] && (
                <p style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0' }}>{errors[field.key]}</p>
              )}
            </div>
          ))}

          {cfg.warnings && cfg.warnings.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: '0 0 6px' }}>⚠️ 주의사항</p>
              {cfg.warnings.map((w, i) => (
                <p key={i} style={{ fontSize: 12, color: '#78350F', margin: i === 0 ? 0 : '4px 0 0', lineHeight: 1.5 }}>• {w}</p>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: 100 }} />
      </div>

      {/* 하단 버튼 */}
      <div className="cta-dock" style={{ display: 'flex', gap: 10 }}>
        {svcIdx > 0 && (
          <button
            onClick={() => { setSvcIdx(i => i - 1); setErrors({}) }}
            style={{ padding: '18px 20px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#374151' }}
          >
            이전
          </button>
        )}
        <Button block onClick={handleNext}>
          {isLastService ? '서류 업로드로 →' : `다음 (${svcIdx + 1}/${totalServices})`}
        </Button>
      </div>
    </div>
  )
}
