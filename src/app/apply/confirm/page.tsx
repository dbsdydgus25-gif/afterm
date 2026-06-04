'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

// Step 3: 최종 확인 & 제출
export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, deceasedInfo, selectedServices, delegation, resetStore } = useApplyStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!caseId) {
      setError('신청 정보가 없습니다. 처음부터 다시 시작해 주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // 케이스 상태를 submitted로 변경
      const { error: updateErr } = await supabase
        .from('cases')
        .update({ status: 'submitted' })
        .eq('id', caseId)
      if (updateErr) throw updateErr

      // 자동 발송 API 트리거
      await fetch(`/api/dispatch/${caseId}`, { method: 'POST' })

      setDone(true)
      resetStore()
    } catch (e) {
      console.error('제출 오류:', e)
      setError('제출 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  // ── 제출 완료 화면 ──
  if (done) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh', textAlign: 'center', padding: '60px 24px', gap: '24px',
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#EBF3FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px',
        }}>✅</div>

        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px', color: '#111' }}>
            신청이 완료되었습니다
          </h2>
          <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, margin: 0 }}>
            에프텀이 접수를 확인 후<br />
            순서대로 처리해드립니다.<br />
            진행 상황은 홈에서 확인하세요.
          </p>
        </div>

        <div style={{
          background: '#F0F7FF', border: '1px solid #C7DEFF', borderRadius: '16px',
          padding: '16px', width: '100%',
          display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>📨</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '4px' }}>처리 기간 안내</div>
            <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
              대부분의 서비스는 <strong>5~7 영업일</strong> 내에 처리됩니다.<br />
              진행 상황이 업데이트되면 알려드릴게요.
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/home')}
          style={{
            width: '100%', padding: '18px', background: '#163272',
            border: 'none', borderRadius: '16px', color: '#fff',
            fontSize: '16px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          홈에서 확인하기 →
        </button>
      </div>
    )
  }

  // ── 확인 화면 ──
  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* 본문 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        
        {/* 헤더 */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px', fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--color-label-strong)',
          marginBottom: '6px',
        }}>최종 확인</h1>
        <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '28px' }}>
          신청 내용을 확인하고 제출해 주세요
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 고인 정보 카드 */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{
              fontSize: '12px', fontWeight: 700,
              color: 'var(--color-label-alternative)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              marginBottom: '16px',
            }}>고인 정보</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '성함', value: deceasedInfo.name || '-' },
                { label: '생년월일', value: deceasedInfo.birthDate || '-' },
                { label: '사망일', value: deceasedInfo.deathDate || '-' },
                { label: '연락처', value: deceasedInfo.phone || '미입력' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-label-alternative)' }}>{label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-label-strong)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 선택 서비스 카드 */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{
              fontSize: '12px', fontWeight: 700,
              color: 'var(--color-label-alternative)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              해지 요청 서비스 ({selectedServices.length}개)
            </h3>
            {selectedServices.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-label-assistive)' }}>선택된 서비스가 없습니다</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedServices.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-coolNeutral-98)',
                    border: '1px solid var(--color-line-normal-normal)',
                    fontSize: '13px', fontWeight: 600, color: 'var(--color-label-strong)',
                  }}>
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 위임 정보 카드 */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{
              fontSize: '12px', fontWeight: 700,
              color: 'var(--color-label-alternative)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              marginBottom: '16px',
            }}>위임 정보</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '신청인', value: delegation?.delegatorName || '-' },
                { label: '관계', value: delegation?.delegatorRelation || '-' },
                { label: '서명', value: delegation?.signatureData ? '✅ 서명 완료' : '❌ 서명 필요' },
                { label: '서류', value: '✅ 3종 업로드 완료' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-label-alternative)' }}>{label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-label-strong)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div style={{
              padding: '14px 16px',
              background: 'var(--color-red-99)',
              border: '1px solid var(--color-red-80)',
              borderRadius: 'var(--radius-12)',
              fontSize: '13px', fontWeight: 600,
              color: 'var(--color-status-negative)',
            }}>
              {error}
            </div>
          )}

          {/* 주의 안내 */}
          <div style={{
            padding: '16px',
            background: 'var(--color-yellow-99)',
            border: '1px solid var(--color-yellow-90)',
            borderRadius: 'var(--radius-12)',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)', lineHeight: 1.6 }}>
              제출 후에는 선택한 서비스 목록을 수정할 수 없습니다.
              내용을 다시 한번 확인해 주세요.
            </div>
          </div>
        </div>
      </div>

      {/* 하단 제출 버튼 */}
      <div className="cta-dock">
        <Button block onClick={handleSubmit} disabled={loading}>
          {loading ? '제출 중...' : '신청 제출하기 ✓'}
        </Button>
      </div>
    </div>
  )
}
