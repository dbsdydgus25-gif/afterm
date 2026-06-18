'use client'

import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'pending',    label: '대기 중',   color: '#9AA3B2', bg: '#F1F3F5', emoji: '⏳' },
  { value: 'dispatched', label: '발송 완료', color: '#3B6FE8', bg: '#EEF3FD', emoji: '📨' },
  { value: 'received',   label: '기업 접수', color: '#8B5CF6', bg: '#F3F0FF', emoji: '📋' },
  { value: 'done',       label: '처리 완료', color: '#16A34A', bg: '#ECFDF5', emoji: '✅' },
  { value: 'failed',     label: '처리 실패', color: '#DC2626', bg: '#FEF2F2', emoji: '❌' },
]

export default function AdminServiceRow({ service, caseId }: { service: any; caseId: string }) {
  const [status, setStatus] = useState(service.status || 'pending')
  const [note, setNote] = useState(service.status_note || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentOpt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, status_note: note }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '오류')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      alert(`업데이트 실패: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E8EAF0',
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* 상단: 서비스명 + 현재상태 배지 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 3 }}>
            {service.service_name}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {service.service_category}
            {service.contact_info && (
              <span style={{ marginLeft: 8, color: '#6B7280' }}>· {service.contact_info}</span>
            )}
          </div>
        </div>
        <span style={{
          padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
          background: currentOpt.bg, color: currentOpt.color, flexShrink: 0,
        }}>
          {currentOpt.emoji} {currentOpt.label}
        </span>
      </div>

      {/* 계정 정보 */}
      {service.account_id && (
        <div style={{ background: '#F8FAFF', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#374151' }}>
          <span style={{ color: '#9CA3AF', marginRight: 6 }}>계정</span>
          <strong>{service.account_id}</strong>
        </div>
      )}

      {/* 상태 변경 */}
      <div>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, marginBottom: 6 }}>상태 변경</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: status === opt.value ? `2px solid ${opt.color}` : '1.5px solid #E8EAF0',
                background: status === opt.value ? opt.bg : '#F9FAFB',
                color: status === opt.value ? opt.color : '#6B7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메모 + 저장 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="유저에게 보여줄 메모 (선택)"
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUpdate()}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 8,
            border: '1.5px solid #E8EAF0', fontSize: 13, outline: 'none',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          }}
        />
        <button
          onClick={handleUpdate}
          disabled={loading}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: saved ? '#22C55E' : '#0066FF',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          {loading ? '저장 중...' : saved ? '✓ 저장됨 · 알림 전송' : '저장 →'}
        </button>
      </div>

      {saved && (
        <div style={{
          background: '#ECFDF5', borderRadius: 8, padding: '8px 12px',
          fontSize: 12, color: '#059669', fontWeight: 600,
        }}>
          ✅ 상태가 저장되었고 유저에게 채팅 알림이 전송되었습니다.
        </div>
      )}
    </div>
  )
}
