'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

// 서류 정의
const DOCUMENTS = [
  {
    type: 'death_cert' as const,
    icon: '📋',
    title: '사망진단서',
    desc: '의료기관에서 발급한 사망진단서',
    required: true,
  },
  {
    type: 'family_cert' as const,
    icon: '👨‍👩‍👧',
    title: '가족관계증명서',
    desc: '정부24 또는 주민센터에서 발급',
    required: true,
  },
  {
    type: 'id_card' as const,
    icon: '🪪',
    title: '신청인 신분증',
    desc: '주민등록증 또는 운전면허증 앞면',
    required: true,
  },
]

// Step 2: 서류 업로드 + 전자서명
export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, documentsUploaded, setDocumentUploaded, setDelegation, setStep } = useApplyStore()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')

  // 전자서명
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const [delegatorName, setDelegatorName] = useState('')
  const [delegatorRelation, setDelegatorRelation] = useState('')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const allDocsUploaded = DOCUMENTS.every(d => documentsUploaded[d.type])

  // ── 서류 업로드 ──
  const handleFileUpload = async (docType: typeof DOCUMENTS[0]['type'], file: File) => {
    if (!caseId) return
    setUploading(docType)
    try {
      const ext = file.name.split('.').pop()
      const path = `cases/${caseId}/${docType}_${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('case-documents')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      // DB 기록
      await supabase.from('case_documents').upsert({
        case_id: caseId,
        doc_type: docType,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      }, { onConflict: 'case_id,doc_type' })

      setDocumentUploaded(docType, true)
    } catch {
      alert('업로드 중 오류가 발생했습니다. 다시 시도해 주세요')
    } finally {
      setUploading(null)
    }
  }

  // ── 서명 캔버스 ──
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const touch = 'touches' in e ? e.touches[0] : e as unknown as MouseEvent
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startSign = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setIsSigning(true)
    lastPos.current = getPos(e)
  }

  const drawSign = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isSigning || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1A1A2E'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasSig(true)
  }

  const endSign = () => setIsSigning(false)

  const clearSign = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  // ── 다음 단계 ──
  const handleNext = async () => {
    setError('')
    if (!allDocsUploaded) { setError('모든 서류를 업로드해 주세요'); return }
    if (!delegatorName) { setError('신청인 성함을 입력해 주세요'); return }
    if (!delegatorRelation) { setError('고인과의 관계를 선택해 주세요'); return }
    if (!hasSig) { setError('위임장에 서명해 주세요'); return }

    setLoading(true)
    try {
      const canvas = canvasRef.current!
      const signatureData = canvas.toDataURL('image/png')

      // 위임장 저장
      await supabase.from('delegations').upsert({
        case_id: caseId,
        delegator_name: delegatorName,
        delegator_relation: delegatorRelation,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      }, { onConflict: 'case_id' })

      setDelegation({ delegatorName, delegatorRelation, signatureData })
      setStep(3)
      router.push('/apply/confirm')
    } catch {
      setError('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div style={{ padding: '32px 24px 16px' }}>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>서류 업로드 & 서명</h1>
        <p className="section-desc">
          법적 처리를 위해 아래 서류를 업로드하고<br />위임장에 서명해 주세요
        </p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {error && (
          <div className="alert-banner alert-error"><span>⚠️</span><span>{error}</span></div>
        )}

        {/* 서류 업로드 */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
            필수 서류
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DOCUMENTS.map(doc => (
              <label key={doc.type} style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleFileUpload(doc.type, e.target.files[0])}
                  capture="environment"
                />
                <div className={`upload-card ${documentsUploaded[doc.type] ? 'uploaded' : ''}`}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <span style={{ fontSize: '28px' }}>{doc.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{doc.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{doc.desc}</div>
                    </div>
                  </div>
                  <div>
                    {uploading === doc.type ? (
                      <span style={{ fontSize: '13px', color: 'var(--color-accent)' }}>업로드 중...</span>
                    ) : documentsUploaded[doc.type] ? (
                      <span style={{ fontSize: '22px' }}>✅</span>
                    ) : (
                      <span style={{
                        padding: '7px 14px', borderRadius: '8px',
                        background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                        fontSize: '13px', fontWeight: 700,
                      }}>촬영</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* 위임장 서명 */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>전자 위임장</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '20px', lineHeight: 1.6 }}>
            에프텀에 디지털 구독 해지 절차 일체를 위임하는 법적 위임장입니다
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">신청인 성함 <span className="required">*</span></label>
              <input className="form-input" type="text" placeholder="홍길동"
                value={delegatorName} onChange={e => setDelegatorName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">고인과의 관계 <span className="required">*</span></label>
              <select className="form-input" value={delegatorRelation} onChange={e => setDelegatorRelation(e.target.value)}
                style={{ appearance: 'none' }}>
                <option value="">관계 선택</option>
                {['자녀', '배우자', '부모', '형제/자매', '손자/손녀', '기타'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 서명 캔버스 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label">서명 <span className="required">*</span></label>
              <button onClick={clearSign} className="btn-ghost btn" style={{ fontSize: '13px', padding: '4px 8px' }}>
                초기화
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={380}
              height={160}
              className="signature-pad"
              style={{ width: '100%', height: '160px', touchAction: 'none' }}
              onTouchStart={startSign}
              onTouchMove={drawSign}
              onTouchEnd={endSign}
              onMouseDown={startSign}
              onMouseMove={drawSign}
              onMouseUp={endSign}
              onMouseLeave={endSign}
            />
            {!hasSig && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-3)', marginTop: '8px' }}>
                ✍️ 손가락으로 서명해 주세요
              </p>
            )}
          </div>

          <div className="alert-banner alert-info">
            <span>⚖️</span>
            <span style={{ fontSize: '13px', lineHeight: 1.5 }}>
              위의 서명은 법적 효력을 지닌 전자서명으로 처리됩니다
            </span>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-primary" onClick={handleNext} disabled={loading}>
          {loading ? '저장 중...' : '다음 단계 →'}
        </button>
      </div>
    </div>
  )
}
