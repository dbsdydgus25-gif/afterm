'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

// 신청 플로우 Step 0: 고인 기본 정보
// 한 번에 한 질문씩 — TypeForm 스타일

type Field = 'name' | 'birth' | 'death' | 'phone'

const FIELDS: { key: Field; question: string; sub: string; placeholder: string; type: string; inputMode?: string }[] = [
  {
    key: 'name',
    question: '고인의 성함을\n알려주세요',
    sub: '기업 CS 접수에 사용됩니다',
    placeholder: '홍길동',
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
    sub: '모르셔도 건너뛸 수 있어요',
    placeholder: '010-0000-0000',
    type: 'tel',
    inputMode: 'tel',
  },
]

export default function ApplyPage() {
  const router = useRouter()
  const { deceasedInfo, setDeceasedInfo, setCaseId, setStep } = useApplyStore()
  const supabase = createClient()

  const [currentField, setCurrentField] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exiting, setExiting] = useState(false)

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
      // 슬라이드 애니메이션
      setExiting(true)
      setTimeout(() => {
        setCurrentField(prev => prev + 1)
        setExiting(false)
      }, 200)
      return
    }

    // 마지막 필드 → DB 저장 후 다음 페이지
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
    setExiting(true)
    setTimeout(() => {
      setCurrentField(prev => prev - 1)
      setExiting(false)
    }, 200)
  }

  return (
    <div style={{ minHeight: 'calc(100dvh - 59px)', display: 'flex', flexDirection: 'column' }}>
      {/* 질문 영역 */}
      <div style={{
        flex: 1, padding: '48px 28px 24px',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
      }}>
        {/* 진행 인디케이터 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
          {FIELDS.map((_, i) => (
            <div key={i} style={{
              height: '4px', flex: 1, borderRadius: '100px',
              background: i <= currentField ? '#3B6FE8' : '#E2E8F0',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* 질문 텍스트 */}
        <h2 style={{
          fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em',
          color: '#1A1A2E', marginBottom: '10px', lineHeight: 1.25,
          whiteSpace: 'pre-line',
        }}>
          {field.question}
        </h2>
        <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '40px', fontWeight: 400 }}>
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
              style={{
                width: '100%', height: '60px', padding: '0 0',
                border: 'none', borderBottom: `2.5px solid ${error ? '#EF4444' : '#3B6FE8'}`,
                fontSize: '22px', fontWeight: 700, fontFamily: 'inherit',
                color: value ? '#1A1A2E' : '#9AA3B2',
                background: 'transparent', outline: 'none',
                letterSpacing: '-0.01em',
              }}
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
              style={{
                width: '100%', height: '60px', padding: '0 0',
                border: 'none', borderBottom: `2.5px solid ${error ? '#EF4444' : '#3B6FE8'}`,
                fontSize: '24px', fontWeight: 700, fontFamily: 'inherit',
                color: '#1A1A2E', background: 'transparent', outline: 'none',
                letterSpacing: '-0.02em',
              }}
            />
          )}

          {/* 오류 */}
          {error && (
            <p style={{ fontSize: '13px', color: '#EF4444', marginTop: '8px', fontWeight: 500 }}>
              {error}
            </p>
          )}

          {/* 휴대폰은 건너뛰기 옵션 */}
          {field.key === 'phone' && (
            <button
              onClick={goNext}
              style={{
                marginTop: '16px', background: 'none', border: 'none',
                color: '#9AA3B2', fontSize: '14px', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 500, padding: 0,
                textDecoration: 'underline',
              }}
            >
              모르면 건너뛰기
            </button>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div style={{
        padding: '16px 24px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        background: '#fff', borderTop: '1px solid #F0F2F5',
        display: 'flex', gap: '12px',
      }}>
        {currentField > 0 && (
          <button
            onClick={goPrev}
            style={{
              width: '52px', height: '52px', borderRadius: '12px',
              border: '1.5px solid #E2E8F0', background: '#fff',
              fontSize: '18px', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>
        )}
        <button
          onClick={goNext}
          disabled={loading}
          style={{
            flex: 1, height: '52px', borderRadius: '12px', border: 'none',
            background: loading ? '#9AA3B2' : '#1A1A2E',
            color: '#fff', fontSize: '16px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s',
          }}
        >
          {loading ? '저장 중...' : isLast ? '다음 단계 →' : '계속하기 →'}
        </button>
      </div>
    </div>
  )
}
