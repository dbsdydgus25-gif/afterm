'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import Button from '@/components/ui/Button'

// 서비스별 질문 스텝 구성
// 처리 방식 → 각 필드 순서대로 한 화면씩

export default function ServiceInfoPage() {
  const router = useRouter()
  const { selectedServices, updateServiceField, updateServiceAction, setStep } = useApplyStore()

  // 서비스 인덱스 + 해당 서비스 내 스텝 인덱스
  const [svcIdx, setSvcIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [error, setError] = useState('')

  const service = selectedServices[svcIdx]
  if (!service) {
    router.push('/apply/services')
    return null
  }

  // 현재 서비스의 스텝 목록 구성
  // 처리 방식이 2개 이상이면 첫 스텝으로 추가
  type Step =
    | { type: 'action' }
    | { type: 'field'; fieldIdx: number }

  const steps: Step[] = []
  if (service.actionOptions?.length > 1) {
    steps.push({ type: 'action' })
  }
  service.fields.forEach((_, i) => steps.push({ type: 'field', fieldIdx: i }))

  const currentStep = steps[stepIdx]
  const isLastStep = stepIdx === steps.length - 1
  const isLastService = svcIdx === selectedServices.length - 1

  // 전체 진행 상태 계산 (서비스별 스텝 수 합산)
  const totalSteps = selectedServices.reduce((acc, svc) => {
    let n = svc.fields.length
    if (svc.actionOptions?.length > 1) n++
    return acc + n
  }, 0)
  const doneSteps = selectedServices.slice(0, svcIdx).reduce((acc, svc) => {
    let n = svc.fields.length
    if (svc.actionOptions?.length > 1) n++
    return acc + n
  }, 0) + stepIdx

  const validate = (): boolean => {
    if (!currentStep) return true
    if (currentStep.type === 'action') {
      if (!service.selectedAction) {
        setError('처리 방식을 선택해주세요')
        return false
      }
    } else {
      const field = service.fields[currentStep.fieldIdx]
      if (!service.fieldValues?.[field.key]?.trim()) {
        setError(`${field.label}을(를) 입력해주세요`)
        return false
      }
    }
    return true
  }

  const goNext = () => {
    if (!validate()) return
    setError('')

    if (!isLastStep) {
      setStepIdx(prev => prev + 1)
      return
    }

    // 현재 서비스 완료
    if (!isLastService) {
      setSvcIdx(prev => prev + 1)
      setStepIdx(0)
      return
    }

    // 모든 서비스 완료 → 서류 업로드
    setStep(2)
    router.push('/apply/documents')
  }

  const goBack = () => {
    setError('')
    if (stepIdx > 0) {
      setStepIdx(prev => prev - 1)
      return
    }
    if (svcIdx > 0) {
      const prevSvc = selectedServices[svcIdx - 1]
      let prevStepCount = prevSvc.fields.length
      if (prevSvc.actionOptions?.length > 1) prevStepCount++
      setSvcIdx(prev => prev - 1)
      setStepIdx(prevStepCount - 1)
      return
    }
    router.push('/apply/services')
  }

  // 현재 필드
  const currentField = currentStep?.type === 'field'
    ? service.fields[currentStep.fieldIdx]
    : null

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 상단 진행 바 + 뒤로 (layout.tsx의 헤더 위에 오버라이드) */}
      <div style={{ padding: '0 24px', flexShrink: 0 }}>
        {/* 서비스별 세그먼트 진행 바 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 0 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < doneSteps ? 'var(--color-primary-normal)'
                : i === doneSteps ? 'var(--color-primary-normal)'
                : 'var(--color-line-solid-normal)',
              opacity: i < doneSteps ? 0.4 : 1,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* 질문 영역 */}
      <div
        key={`${svcIdx}-${stepIdx}`}
        className="animate-slide-up"
        style={{ flex: 1, padding: '32px 24px' }}
      >

        {/* ── 처리 방식 선택 스텝 ── */}
        {currentStep?.type === 'action' && (
          <>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--color-label-strong)', marginBottom: 8, lineHeight: 1.3,
            }}>
              {service.name}<br />처리 방식을<br />선택해주세요
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-label-alternative)', marginBottom: 40 }}>
              고인의 계정을 어떻게 처리할지 알려주세요
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {service.actionOptions.map(opt => {
                const isSelected = service.selectedAction === opt
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      updateServiceAction(service.id, opt)
                      setError('')
                    }}
                    style={{
                      width: '100%', padding: '18px 20px',
                      borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 16, fontWeight: isSelected ? 700 : 500,
                      border: isSelected
                        ? '2px solid var(--color-primary-normal)'
                        : '2px solid var(--color-line-solid-normal)',
                      background: isSelected ? '#EFF6FF' : '#FAFAFA',
                      color: isSelected ? 'var(--color-primary-normal)' : 'var(--color-label-normal)',
                      transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: isSelected
                        ? '2px solid var(--color-primary-normal)'
                        : '2px solid #D1D5DB',
                      background: isSelected ? 'var(--color-primary-normal)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#fff', display: 'block',
                        }} />
                      )}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--color-status-negative)', marginTop: 12, fontWeight: 600 }}>
                {error}
              </p>
            )}
          </>
        )}

        {/* ── 필드 입력 스텝 ── */}
        {currentStep?.type === 'field' && currentField && (
          <>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--color-label-strong)', marginBottom: 8, lineHeight: 1.3,
            }}>
              {service.name}의<br />{currentField.label}을<br />알려주세요
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-label-alternative)', marginBottom: 40 }}>
              {currentField.tip || '정확히 입력해주세요'}
            </p>

            <input
              key={`${svcIdx}-${stepIdx}-input`}
              type={currentField.type === 'select' ? 'text' : currentField.type}
              placeholder={currentField.placeholder}
              value={service.fieldValues?.[currentField.key] || ''}
              onChange={e => {
                updateServiceField(service.id, currentField.key, e.target.value)
                setError('')
              }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && goNext()}
              className="input"
              style={{ padding: 0 }}
            />

            {error && (
              <p style={{ fontSize: 13, color: 'var(--color-status-negative)', marginTop: 8, fontWeight: 600 }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="cta-dock" style={{ display: 'flex', gap: 12 }}>
        <Button
          variant="secondary"
          onClick={goBack}
          style={{ width: 56, padding: 0, flexShrink: 0 }}
        >
          ←
        </Button>
        <Button block onClick={goNext} style={{ flex: 1 }}>
          {isLastStep && isLastService ? '서류 업로드로 →' : '계속하기'}
        </Button>
      </div>
    </div>
  )
}
