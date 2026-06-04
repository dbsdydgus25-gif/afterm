'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// 서비스 상태 메타
const SVC_STATUS: Record<string, { label: string; color: string; bg: string; step: number; icon: string }> = {
  pending:    { label: '대기 중',   color: '#6B7280', bg: '#F3F4F6', step: 1, icon: '⏳' },
  dispatched: { label: '발송 완료', color: '#2563EB', bg: '#EFF6FF', step: 2, icon: '📤' },
  received:   { label: '기업 접수', color: '#7C3AED', bg: '#F5F3FF', step: 3, icon: '🏢' },
  done:       { label: '처리 완료', color: '#059669', bg: '#ECFDF5', step: 4, icon: '✅' },
  failed:     { label: '처리 실패', color: '#DC2626', bg: '#FEF2F2', step: 0, icon: '❌' },
}

const SVC_STEPS = [
  { label: '대기 중',   step: 1 },
  { label: '발송 완료', step: 2 },
  { label: '기업 접수', step: 3 },
  { label: '처리 완료', step: 4 },
]

const SERVICE_ICONS: Record<string, string> = {
  '통신': '📱', '금융': '🏦', '보험': '📄', '포털': '💻',
  '이메일': '✉️', 'SNS': '📸', '구독': '💳', '메신저': '💬', '기타': '📋',
}

const SVC_DOCS: Record<string, { docs: string[]; note: string }> = {
  '구글':       { docs: ['사망진단서 사본', '신청인 신분증'], note: '계정 삭제 또는 추모화 선택 가능. 영업일 7~14일 소요' },
  '카카오':     { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '카카오 고객센터 접수 후 영업일 5~10일 소요' },
  '카카오톡':   { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '카카오 고객센터 접수 후 영업일 5~10일 소요' },
  '네이버':     { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '네이버 회원 탈퇴 또는 계정 삭제 처리' },
  '인스타그램': { docs: ['사망진단서 사본', '신청인 신분증'], note: '추모 계정 전환 또는 삭제 선택 가능. 영업일 14일 내 처리' },
  '페이스북':   { docs: ['사망진단서 사본', '신청인 신분증'], note: '추모 계정 전환 또는 삭제 선택 가능' },
  '애플':       { docs: ['사망진단서 사본', '법원 명령서 또는 위임장'], note: '애플 법무팀 직접 처리, 4~8주 소요' },
  '기본':       { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '담당자가 서류 접수 후 처리 안내드립니다' },
}

