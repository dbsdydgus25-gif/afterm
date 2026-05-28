'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

// Step 0: 고인 기본 정보 입력
export default function ApplyPage() {
  const router = useRouter()
  const { deceasedInfo, setDeceasedInfo, setCaseId, setStep } = useApplyStore()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!deceasedInfo.name || !deceasedInfo.birthDate || !deceasedInfo.deathDate) {
      setError('필수 정보를 모두 입력해 주세요')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // DB에 신청건(draft) 생성 또는 기존 caseId 재사용
      const existingCaseId = useApplyStore.getState().caseId
      if (existingCaseId) {
        // 기존 케이스 업데이트
        const { error: updateErr } = await supabase
          .from('cases')
          .update({
            deceased_name: deceasedInfo.name,
            deceased_birth: deceasedInfo.birthDate,
            deceased_death: deceasedInfo.deathDate,
            deceased_phone: deceasedInfo.phone || null,
          })
          .eq('id', existingCaseId)
        if (updateErr) throw updateErr
      } else {
        // 새 케이스 생성
        const { data, error: insertErr } = await supabase
          .from('cases')
          .insert({
            user_id: user.id,
            deceased_name: deceasedInfo.name,
            deceased_birth: deceasedInfo.birthDate,
            deceased_death: deceasedInfo.deathDate,
            deceased_phone: deceasedInfo.phone || null,
            status: 'draft',
          })
          .select('id')
          .single()
        if (insertErr) throw insertErr
        setCaseId(data.id)
      }

      setStep(1)
      router.push('/apply/services')
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ padding: '32px 24px 16px' }}>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>고인 기본 정보</h1>
        <p className="section-desc">고인의 정보를 입력해 주세요. 기업 CS 접수에 사용됩니다.</p>
      </div>

      <form onSubmit={handleNext}>
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div className="alert-banner alert-error">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">고인 성함 <span className="required">*</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="홍길동"
              value={deceasedInfo.name}
              onChange={e => setDeceasedInfo({ name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">생년월일 <span className="required">*</span></label>
            <input
              className="form-input"
              type="date"
              value={deceasedInfo.birthDate}
              onChange={e => setDeceasedInfo({ birthDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">사망일 <span className="required">*</span></label>
            <input
              className="form-input"
              type="date"
              value={deceasedInfo.deathDate}
              onChange={e => setDeceasedInfo({ deathDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">고인 휴대폰 번호</label>
            <input
              className="form-input"
              type="tel"
              placeholder="010-0000-0000 (선택)"
              value={deceasedInfo.phone}
              onChange={e => setDeceasedInfo({ phone: e.target.value })}
              inputMode="tel"
            />
            <p className="form-hint">아이디를 모르는 경우 기업 CS에서 조회에 활용됩니다</p>
          </div>

          {/* 안내 배너 */}
          <div className="alert-banner alert-info">
            <span>🔒</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>개인정보 보호 안내</div>
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                입력하신 정보는 구독 해지 처리 목적으로만 사용되며 법적 보호를 받습니다.
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="bottom-bar">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '저장 중...' : '다음 단계 →'}
          </button>
        </div>
      </form>
    </div>
  )
}
