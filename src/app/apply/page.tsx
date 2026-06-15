'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Suspense } from 'react'

// 신청 플로우 Step 0: 고인 기본 정보 (Toss UX: 1 Question 1 Screen)
type Field = 'name' | 'birth' | 'death' | 'phone'

const FIELDS: { key: Field; question: string; sub: string; placeholder: string; type: string; inputMode?: string }[] = [
  {
    key: 'name',
    question: '고인의 성함을\n알려주세요',
    sub: '기업 CS 접수에 사용됩니다',
    placeholder: '예: 홍길동',
    type: 'text',
  },
  {
    key: 'birth',
    question: '고인의 생년월일은\n언제인가요?',
    sub: '계정 조회 및 서류 작성에 사용됩니다',
    placeholder: '',
    type: 'date',
  },
  {
    key: 'death',
    question: '사망일은\n언제인가요?',
    sub: '사망진단서의 사망일과 일치해야 합니다',
    placeholder: '',
    type: 'date',
  },
  {
    key: 'phone',
    question: '고인의 휴대폰 번호를\n알고 계신가요?',
    sub: '카카오톡 계정 확인에 필요해요',
    placeholder: '010-0000-0000',
    type: 'tel',
    inputMode: 'tel',
  },
]

function ApplyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { deceasedInfo, setDeceasedInfo, setCaseId, setStep, resetStore } = useApplyStore()
  const supabase = createClient()

  const [currentField, setCurrentField] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // ?reset=true 또는 이전 케이스가 draft가 아니면 초기화 (새 신청)
    const { caseId } = useApplyStore.getState()
    if (searchParams.get('reset') === 'true') {
      resetStore()
      return
    }
    // draft가 아닌 케이스(submitted/processing 등)가 남아있으면 새 신청으로 간주 초기화
    if (caseId) {
      supabase.from('cases').select('status').eq('id', caseId).single()
        .then(({ data }) => {
          if (!data || data.status !== 'draft') {
            resetStore()
          }
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const field = FIELDS[currentField]
  const isLast = currentField === FIELDS.length - 1
  const value = currentField === 0 ? deceasedInfo.name
    : currentField === 1 ? deceasedInfo.birthDate
    : currentField === 2 ? deceasedInfo.deathDate
    : deceasedInfo.phone

  const handleChange = (v: string) => {
    setError('')
    if (field.key === 'name') setDeceasedInfo({ name: v })
    else if (field.key === 'birth') setDeceasedInfo({ birthDate: v })
    else if (field.key === 'death') setDeceasedInfo({ deathDate: v })
    else setDeceasedInfo({ phone: v })
  }

  const validate = () => {
    if (field.key === 'name' && !deceasedInfo.name.trim()) {
      setError('고인의 성함을 입력해 주세요')
      return false
    }
    if (field.key === 'birth' && !deceasedInfo.birthDate) {
      setError('생년월일을 선택해 주세요')
      return false
    }
    if (field.key === 'death' && !deceasedInfo.deathDate) {
      setError('사망일을 선택해 주세요')
      return false
    }
    return true
  }

  const goNext = async () => {
    if (!validate()) return

    if (!isLast) {
      setCurrentField(prev => prev + 1)
      return
    }

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
        }).eq('id', existingCaseId)
      } else {
        const { data, error: err } = await supabase.from('cases').insert({
          user_id: user.id,
          deceased_name: deceasedInfo.name,
          deceased_birth: deceasedInfo.birthDate,
          deceased_death: deceasedInfo.deathDate,
          deceased_phone: deceasedInfo.phone || null,
          status: 'draft',
        }).select('id').single()
        if (err) throw err
        setCaseId(data.id)
      }

      setStep(1)
      router.push('/apply/services')
    } catch {
      setError('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const goPrev = () => {
    if (currentField === 0) return
    setCurrentField(prev => prev - 1)
  }

  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* 질문 영역 */}
      <div key={field.key} className="animate-slide-up" style={{ flex: 1, padding: '32px 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em',
          color: 'var(--color-label-strong)', marginBottom: '8px', lineHeight: 1.3,
          whiteSpace: 'pre-line',
        }}>
          {field.question}
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '40px' }}>
          {field.sub}
        </p>

        {/* 입력 필드 */}
        <div>
          {field.type === 'date' ? (
            <input
              type="date"
              value={value}
              onChange={e => handleChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="input"
              style={{ padding: 0 }}
            />
          ) : (
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={e => handleChange(e.target.value)}
              autoFocus
              inputMode={field.inputMode as any}
              onKeyDown={e => e.key === 'Enter' && goNext()}
              className="input"
              style={{ padding: 0 }}
            />
          )}

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--color-status-negative)', marginTop: '8px', fontWeight: 600 }}>
              {error}
            </p>
          )}

        </div>
      </div>

      <div className="cta-dock" style={{ display: 'flex', gap: '12px' }}>
        {currentField > 0 && (
          <Button variant="secondary" onClick={goPrev} style={{ width: '56px', padding: 0 }}>
            ←
          </Button>
        )}
        <Button block disabled={loading} onClick={goNext} style={{ flex: 1 }}>
          {loading ? '저장 중...' : isLast ? '다음 단계' : '계속하기'}
        </Button>
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
