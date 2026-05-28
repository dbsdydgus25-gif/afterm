'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

// Step 3: 최종 확인 & 제출
export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, deceasedInfo, selectedServices, delegation, resetStore } = useApplyStore()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      // case 상태를 submitted로 변경
      await supabase.from('cases').update({ status: 'submitted' }).eq('id', caseId)

      // 자동 발송 API 트리거
      await fetch(`/api/dispatch/${caseId}`, { method: 'POST' })

      setDone(true)
      resetStore()
    } catch {
      alert('제출 중 오류가 발생했습니다. 다시 시도해 주세요')
    } finally {
      setLoading(false)
    }
  }

  // 제출 완료 화면
  if (done) {
    return (
      <div style={{
        padding: '80px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px',
        }}>✅</div>

        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            신청이 완료되었습니다
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-2)', lineHeight: 1.7 }}>
            에프텀이 각 기업에 해지 요청서를<br />
            발송했습니다. 진행 상황은<br />
            대시보드에서 확인하실 수 있어요.
          </p>
        </div>

        <div className="alert-banner alert-info" style={{ textAlign: 'left', width: '100%' }}>
          <span>📨</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>처리 기간 안내</div>
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
              대부분의 서비스는 <strong>5~7 영업일</strong> 내에 처리됩니다.
              진행 상황이 업데이트되면 알려드릴게요.
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => router.push('/dashboard')}
          style={{ width: '100%' }}
        >
          대시보드에서 확인하기 →
        </button>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div style={{ padding: '32px 24px 16px' }}>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>최종 확인</h1>
        <p className="section-desc">신청 내용을 확인하고 제출해 주세요</p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 고인 정보 확인 */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-3)', marginBottom: '16px', letterSpacing: '0.02em' }}>
            고인 정보
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: '성함', value: deceasedInfo.name },
              { label: '생년월일', value: deceasedInfo.birthDate },
              { label: '사망일', value: deceasedInfo.deathDate },
              { label: '연락처', value: deceasedInfo.phone || '미입력' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 선택 서비스 */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-3)', marginBottom: '16px', letterSpacing: '0.02em' }}>
            해지 요청 서비스 ({selectedServices.length}개)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedServices.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '100px',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                fontSize: '13px', fontWeight: 600,
              }}>
                <span>{s.icon}</span><span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 위임 정보 */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-3)', marginBottom: '16px', letterSpacing: '0.02em' }}>
            위임 정보
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: '신청인', value: delegation?.delegatorName || '-' },
              { label: '관계', value: delegation?.delegatorRelation || '-' },
              { label: '서명', value: '✅ 서명 완료' },
              { label: '서류', value: '✅ 3종 업로드 완료' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 최종 안내 */}
        <div className="alert-banner alert-warning">
          <span>⚠️</span>
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
            제출 후에는 선택한 서비스 목록을 수정할 수 없습니다.
            내용을 다시 한번 확인해 주세요.
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '제출 중...' : '신청 제출하기 ✓'}
        </button>
      </div>
    </div>
  )
}