type UploadedFile = {
  name: string
  url: string
  size: number
  uploadedAt: string
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
  const [uploads, setUploads] = useState<UploadedFile[]>([])
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
    setUploadSuccess(false)

    const supabase = createClient()
    const newUploads: UploadedFile[] = []

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('파일 크기는 10MB 이하여야 합니다.')
        setUploading(false)
        return
      }

      const ext = file.name.split('.').pop()
      const filePath = `additional-docs/${userId}/${caseId}/${svc.id}/${Date.now()}_${file.name}`

      const { data, error } = await supabase.storage
        .from('case-documents')
        .upload(filePath, file, { upsert: false })

      if (error) {
        setUploadError(`업로드 실패: ${error.message}`)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('case-documents')
        .getPublicUrl(filePath)

      newUploads.push({
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      })
    }

    setUploads(prev => [...prev, ...newUploads])
    setUploadSuccess(true)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    setTimeout(() => setUploadSuccess(false), 3000)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div style={{
      flexShrink: 0,
      width: 'calc(100vw - 48px)',
      scrollSnapAlign: 'start',
      background: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
    }}>
      {/* 상태 색상 바 */}
      <div style={{
        height: 4,
        background: sMeta.step === 4 ? '#10B981'
          : sMeta.step === 3 ? '#7C3AED'
          : sMeta.step === 2 ? '#2563EB'
          : sMeta.step === 0 ? '#DC2626'
          : '#D1D5DB',
      }} />

      <div style={{ padding: '20px 18px 0' }}>
        {/* 헤더: 아이콘 + 서비스명 + 상태 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: '#F4F6F9', border: '1px solid #EAECF0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 600, letterSpacing: '0.03em' }}>
              {svc.service_category}
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              {svc.service_name}
            </p>
          </div>
          <span style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700,
            padding: '5px 10px', borderRadius: 100,
            background: sMeta.bg, color: sMeta.color,
            border: `1px solid ${sMeta.color}22`,
          }}>
            {sMeta.icon} {sMeta.label}
          </span>
        </div>

        {/* 진행 스텝 — 세로 타임라인 스타일 */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 16,
          background: '#F9FAFB', borderRadius: 12, padding: '12px 14px',
          border: '1px solid #F0F0F0',
        }}>
          {SVC_STEPS.map(({ label, step }, i) => {
            const isActive = currentStep === step
            const isDone = currentStep > step
            const isFailed = svc.status === 'failed'
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* 연결선 */}
                {i < SVC_STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 10, left: '50%', right: '-50%',
                    height: 2, zIndex: 0,
                    background: isDone ? '#163272' : '#E5E7EB',
                  }} />
                )}
                {/* 스텝 원 */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', zIndex: 1,
                  border: isActive ? '2px solid #163272' : isDone ? 'none' : '2px solid #E5E7EB',
                  background: isDone ? '#163272' : isActive ? '#fff' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6, flexShrink: 0,
                  boxShadow: isActive ? '0 0 0 3px rgba(22,50,114,0.15)' : 'none',
                }}>
                  {isDone
                    ? <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>
                    : isActive
                    ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#163272' }} />
                    : null}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 800 : isDone ? 600 : 500,
                  color: isActive ? '#163272' : isDone ? '#6B7280' : '#D1D5DB',
                  textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* 담당자 메모 (있을 때만) */}
        {svc.status_note && (
          <div style={{
            background: '#FFFBEB', borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            border: '1px solid #FDE68A',
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>📢</span>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
              {svc.status_note}
            </p>
          </div>
        )}

        {/* 제출 서류 목록 */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            📎 필요 서류
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {docInfo.docs.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: '#EBF3FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#163272', fontWeight: 800,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{doc}</span>
              </div>
            ))}
          </div>
          {/* 처리 안내 */}
          <div style={{
            marginTop: 8, padding: '8px 12px', borderRadius: 8,
            background: '#F9FAFB', border: '1px solid #F0F0F0',
          }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
              💡 {docInfo.note}
            </p>
          </div>
        </div>

        {/* 추가 서류 업로드한 목록 */}
        {uploads.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', margin: '0 0 8px', letterSpacing: '0.04em' }}>
              ✅ 추가 업로드된 서류
            </p>
            {uploads.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                textDecoration: 'none',
              }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <span style={{ flex: 1, fontSize: 12, color: '#166534', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <span style={{ fontSize: 10, color: '#86EFAC', fontWeight: 600, flexShrink: 0 }}>
                  {formatSize(f.size)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 하단 액션 영역 */}
      <div style={{
        padding: '12px 18px 16px',
        borderTop: '1px solid #F3F4F6',
        background: '#FAFAFA',
      }}>
        {/* 정산 상태 + 추가 서류 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showUpload ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isPaid ? '#22C55E' : '#F59E0B',
              boxShadow: isPaid ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(245,158,11,0.4)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isPaid ? '#166534' : '#92400E' }}>
              {isPaid ? '정산 완료' : '정산 대기'}
            </span>
          </div>
          <button
            onClick={() => setShowUpload(v => !v)}
            style={{
              background: showUpload ? '#EFF6FF' : '#163272',
              color: showUpload ? '#163272' : '#fff',
              border: showUpload ? '1px solid #BFDBFE' : 'none',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {showUpload ? '← 닫기' : '📎 추가 서류 제출'}
          </button>
        </div>

        {/* 파일 업로드 영역 */}
        {showUpload && (
          <div>
            {/* 드롭존 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #BFDBFE',
                borderRadius: 12, padding: '18px 16px',
                background: '#F0F7FF', textAlign: 'center',
                cursor: 'pointer', marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>📂</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#163272', margin: '0 0 3px' }}>
                {uploading ? '업로드 중...' : '파일을 선택하거나 여기를 탭하세요'}
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                PDF, JPG, PNG, HEIC 등 · 최대 10MB · 여러 파일 선택 가능
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.tiff,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />

            {uploadError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '8px 12px', marginBottom: 6,
              }}>
                <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>⚠️ {uploadError}</p>
              </div>
            )}

            {uploadSuccess && (
              <div style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: 8, padding: '8px 12px',
              }}>
                <p style={{ fontSize: 12, color: '#166534', margin: 0, fontWeight: 700 }}>
                  ✅ 파일이 성공적으로 제출되었습니다!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
