'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

const LOADING_MESSAGES = [
  '서류를 검토하고 있어요...',
  '서비스 정보를 확인하고 있어요...',
  '신청서를 작성하고 있어요...',
  '마지막으로 확인하고 있어요...',
  '접수를 완료하고 있어요...',
]

export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, deceasedInfo, selectedServices, delegation, resetStore } = useApplyStore()
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // 로딩 중 메시지 순환
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 700)
    return () => clearInterval(interval)
  }, [loading])

  const handleSubmit = async () => {
    if (!caseId) {
      setError('신청 정보가 없습니다. 처음부터 다시 시작해 주세요.')
      return
    }
    setLoading(true)
    setError('')
    setLoadingMsgIdx(0)

    // 최소 3.5초 로딩 (사람이 처리하는 느낌)
    const minDelay = new Promise(resolve => setTimeout(resolve, 3500))

    try {
      const [submitResult] = await Promise.all([
        (async () => {
          const { error: updateErr } = await supabase
            .from('cases')
            .update({ status: 'submitted' })
            .eq('id', caseId)
          if (updateErr) throw updateErr

          // 어드민에게 이메일 알림 발송
          fetch(`/api/admin/cases/${caseId}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'new_case' }),
          }).catch(() => {}) // 알림 실패해도 진행

          // 📊 구글 시트에 케이스 정보 자동 저장 (fire-and-forget)
          fetch('/api/sheets/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caseId,
              deceasedInfo,
              selectedServices,
              delegation,
              submittedAt: new Date().toISOString(),
            }),
          }).catch(() => {})

          // 📱 고객에게 카카오 알림톡 발송 (접수 완료)
          const { data: { user } } = await supabase.auth.getUser()
          const userPhone = user?.user_metadata?.phone || user?.phone || ''
          const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
          if (userPhone) {
            fetch('/api/notify/kakao', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: userPhone,
                caseId,
                type: 'submitted',
                requesterName: userName,
                deceasedName: deceasedInfo.name,
                services: selectedServices.map(s => `${s.name}(${s.track === 'memorial' ? '추모' : '삭제'})`).join(', '),
              }),
            }).catch(() => {})
          }

          // 🤖 AI 에이전트 파이프라인 자동 시작 (fire-and-forget)
          // 응답을 기다리지 않고 백그라운드에서 실행됨
          fetch('/api/agents/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId }),
          }).catch(() => {}) // 에이전트 실패해도 제출은 완료
        })(),
        minDelay,
      ])
      resetStore()
      setLoading(false)
      setDone(true)
    } catch (e) {
      console.error('제출 오류:', e)
      setError('제출 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  // ── 로딩 화면 ──
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', textAlign: 'center',
        padding: '60px 32px', gap: 32,
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        background: '#fff',
      }}>
        {/* 스피너 */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <svg viewBox="0 0 80 80" width="80" height="80" style={{ position: 'absolute', inset: 0, animation: 'spin 1.2s linear infinite' }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#E8EAF0" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="#0066FF" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="80 134"
              strokeDashoffset="0"
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>📋</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>

        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            신청 중이에요
          </h2>
          <p style={{
            fontSize: 15, color: '#6B7280', margin: 0, lineHeight: 1.7,
            minHeight: 48,
            transition: 'opacity 0.3s',
          }}>
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: loadingMsgIdx % 4 === i ? '#0066FF' : '#E5E7EB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{
          background: '#F4F6FA', borderRadius: 16, padding: '16px 20px',
          border: '1px solid #E8EAF0', width: '100%',
        }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
            잠시만 기다려주세요.<br />
            담당자가 신청 내용을 확인하고 있어요.
          </p>
        </div>
      </div>
    )
  }

  // ── 완료 화면 ──
  if (done) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', textAlign: 'center',
        padding: '60px 28px', gap: 28,
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        background: '#fff',
      }}>
        {/* 체크 아이콘 */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: '#ECFDF5', border: '3px solid #BBF7D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
          animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          ✅
          <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
        </div>

        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            신청이 완료되었습니다
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
            에프텀이 접수를 확인 후<br />
            순서대로 처리해드립니다.<br />
            진행 상황은 홈에서 확인하세요.
          </p>
        </div>

        {/* 신청 요약 */}
        <div style={{
          background: '#F4F6FA', borderRadius: 18, padding: '18px 20px',
          border: '1px solid #E8EAF0', width: '100%', textAlign: 'left',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 12px', letterSpacing: '0.05em' }}>신청 요약</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>고인</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{deceasedInfo.name || '-'} 님</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>신청 서비스</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selectedServices.length}개</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>예상 처리</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0066FF' }}>5~7 영업일</span>
            </div>
          </div>
        </div>

        <div style={{
          background: '#EFF6FF', borderRadius: 16, padding: '16px 18px',
          border: '1px solid #DBEAFE', width: '100%',
          display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📨</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E3A8A', marginBottom: 4 }}>처리 안내</div>
            <div style={{ fontSize: 13, color: '#3B82F6', lineHeight: 1.6 }}>
              진행 상황이 업데이트되면<br />홈 화면에서 바로 확인하실 수 있어요.
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/home')}
          style={{
            width: '100%', padding: '18px',
            background: '#0066FF', border: 'none', borderRadius: 16,
            color: '#fff', fontSize: 16, fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          }}
        >
          홈에서 확인하기 →
        </button>
      </div>
    )
  }

  // ── 최종 확인 화면 ──
  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      maxWidth: 480, margin: '0 auto', minHeight: '100dvh',
      background: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          최종 확인
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>
          신청 내용을 확인하고 제출해 주세요
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 고인 정보 */}
          <div style={{ background: '#F9FAFB', borderRadius: 16, padding: '18px 20px', border: '1px solid #E8EAF0' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 14px', letterSpacing: '0.05em' }}>고인 정보</p>
            {[
              { label: '성함', value: deceasedInfo.name || '-' },
              { label: '생년월일', value: deceasedInfo.birthDate || '-' },
              { label: '사망일', value: deceasedInfo.deathDate || '-' },
              { label: '연락처', value: deceasedInfo.phone || '미입력' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: '#6B7280' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* 선택 서비스 */}
          <div style={{ background: '#F9FAFB', borderRadius: 16, padding: '18px 20px', border: '1px solid #E8EAF0' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 14px', letterSpacing: '0.05em' }}>
              해지 요청 서비스 ({selectedServices.length}개)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedServices.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 100,
                  background: '#fff', border: '1px solid #E5E7EB',
                  fontSize: 13, fontWeight: 600, color: '#374151',
                }}>
                  <span>{s.icon}</span><span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 위임 정보 */}
          <div style={{ background: '#F9FAFB', borderRadius: 16, padding: '18px 20px', border: '1px solid #E8EAF0' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 14px', letterSpacing: '0.05em' }}>위임 정보</p>
            {[
              { label: '신청인', value: delegation?.delegatorName || '-' },
              { label: '관계', value: delegation?.delegatorRelation || '-' },
              { label: '서명', value: delegation?.signatureData ? '✅ 완료' : '❌ 서명 필요' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: '#6B7280' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              padding: '14px 16px', background: '#FEF2F2', borderRadius: 12,
              border: '1px solid #FECACA', fontSize: 13, color: '#DC2626', fontWeight: 600,
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{
            padding: '14px 16px', background: '#FFFBEB', borderRadius: 12,
            border: '1px solid #FDE68A',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, margin: 0 }}>
              제출 후에는 선택한 서비스 목록을 수정할 수 없습니다.
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 40px', flexShrink: 0 }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '18px',
            background: '#0066FF', border: 'none', borderRadius: 16,
            color: '#fff', fontSize: 16, fontWeight: 800,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          신청 제출하기 →
        </button>
      </div>
    </div>
  )
}
