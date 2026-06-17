'use client'

import { useState } from 'react'

const DOC_LABELS: Record<string, { icon: string; label: string }> = {
  death_cert:  { icon: '📋', label: '사망진단서' },
  id_card:     { icon: '🪪', label: '신분증' },
  family_cert: { icon: '👨‍👩‍👧', label: '가족관계증명서' },
}

interface Document {
  doc_type: string
  file_name?: string
  storage_path: string
  public_url: string
}

export default function PackageActions({
  caseId,
  deceasedName,
  documents = [],
  paymentStatus,
  paidAmount,
}: {
  caseId: string
  deceasedName: string
  documents?: Document[]
  paymentStatus?: string
  paidAmount?: number
}) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // 개별 서류 다운로드 (Signed URL 사용)
  const handleDocDownload = (doc: Document) => {
    if (!doc.public_url) { showToast('❌ 파일 URL 없음'); return }
    const a = document.createElement('a')
    a.href = doc.public_url
    const meta = DOC_LABELS[doc.doc_type]
    a.download = `${meta?.label || doc.doc_type}_${deceasedName}.${doc.storage_path.split('.').pop() || 'jpg'}`
    a.target = '_blank'
    a.click()
  }

  // 위임장 PDF 다운로드
  const handleDelegationPdf = async () => {
    setDownloading('delegation')
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/delegation-pdf`)
      if (!res.ok) { showToast('❌ 위임장 생성 실패'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `위임장_${deceasedName}_${caseId.slice(0,8).toUpperCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('✅ 위임장 PDF 다운로드 완료!')
    } catch { showToast('❌ 위임장 다운로드 실패') }
    finally { setDownloading(null) }
  }

  // 환불 처리
  const handleRefund = async () => {
    if (!confirm(`${deceasedName}님 케이스 결제 ${paidAmount?.toLocaleString()}원을 전액 환불하시겠습니까?`)) return
    setRefunding(true)
    try {
      const res = await fetch(`/api/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, reason: '관리자 환불 처리' }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(`❌ 환불 실패: ${data.error}`); return }
      setCurrentPaymentStatus('refunded')
      showToast('✅ 환불 완료!')
    } catch { showToast('❌ 환불 중 오류 발생') }
    finally { setRefunding(false) }
  }

  // 전체 ZIP 다운로드
  const handleZip = async () => {
    setDownloading('zip')
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/package`, { method: 'POST' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '실패') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CASE-${caseId.slice(0,8).toUpperCase()}_${deceasedName}님_전체서류.zip`
      a.click()
      URL.revokeObjectURL(url)
      showToast('✅ ZIP 다운로드 완료!')
    } catch (e: any) { showToast(`❌ ${e.message}`) }
    finally { setDownloading(null) }
  }

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: '#fff', padding: '12px 20px', borderRadius: 100,
          fontSize: 14, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>{toast}</div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', padding: '20px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
          📥 서류 다운로드
        </h3>

        {/* 개별 서류 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {documents.map((doc) => {
            const meta = DOC_LABELS[doc.doc_type] || { icon: '📄', label: doc.doc_type }
            return (
              <button
                key={doc.doc_type}
                onClick={() => handleDocDownload(doc)}
                disabled={!doc.public_url}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 9,
                  border: '1px solid #E5E9EF', background: doc.public_url ? '#FAFAFA' : '#F9FAFB',
                  cursor: doc.public_url ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600, color: doc.public_url ? '#111827' : '#9CA3AF',
                  transition: 'background 0.15s',
                }}
              >
                <span>{meta.icon} {meta.label}</span>
                <span style={{ fontSize: 11, color: doc.public_url ? '#2563EB' : '#9CA3AF', fontWeight: 700 }}>
                  {doc.public_url ? '↓ 다운로드' : '미업로드'}
                </span>
              </button>
            )
          })}

          {/* 위임장 PDF (자동 생성) */}
          <button
            onClick={handleDelegationPdf}
            disabled={downloading === 'delegation'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 14px', borderRadius: 9,
              border: '1.5px solid #163272', background: '#EFF6FF',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#163272',
              transition: 'background 0.15s',
            }}
          >
            <span>✍️ 위임장 (자동 생성 PDF)</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#163272' }}>
              {downloading === 'delegation' ? '생성 중...' : '↓ 다운로드'}
            </span>
          </button>
        </div>

        {/* 전체 ZIP */}
        <button
          onClick={handleZip}
          disabled={downloading === 'zip'}
          style={{
            width: '100%', padding: '13px', borderRadius: 10,
            background: downloading === 'zip' ? '#f3f4f6' : '#163272',
            color: downloading === 'zip' ? '#9ca3af' : '#fff',
            border: 'none', cursor: downloading === 'zip' ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
          }}
        >
          {downloading === 'zip' ? '⏳ ZIP 생성 중...' : '📦 전체 ZIP 다운로드 (서류 4종)'}
        </button>

        <p style={{ fontSize: 11, color: '#9ca3af', margin: '10px 0 0', textAlign: 'center' }}>
          사망진단서 · 신분증 · 가족관계증명서 · 위임장(PDF)
        </p>

        {/* 결제 / 환불 */}
        {paidAmount && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>💳 결제 현황</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                background: currentPaymentStatus === 'refunded' ? '#FEF2F2' : '#ECFDF5',
                color: currentPaymentStatus === 'refunded' ? '#DC2626' : '#059669',
              }}>
                {currentPaymentStatus === 'refunded' ? '환불완료' : `${paidAmount.toLocaleString()}원 결제됨`}
              </span>
            </div>
            {currentPaymentStatus !== 'refunded' && (
              <button
                onClick={handleRefund}
                disabled={refunding}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: refunding ? '#f3f4f6' : '#FEF2F2',
                  color: refunding ? '#9ca3af' : '#DC2626',
                  border: '1px solid #FECACA',
                  cursor: refunding ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 700,
                }}
              >
                {refunding ? '환불 처리 중...' : `↩ ${paidAmount.toLocaleString()}원 전액 환불`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
