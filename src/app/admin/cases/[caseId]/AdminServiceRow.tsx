'use client'

import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'pending',    label: '대기 중' },
  { value: 'dispatched', label: '발송 완료' },
  { value: 'received',   label: '기업 접수' },
  { value: 'done',       label: '처리 완료' },
  { value: 'failed',     label: '처리 실패' },
]

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#F1F3F5', color: '#9AA3B2' },
  dispatched: { bg: '#EEF3FD', color: '#3B6FE8' },
  received:   { bg: '#F3F0FF', color: '#8B5CF6' },
  done:       { bg: '#ECFDF5', color: '#16A34A' },
  failed:     { bg: '#FEF2F2', color: '#DC2626' },
}

export default function AdminServiceRow({ service, caseId }: { service: any; caseId: string }) {
  const [status, setStatus] = useState(service.status)
  const [note, setNote] = useState(service.status_note || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const badge = STATUS_BADGE[status] || STATUS_BADGE.pending

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, status_note: note }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('업데이트 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      {/* 서비스 */}
      <td style={{ padding: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{service.service_name}</div>
        {service.dispatched_at && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
            {new Date(service.dispatched_at).toLocaleDateString('ko-KR')} 발송
          </div>
        )}
      </td>

      {/* 카테고리 */}
      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)' }}>
        {service.service_category}
      </td>

      {/* 계정 */}
      <td style={{ padding: '12px', fontSize: '13px' }}>
        {service.account_unknown ? (
          <span style={{ color: 'var(--color-text-3)', fontStyle: 'italic' }}>모름</span>
        ) : (
          service.account_id || <span style={{ color: 'var(--color-text-3)' }}>-</span>
        )}
      </td>

      {/* 발송처 */}
      <td style={{ padding: '12px', fontSize: '12px', color: 'var(--color-text-2)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {service.contact_info}
      </td>

      {/* 현재 상태 배지 */}
      <td style={{ padding: '12px' }}>
        <span style={{
          padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
          background: badge.bg, color: badge.color,
        }}>
          {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
        </span>
      </td>

      {/* 상태 변경 셀렉트 */}
      <td style={{ padding: '12px' }}>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{
            padding: '6px 10px', borderRadius: '8px', border: '1.5px solid var(--color-border)',
            fontSize: '13px', fontFamily: 'var(--font-base)', cursor: 'pointer',
            background: 'var(--color-surface)',
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>

      {/* 메모 + 저장 */}
      <td style={{ padding: '12px', minWidth: '180px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="메모 입력"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: '8px',
              border: '1.5px solid var(--color-border)', fontSize: '13px',
              fontFamily: 'var(--font-base)',
            }}
          />
          <button
            onClick={handleUpdate}
            disabled={loading}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: saved ? '#22C55E' : 'var(--color-accent)', color: '#fff',
              fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-base)',
              whiteSpace: 'nowrap', transition: 'background 0.2s',
            }}
          >
            {loading ? '...' : saved ? '✓' : '저장'}
          </button>
        </div>
      </td>
    </tr>
  )
}
