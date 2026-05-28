'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

// 서류 정보
const DOCS = [
  {
    type: 'death_cert' as const,
    icon: '📋',
    title: '사망진단서',
    desc: '의료기관에서 발급한 사망진단서',
    tip: '스마트폰 카메라로 촬영하셔도 됩니다',
    required: true,
  },
  {
    type: 'family_cert' as const,
    icon: '👨‍👩‍👧',
    title: '가족관계증명서',
    desc: '정부24 또는 주민센터에서 발급',
    tip: '고인과의 관계를 확인하기 위해 필요합니다',
    required: true,
  },
  {
    type: 'id_card' as const,
    icon: '🪪',
    title: '신청인 신분증',
    desc: '주민등록증 또는 운전면허증 앞면',
    tip: '신청인(유족) 본인의 신분증입니다',
    required: true,
  },
]

type Phase = 'docs' | 'delegator' | 'sign'

export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, documentsUploaded, setDocumentUploaded, setDelegation, setStep } = useApplyStore()

  const [phase, setPhase] = useState<Phase>('docs')
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 위임 정보
  const [delegatorName, setDelegatorName] = useState('')
  const [delegatorRelation, setDelegatorRelation] = useState('')

  // 서명
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const allDocsUploaded = DOCS.every(d => documentsUploaded[d.type])
  const uploadedCount = DOCS.filter(d => documentsUploaded[d.type]).length

  // 파일 업로드
  const handleFileUpload = async (docType: typeof DOCS[0]['type'], file: File) => {
    if (!caseId) return
    setUploading(docType)
    try {
      const ext = file.name.split('.').pop()
      const path = `cases/${caseId}/${docType}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('case-documents').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      await supabase.from('case_documents').upsert({
        case_id: caseId, doc_type: docType, storage_path: path,
        file_name: file.name, file_size: file.size, mime_type: file.type,
      }, { onConflict: 'case_id,doc_type' })
      setDocumentUploaded(docType, true)
    } catch {
      alert('업로드 오류. 다시 시도해 주세요')
    } finally {
      setUploading(null)
    }
  }

  // 서명 캔버스
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
    e.preventDefault(); setIsSigning(true); lastPos.current = getPos(e)
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
    ctx.strokeStyle = '#171719'; ctx.lineWidth = 3
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
    lastPos.current = pos; setHasSig(true)
  }

  const endSign = () => setIsSigning(false)

  const clearSign = () => {
    const c = canvasRef.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setHasSig(false)
  }

  // 최종 제출
  const handleFinish = async () => {
    setError('')
    if (!delegatorName) { setError('신청인 성함을 입력해 주세요'); return }
    if (!delegatorRelation) { setError('고인과의 관계를 선택해 주세요'); return }
    if (!hasSig) { setError('서명해 주세요'); return }

    setLoading(true)
    try {
      const signatureData = canvasRef.current!.toDataURL('image/png')
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

  // ── 서류 업로드 단계 ──
  if (phase === 'docs') {
    return (
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="animate-slide-up" style={{ flex: 1, padding: '32px 24px' }}>
          
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-label-strong)', marginBottom: '8px', lineHeight: 1.3 }}>
            서류를 업로드해 주세요
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>
            카메라로 촬영하거나 파일을 선택해 주세요<br/>
            <span style={{ color: 'var(--color-primary-normal)', fontWeight: 700 }}>{uploadedCount} / {DOCS.length}개 완료</span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DOCS.map(doc => {
              const uploaded = documentsUploaded[doc.type]
              const isUploading = uploading === doc.type
              return (
                <label key={doc.type} style={{ cursor: 'pointer', display: 'block' }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFileUpload(doc.type, e.target.files[0])}
                  />
                  <div className={uploaded ? 'card-soft' : 'card'} style={{
                    padding: '20px',
                    borderColor: uploaded ? 'var(--color-primary-normal)' : 'var(--color-line-normal-normal)',
                    background: uploaded ? 'var(--color-blue-99)' : 'var(--color-common-100)',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-12)',
                      background: uploaded ? 'var(--color-primary-normal)' : 'var(--color-background-normal-alternative)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0,
                    }}>
                      {isUploading ? '⏳' : uploaded ? '✅' : doc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.02em' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)', marginTop: '2px' }}>{doc.desc}</div>
                    </div>
                    {!uploaded && !isUploading && (
                      <span style={{
                        padding: '6px 14px', borderRadius: 'var(--radius-8)',
                        background: 'var(--color-coolNeutral-96)', color: 'var(--color-label-strong)',
                        fontSize: '13px', fontWeight: 700, flexShrink: 0,
                      }}>
                        업로드
                      </span>
                    )}
                    {isUploading && (
                      <span style={{ fontSize: '13px', color: 'var(--color-primary-normal)', fontWeight: 600, flexShrink: 0 }}>
                        처리 중...
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>

          <div className="card-soft" style={{
            marginTop: '24px', padding: '16px',
            fontSize: '13px', color: 'var(--color-label-alternative)', lineHeight: 1.6,
          }}>
            🔒 업로드된 서류는 암호화되어 안전하게 보관되며, 해지 처리 목적 외에는 사용되지 않습니다.
          </div>
        </div>

        <div className="cta-dock">
          <Button block disabled={!allDocsUploaded} onClick={() => setPhase('delegator')}>
            {allDocsUploaded ? '다음 단계' : `${DOCS.length - uploadedCount}개 더 업로드해 주세요`}
          </Button>
        </div>
      </div>
    )
  }

  // ── 위임 정보 입력 단계 ──
  if (phase === 'delegator') {
    const RELATIONS = ['자녀', '배우자', '부모', '형제/자매', '손자/손녀', '기타']
    return (
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="animate-slide-up" style={{ flex: 1, padding: '32px 24px' }}>
          
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-label-strong)', marginBottom: '8px', lineHeight: 1.3 }}>
            신청인 정보를<br />입력해 주세요
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>
            위임장에 기재될 유족(신청인) 정보입니다
          </p>

          {error && (
            <div className="card-soft" style={{ padding: '12px 16px', marginBottom: '24px', color: 'var(--color-status-negative)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-alternative)', display: 'block', marginBottom: '12px' }}>
                신청인 성함 *
              </label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={delegatorName}
                onChange={e => { setDelegatorName(e.target.value); setError('') }}
                autoFocus
                className="input"
                style={{ padding: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-alternative)', display: 'block', marginBottom: '16px' }}>
                고인과의 관계 *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {RELATIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => { setDelegatorRelation(r); setError('') }}
                    style={{
                      padding: '10px 18px', borderRadius: 'var(--radius-pill)',
                      border: `1.5px solid ${delegatorRelation === r ? 'var(--color-label-strong)' : 'var(--color-line-normal-normal)'}`,
                      background: delegatorRelation === r ? 'var(--color-label-strong)' : 'var(--color-common-100)',
                      color: delegatorRelation === r ? 'var(--color-common-100)' : 'var(--color-label-alternative)',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cta-dock" style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setPhase('docs')} style={{ width: '56px', padding: 0 }}>
            ←
          </Button>
          <Button block onClick={() => {
            if (!delegatorName) { setError('신청인 성함을 입력해 주세요'); return }
            if (!delegatorRelation) { setError('고인과의 관계를 선택해 주세요'); return }
            setError(''); setPhase('sign')
          }} style={{ flex: 1 }}>
            서명하기
          </Button>
        </div>
      </div>
    )
  }

  // ── 전자서명 단계 ──
  return (
    <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="animate-slide-up" style={{ flex: 1, padding: '32px 24px' }}>
        
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-label-strong)', marginBottom: '8px', lineHeight: 1.3 }}>
          위임장에<br />서명해 주세요
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '8px' }}>
          에프텀에 해지 대행을 위임하는 전자서명입니다
        </p>
        <p style={{ fontSize: '14px', color: 'var(--color-primary-normal)', fontWeight: 700, marginBottom: '28px' }}>
          위임인: {delegatorName} ({delegatorRelation})
        </p>

        {error && (
          <div className="card-soft" style={{ padding: '12px 16px', marginBottom: '24px', color: 'var(--color-status-negative)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* 서명 영역 */}
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={380}
            height={200}
            style={{
              width: '100%', height: '200px', touchAction: 'none',
              border: '2px solid', borderColor: hasSig ? 'var(--color-primary-normal)' : 'var(--color-line-normal-normal)',
              borderRadius: 'var(--radius-16)', background: 'var(--color-coolNeutral-99)', cursor: 'crosshair',
              transition: 'border-color 0.2s',
            }}
            onTouchStart={startSign}
            onTouchMove={drawSign}
            onTouchEnd={endSign}
            onMouseDown={startSign}
            onMouseMove={drawSign}
            onMouseUp={endSign}
            onMouseLeave={endSign}
          />
          {!hasSig && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✍️</div>
              <div style={{ fontSize: '14px', color: 'var(--color-label-alternative)', fontWeight: 600 }}>
                가운데 빈 공간에<br/>손가락으로 서명해 주세요
              </div>
            </div>
          )}
        </div>

        {hasSig && (
          <button
            onClick={clearSign}
            style={{
              marginTop: '16px', background: 'none', border: 'none',
              color: 'var(--color-label-assistive)', fontSize: '14px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 600, textDecoration: 'underline',
              padding: 0
            }}
          >
            다시 서명하기
          </button>
        )}

        <div className="card-soft" style={{
          marginTop: '24px', padding: '16px',
          fontSize: '13px', color: 'var(--color-label-alternative)', lineHeight: 1.6,
        }}>
          ⚖️ 위의 서명은 「전자서명법」에 따른 법적 효력을 지닌 전자서명으로 처리됩니다.
        </div>
      </div>

      <div className="cta-dock" style={{ display: 'flex', gap: '12px' }}>
        <Button variant="secondary" onClick={() => { setError(''); setPhase('delegator') }} style={{ width: '56px', padding: 0 }}>
          ←
        </Button>
        <Button block disabled={!hasSig || loading} onClick={handleFinish} style={{ flex: 1 }}>
          {loading ? '저장 중...' : '서명 완료'}
        </Button>
      </div>
    </div>
  )
}
