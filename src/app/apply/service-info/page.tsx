'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import Button from '@/components/ui/Button'

const SERVICE_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '👤', kakaotalk: '💬',
  google: '🔍', twitter: '🐦',
}
const SERVICE_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', kakaotalk: '#B8860B',
  google: '#4285F4', twitter: '#000',
}

export default function ServiceInfoPage() {
  const router = useRouter()
  const { selectedServices, updateServiceField, updateServiceAction, setStep } = useApplyStore()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const service = selectedServices[currentIdx]
  const isLast = currentIdx === selectedServices.length - 1

  if (!service) {
    router.push('/apply/services')
    return null
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    for (const field of service.fields) {
      if (field.required && !service.fieldValues?.[field.key]?.trim()) {
        newErrors[field.key] = `${field.label}을(를) 입력해주세요`
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    if (isLast) {
      setStep(2)
      router.push('/apply/documents')
    } else {
      setCurrentIdx(prev => prev + 1)
      setErrors({})
    }
  }

  const color = SERVICE_COLORS[service.id] || '#163272'
  const icon = SERVICE_ICONS[service.id] || '🔍'

  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      {/* 상단 진행 표시 */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {selectedServices.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= currentIdx ? color : '#E5E7EB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, fontWeight: 600 }}>
          {currentIdx + 1} / {selectedServices.length}
        </p>
      </div>

      {/* 서비스 헤더 */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: color + '15', border: `2px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 3px', fontWeight: 600 }}>서비스 정보 입력</p>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
              {service.name}
            </h2>
          </div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 처리 방식 선택 */}
        {service.actionOptions && service.actionOptions.length > 1 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              처리 방식을 선택해주세요
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {service.actionOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => updateServiceAction(service.id, opt)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                    fontSize: 14, fontWeight: 600,
                    border: service.selectedAction === opt ? `2px solid ${color}` : '2px solid #E5E7EB',
                    background: service.selectedAction === opt ? color + '08' : '#fff',
                    color: service.selectedAction === opt ? color : '#374151',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ marginRight: 8 }}>
                    {service.selectedAction === opt ? '✅' : '⬜️'}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 서비스별 입력 필드 */}
        {service.fields.map(field => (
          <div key={field.key}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={service.fieldValues?.[field.key] || ''}
              onChange={e => updateServiceField(service.id, field.key, e.target.value)}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: 12, fontSize: 15, fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                border: errors[field.key] ? '2px solid #EF4444' : '2px solid #E5E7EB',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = color }}
              onBlur={e => { e.target.style.borderColor = errors[field.key] ? '#EF4444' : '#E5E7EB' }}
            />
            {field.tip && !errors[field.key] && (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, fontWeight: 500 }}>
                💡 {field.tip}
              </p>
            )}
            {errors[field.key] && (
              <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}

        {/* 처리 기간 안내 */}
        <div style={{
          background: '#F9FAFB', borderRadius: 12, padding: '14px 16px',
          border: '1px solid #E5E7EB',
        }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            ⏱ 예상 처리 기간: <strong style={{ color: '#374151' }}>{service.processingDays}</strong><br />
            📨 {service.description}
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: '20px 24px', paddingBottom: 40 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="secondary"
            onClick={() => currentIdx > 0 ? setCurrentIdx(prev => prev - 1) : router.push('/apply/services')}
            style={{ width: 52, padding: 0, flexShrink: 0 }}
          >
            ←
          </Button>
          <Button block onClick={handleNext} style={{ flex: 1 }}>
            {isLast ? '서류 업로드로 →' : `다음: ${selectedServices[currentIdx + 1]?.name} →`}
          </Button>
        </div>
      </div>
    </div>
  )
}
