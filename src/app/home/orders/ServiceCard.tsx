'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const SVC_STATUS: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: '대기 중',   color: '#6B7280', bg: '#F3F4F6', step: 1 },
  dispatched: { label: '발송 완료', color: '#2563EB', bg: '#EFF6FF', step: 2 },
  received:   { label: '기업 접수', color: '#7C3AED', bg: '#F5F3FF', step: 3 },
  done:       { label: '처리 완료', color: '#059669', bg: '#ECFDF5', step: 4 },
  failed:     { label: '처리 실패', color: '#DC2626', bg: '#FEF2F2', step: 0 },
}

const SVC_STEPS = ['대기', '발송', '접수', '완료']

const SERVICE_ICONS: Record<string, string> = {
  '통신': '📱', '금융': '🏦', '보험': '📄', '포털': '💻',
  '이메일': '✉️', 'SNS': '📸', '구독': '💳', '메신저': '💬', '기타': '📋',
}

const SVC_DOCS: Record<string, { docs: string[]; note: string }> = {
  '구글':       { docs: ['사망진단서 사본', '신청인 신분증'], note: '영업일 7~14일 소요' },
  '카카오':     { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '영업일 5~10일 소요' },
  '카카오톡':   { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '영업일 5~10일 소요' },
  '네이버':     { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '네이버 회원 탈퇴 또는 계정 삭제' },
  '인스타그램': { docs: ['사망진단서 사본', '신청인 신분증'], note: '추모 계정 전환 또는 삭제. 영업일 14일 내' },
  '페이스북':   { docs: ['사망진단서 사본', '신청인 신분증'], note: '추모 계정 전환 또는 삭제 선택' },
  '애플':       { docs: ['사망진단서 사본', '법원 명령서 또는 위임장'], note: '애플 법무팀 처리, 4~8주 소요' },
  '기본':       { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '담당자 접수 후 처리 안내' },
}

type ServiceCardProps = {
  svc: {
    id: string
    service_name: string
    service_category: string
    status: string
    status_note?: string
  }
  caseId: string
  userId: string
}

export default function ServiceCard({ svc, caseId, userId }: ServiceCardProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploads, setUploads] = useState<{ name: string; url: string; size: number }[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sMeta = SVC_STATUS[svc.status] || SVC_STATUS['pending']
  const icon = SERVICE_ICONS[svc.service_category] || '📋'
  const docInfo = SVC_DOCS[svc.service_name] || SVC_DOCS['기본']
  const currentStep = sMeta.step
  const isPaid = svc.status === 'done'

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')
    const supabase = createClient()
    const newUploads: { name: string; url: string; size: number }[] = []
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('파일 크기는 10MB 이하여야 합니다.')
        setUploading(false)
        return
      }
      const filePath = `additional-docs/${userId}/${caseId}/${svc.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('case-documents').upload(filePath, file, { upsert: false })
      if (error) { setUploadError(`업로드 실패: ${error.message}`); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('case-documents').getPublicUrl(filePath)
      newUploads.push({ name: file.name, url: urlData.publicUrl, size: file.size })
    }
    setUploads(prev => [...prev, ...newUploads])
    setUploadSuccess(true)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setTimeout(() => setUploadSuccess(false), 3000)
  }

  return (
    <div style={{
      flexShrink: 0,
      width: '100%',
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      {/* 상태 컬러 탑바 */}
      <div style={{
        height: 3,
        background: currentStep >= 4 ? '#10B981' : currentStep >= 3 ? '#7C3AED' : currentStep >= 2 ? '#2563EB' : '#D1D5DB',
      }} />

      <div style={{ padding: '14px 16px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: '#F4F6F9', border: '1px solid #EAECF0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, fontWeight: 600 }}>{svc.service_category}</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>{svc.service_name}</p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
            background: sMeta.bg, color: sMeta.color, flexShrink: 0,
          }}>{sMeta.label}</span>
        </div>

        {/* 진행 스텝 바 */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 12,
          background: '#F9FAFB', borderRadius: 10, padding: '8px 10px',
          border: '1px solid #F0F0F0',
        }}>
          {SVC_STEPS.map((step, i) => {
            const stepNum = i + 1
            const isActive = currentStep === stepNum
            const isDone = currentStep > stepNum
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i < SVC_STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 8, left: '60%', right: '-40%',
                    height: 2, background: isDone ? '#2563EB' : '#E5E7EB', zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', zIndex: 1, marginBottom: 4,
                  background: isDone ? '#2563EB' : isActive ? '#fff' : '#fff',
                  border: isActive ? '2px solid #2563EB' : isDone ? 'none' : '2px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isActive ? '0 0 0 3px rgba(22,50,114,0.15)' : 'none',
                }}>
                  {isDone
                    ? <span style={{ fontSize: 9, color: '#fff', fontWeight: 800 }}>✓</span>
                    : isActive
                    ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
                    : null}
                </div>
                <span style={{ fontSize: 9, fontWeight: isActive ? 800 : isDone ? 600 : 400, color: isActive ? '#2563EB' : isDone ? '#6B7280' : '#D1D5DB' }}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>

        {/* 담당자 메모 */}
        {svc.status_note && (
          <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '8px 10px', marginBottom: 10, border: '1px solid #FDE68A' }}>
            <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>📢 {svc.status_note}</p>
          </div>
        )}

        {/* 필요 서류 (접을 수 있게) */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px', letterSpacing: '0.04em' }}>📎 필요 서류</p>
          {docInfo.docs.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 16, height: 16, borderRadius: 5, background: '#EBF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#2563EB', fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 12, color: '#374151' }}>{doc}</span>
            </div>
          ))}
          <p style={{ fontSize: 10, color: '#9CA3AF', margin: '5px 0 0' }}>💡 {docInfo.note}</p>
        </div>

        {/* 업로드된 추가 서류 */}
        {uploads.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {uploads.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 7,
                background: '#F0FDF4', border: '1px solid #BBF7D0', textDecoration: 'none', marginBottom: 3,
              }}>
                <span style={{ fontSize: 12 }}>📄</span>
                <span style={{ flex: 1, fontSize: 11, color: '#166534', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ fontSize: 10, color: '#86EFAC' }}>{Math.round(f.size / 1024)}KB</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isPaid ? '#22C55E' : '#F59E0B',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: isPaid ? '#166534' : '#92400E' }}>
              {isPaid ? '정산 완료' : '정산 대기'}
            </span>
          </div>
          <button
            onClick={() => setShowUpload(v => !v)}
            style={{
              background: showUpload ? '#F3F4F6' : '#2563EB', color: showUpload ? '#374151' : '#fff',
              border: 'none', borderRadius: 7, padding: '6px 12px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showUpload ? '닫기' : '📎 추가 서류'}
          </button>
        </div>

        {showUpload && (
          <div style={{ marginTop: 10 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #BFDBFE', borderRadius: 10, padding: '14px 12px',
                background: '#F0F7FF', textAlign: 'center', cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', margin: '0 0 2px' }}>
                {uploading ? '업로드 중...' : '📂 파일 선택'}
              </p>
              <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>PDF, JPG, PNG, HEIC · 최대 10MB</p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.tiff,.webp" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
            {uploadError && <p style={{ fontSize: 11, color: '#DC2626', margin: '6px 0 0' }}>⚠️ {uploadError}</p>}
            {uploadSuccess && <p style={{ fontSize: 11, color: '#166534', margin: '6px 0 0', fontWeight: 700 }}>✅ 파일 제출 완료!</p>}
          </div>
        )}
      </div>
    </div>
  )
}
