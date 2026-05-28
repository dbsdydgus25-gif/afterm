'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'

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

// Step 2: 서류 업로드 + 전자서명
// 문서 업로드 → 위임 정보 → 서명 단계로 진행
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
    ctx.strokeStyle = '#1A1A2E'; ctx.lineWidth = 2.5
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
      <div style={{ minHeight: 'calc(100dvh - 59px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '40px 24px' }}>
          {/* 진행 바 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                height: '4px', flex: 1, borderRadius: '100px',
                background: i <= 1 ? '#3B6FE8' : '#E2E8F0',
              }} />
            ))}
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '10px', lineHeight: 1.25 }}>
            서류를 업로드해 주세요
          </h2>
          <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '8px' }}>
            카메라로 촬영하거나 파일을 선택해 주세요
          </p>
          <p style={{ fontSize: '13px', color: '#3B6FE8', fontWeight: 700, marginBottom: '32px' }}>
            {uploadedCount} / {DOCS.length}개 완료
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
                  <div style={{
                    padding: '18px',
                    border: `2px solid ${uploaded ? '#1A1A2E' : '#E2E8F0'}`,
                    borderRadius: '14px',
                    background: uploaded ? '#F7F8FA' : '#fff',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: uploaded ? '#1A1A2E' : '#F7F8FA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0,
                    }}>
                      {isUploading ? '⏳' : uploaded ? '✅' : doc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', marginBottom: '3px' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9AA3B2' }}>{doc.desc}</div>
                    </div>
                    {!uploaded && !isUploading && (
                      <span style={{
                        padding: '7px 14px', borderRadius: '8px',
                        background: '#1A1A2E', color: '#fff',
                        fontSize: '12px', fontWeight: 700, flexShrink: 0,
                      }}>
                        업로드
                      </span>
                    )}
                    {isUploading && (
                      <span style={{ fontSize: '13px', color: '#3B6FE8', fontWeight: 600, flexShrink: 0 }}>
                        업로드 중...
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>

          <div style={{
            marginTop: '20px', padding: '14px 16px',
            background: '#F7F8FA', borderRadius: '12px',
            fontSize: '13px', color: '#9AA3B2', lineHeight: 1.6,
          }}>
            🔒 업로드된 서류는 암호화되어 안전하게 보관되며, 해지 처리 목적 외에는 사용되지 않습니다.
          </div>
        </div>

        <div style={{
          padding: '16px 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          background: '#fff', borderTop: '1px solid #F0F2F5',
        }}>
          <button
            onClick={() => setPhase('delegator')}
            disabled={!allDocsUploaded}
            style={{
              width: '100%', height: '52px', borderRadius: '12px', border: 'none',
              background: allDocsUploaded ? '#1A1A2E' : '#E2E8F0',
              color: allDocsUploaded ? '#fff' : '#9AA3B2',
              fontSize: '16px', fontWeight: 700,
              cursor: allDocsUploaded ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {allDocsUploaded ? '다음 단계 →' : `${DOCS.length - uploadedCount}개 더 업로드해 주세요`}
          </button>
        </div>
      </div>
    )
  }

  // ── 위임 정보 입력 단계 ──
  if (phase === 'delegator') {
    const RELATIONS = ['자녀', '배우자', '부모', '형제/자매', '손자/손녀', '기타']
    return (
      <div style={{ minHeight: 'calc(100dvh - 59px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '40px 24px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height: '4px', flex: 1, borderRadius: '100px', background: i <= 1 ? '#3B6FE8' : '#E2E8F0' }} />
            ))}
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '10px', lineHeight: 1.25 }}>
            신청인 정보를<br />입력해 주세요
          </h2>
          <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '36px' }}>
            위임장에 기재될 유족(신청인) 정보입니다
          </p>

          {error && (
            <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: '12px' }}>
                신청인 성함 *
              </label>
              <input
                type="text"
                placeholder="홍길동"
                value={delegatorName}
                onChange={e => { setDelegatorName(e.target.value); setError('') }}
                autoFocus
                style={{
                  width: '100%', height: '52px', padding: '0 0',
                  border: 'none', borderBottom: '2.5px solid #3B6FE8',
                  fontSize: '22px', fontWeight: 700, fontFamily: 'inherit',
                  color: '#1A1A2E', background: 'transparent', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: '12px' }}>
                고인과의 관계 *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {RELATIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => { setDelegatorRelation(r); setError('') }}
                    style={{
                      padding: '10px 18px', borderRadius: '100px',
                      border: `2px solid ${delegatorRelation === r ? '#1A1A2E' : '#E2E8F0'}`,
                      background: delegatorRelation === r ? '#1A1A2E' : '#fff',
                      color: delegatorRelation === r ? '#fff' : '#4A5568',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          background: '#fff', borderTop: '1px solid #F0F2F5',
          display: 'flex', gap: '12px',
        }}>
          <button
            onClick={() => setPhase('docs')}
            style={{
              width: '52px', height: '52px', borderRadius: '12px',
              border: '1.5px solid #E2E8F0', background: '#fff',
              fontSize: '18px', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >←</button>
          <button
            onClick={() => {
              if (!delegatorName) { setError('신청인 성함을 입력해 주세요'); return }
              if (!delegatorRelation) { setError('고인과의 관계를 선택해 주세요'); return }
              setError(''); setPhase('sign')
            }}
            style={{
              flex: 1, height: '52px', borderRadius: '12px', border: 'none',
              background: '#1A1A2E', color: '#fff', fontSize: '16px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            서명하기 →
          </button>
        </div>
      </div>
    )
  }

  // ── 전자서명 단계 ──
  return (
    <div style={{ minHeight: 'calc(100dvh - 59px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: '4px', flex: 1, borderRadius: '100px', background: i <= 1 ? '#3B6FE8' : '#E2E8F0' }} />
          ))}
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.04em', color: '#1A1A2E', marginBottom: '10px', lineHeight: 1.25 }}>
          위임장에<br />서명해 주세요
        </h2>
        <p style={{ fontSize: '14px', color: '#9AA3B2', marginBottom: '8px' }}>
          에프텀에 해지 대행을 위임하는 전자서명입니다
        </p>
        <p style={{ fontSize: '13px', color: '#3B6FE8', fontWeight: 600, marginBottom: '28px' }}>
          {delegatorName} ({delegatorRelation})
        </p>

        {error && (
          <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
            ⚠️ {error}
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
              border: '2px solid', borderColor: hasSig ? '#1A1A2E' : '#E2E8F0',
              borderRadius: '16px', background: '#FAFAFA', cursor: 'crosshair',
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
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>✍️</div>
              <div style={{ fontSize: '13px', color: '#9AA3B2', fontWeight: 500 }}>
                손가락으로 서명해 주세요
              </div>
            </div>
          )}
        </div>

        {hasSig && (
          <button
            onClick={clearSign}
            style={{
              marginTop: '12px', background: 'none', border: 'none',
              color: '#9AA3B2', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500, textDecoration: 'underline',
            }}
          >
            다시 서명하기
          </button>
        )}

        <div style={{
          marginTop: '20px', padding: '14px 16px',
          background: '#F7F8FA', borderRadius: '12px',
          fontSize: '13px', color: '#9AA3B2', lineHeight: 1.6,
        }}>
          ⚖️ 위의 서명은 「전자서명법」에 따른 법적 효력을 지닌 전자서명으로 처리됩니다.
        </div>
      </div>

      <div style={{
        padding: '16px 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        background: '#fff', borderTop: '1px solid #F0F2F5',
        display: 'flex', gap: '12px',
      }}>
        <button
          onClick={() => { setError(''); setPhase('delegator') }}
          style={{
            width: '52px', height: '52px', borderRadius: '12px',
            border: '1.5px solid #E2E8F0', background: '#fff',
            fontSize: '18px', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >←</button>
        <button
          onClick={handleFinish}
          disabled={!hasSig || loading}
          style={{
            flex: 1, height: '52px', borderRadius: '12px', border: 'none',
            background: hasSig && !loading ? '#1A1A2E' : '#E2E8F0',
            color: hasSig ? '#fff' : '#9AA3B2',
            fontSize: '16px', fontWeight: 700,
            cursor: hasSig && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          {loading ? '저장 중...' : '서명 완료 →'}
        </button>
      </div>
    </div>
  )
}
