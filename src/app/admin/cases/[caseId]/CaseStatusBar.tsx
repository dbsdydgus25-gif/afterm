'use client'

import { useState } from 'react'

const STEPS = [
  { key: 'submitted',  label: '접수 완료',  color: '#2563EB' },
  { key: 'reviewing',  label: '서류 확인',  color: '#7C3AED' },
  { key: 'processing', label: '처리 중',    color: '#D97706' },
  { key: 'completed',  label: '처리 완료',  color: '#059669' },
]

const NEXT_ACTION: Record<string, { label: string; nextStatus: string; color: string }> = {
  submitted:  { label: '✅ 서류 확인 완료', nextStatus: 'reviewing',  color: '#7C3AED' },
  reviewing:  { label: '🚀 처리 시작',      nextStatus: 'processing', color: '#D97706' },
  processing: { label: '🎉 처리 완료',      nextStatus: 'completed',  color: '#059669' },
}

export default function CaseStatusBar({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const stepIdx = STEPS.findIndex(s => s.key === status)
  const nextAction = NEXT_ACTION[status]

  const handleUpdate = async () => {
    if (!nextAction) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextAction.nextStatus }),
      })
      if (!res.ok) throw new Error()
      setStatus(nextAction.nextStatus)
    } catch {
      alert('상태 변경 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      border: '1px solid #e5e9ef', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0 }}>케이스 진행 상태</h3>
        {nextAction && (
          <button
            onClick={handleUpdate}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: nextAction.color, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '처리 중...' : nextAction.label}
          </button>
        )}
        {!nextAction && (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '8px 16px', borderRadius: 100 }}>
            ✅ 최종 완료
          </span>
        )}
      </div>

      {/* 진행 스텝 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {STEPS.map((step, i) => {
          const active = i <= stepIdx
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                height: 6, borderRadius: 3,
                background: active ? step.color : '#e5e9ef',
                transition: 'background 0.3s',
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, textAlign: 'center',
                color: active ? step.color : '#aaa',
              }}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
