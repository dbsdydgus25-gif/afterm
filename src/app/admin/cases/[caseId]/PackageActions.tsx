'use client'

import { useState } from 'react'

// 케이스 패키지 ZIP 다운로드 + 어드민 이메일 알림 버튼
export default function PackageActions({ caseId, deceasedName }: {
  caseId: string
  deceasedName: string
}) {
  const [downloading, setDownloading] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ZIP 다운로드
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/package`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '다운로드 실패')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CASE-${caseId.slice(0, 8).toUpperCase()}_${deceasedName}님_패키지.zip`
      a.click()
      URL.revokeObjectURL(url)
      showToast('✅ ZIP 다운로드 완료!')
    } catch (e: any) {
      showToast(`❌ ${e.message}`)
    } finally {
      setDownloading(false)
    }
  }

  // 어드민 이메일 알림 (수동 재발송)
  const handleNotify = async () => {
    setNotifying(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'package_ready' }),
      })
      if (!res.ok) throw new Error('발송 실패')
      showToast('✅ afterm001@gmail.com 으로 이메일 발송 완료!')
    } catch (e: any) {
      showToast(`❌ ${e.message}`)
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: '#fff', padding: '12px 20px', borderRadius: 100,
          fontSize: 14, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', padding: '20px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
          📦 발송 패키지
        </h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>
          서류(사망진단서·가족관계증명서·신분증) + 서비스별 신청서 초안을 ZIP으로 묶어 다운로드합니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* ZIP 다운로드 */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: '100%', padding: '14px', borderRadius: 10,
              background: downloading ? '#f3f4f6' : '#163272',
              color: downloading ? '#9ca3af' : '#fff',
              border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
          >
            {downloading ? (
              <>⏳ ZIP 생성 중...</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                패키지 ZIP 다운로드
              </>
            )}
          </button>

          {/* 이메일 알림 발송 */}
          <button
            onClick={handleNotify}
            disabled={notifying}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: notifying ? '#f3f4f6' : '#fff',
              color: notifying ? '#9ca3af' : '#374151',
              border: '1px solid #e5e9ef', cursor: notifying ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {notifying ? '발송 중...' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                이메일 알림 재발송 (afterm001@gmail.com)
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' }}>
          ZIP에는 첨부 서류 3종 + 서비스별 신청서 초안이 포함됩니다
        </p>
      </div>
    </div>
  )
}
