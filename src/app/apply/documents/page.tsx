'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { getRequiredDocs } from '@/lib/services-catalog'
import type { TrackType } from '@/lib/services-catalog'
import Button from '@/components/ui/Button'

type DocGuide = {
  icon: string
  title: string
  notices: string[]
  maskingNote?: string
  formats: string
}

const DOC_META: Record<string, { icon: string; tip: string }> = {
  death_cert:  { icon: '📋', tip: '스마트폰 카메라로 촬영하셔도 됩니다' },
  family_cert: { icon: '👨‍👩‍👧', tip: '정부24 앱에서 발급 가능합니다' },
  id_card:     { icon: '🪪', tip: '신청인(유족) 본인의 신분증입니다' },
}

const DOC_GUIDE: Record<string, DocGuide> = {
  id_card: {
    icon: '🪪',
    title: '신분증 첨부 유의사항',
    notices: [
      '신청인(유족) 본인의 신분증을 준비해 주세요',
      '주민번호 뒷 6자리는 가리거나 지운 후 첨부해 주세요',
      '빛 반사나 그림자 없이 선명하게 촬영해 주세요',
      '모서리가 모두 나오도록 촬영해 주세요',
    ],
    maskingNote: '주민번호 뒷자리(7자리 중 뒤 6자리)를 반드시 가려주세요',
    formats: 'jpg, jpeg, png, pdf · 10MB 이하',
  },
  death_cert: {
    icon: '📋',
    title: '사망진단서 첨부 유의사항',
    notices: [
      '병원에서 발급받은 사망진단서 원본 또는 스캔본',
      '고인 성함, 사망일이 명확히 보여야 합니다',
      '어두운 배경에 문서만 크게 나오도록 촬영해 주세요',
      '흐리거나 잘린 부분 없이 전체가 보여야 합니다',
    ],
    formats: 'jpg, jpeg, png, pdf · 10MB 이하',
  },
  family_cert: {
    icon: '📄',
    title: '가족관계증명서 첨부 유의사항',
    notices: [
      '정부24(gov.kr) 또는 주민센터에서 발급 가능합니다',
      '발급일로부터 3개월 이내 발급본이어야 합니다',
      '신청인이 고인의 가족임을 확인할 수 있어야 합니다',
      '모서리가 모두 나오도록 촬영 또는 스캔해 주세요',
    ],
    formats: 'jpg, jpeg, png, pdf · 10MB 이하',
  },
}

// 서류 가이드 모달
function DocGuideModal({
  docType,
  onConfirm,
  onClose,
}: {
  docType: string
  onConfirm: () => void
  onClose: () => void
}) {
  const guide = DOC_GUIDE[docType] || {
    icon: '📄', title: '서류 첨부 유의사항',
    notices: ['서류의 모든 내용이 명확히 보여야 합니다'],
    formats: 'jpg, jpeg, png, pdf · 10MB 이하',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '28px 24px 40px', width: '100%', maxWidth: 480,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 핸들 */}
        <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 24px' }} />

        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
          {guide.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {guide.notices.map((notice, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#163272',
                color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{notice}</p>
            </div>
          ))}
        </div>

        {guide.maskingNote && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '12px 14px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, margin: 0 }}>
              ⚠️ {guide.maskingNote}
            </p>
          </div>
        )}

        <div style={{
          background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 24,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 16 }}>📎</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 2px' }}>첨부 가능 파일</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{guide.formats}</p>
          </div>
        </div>

        <button
          onClick={onConfirm}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: '#163272', color: '#fff',
            fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em',
          }}
        >
          파일 선택하기
        </button>
      </div>
    </div>
  )
}

type Phase = 'docs' | 'delegator' | 'sign'

export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, selectedServices, documentsUploaded, setDocumentUploaded, setDelegation, setStep } = useApplyStore()

  // 선택된 서비스 기반 동적 서류 목록
  // 트랙 정보가 있으면 트랙별 서류, 없으면 레거시 방식
  const DOCS = getRequiredDocs(
    selectedServices.map(s => ({ id: s.id, track: (s.track || 'delete') as TrackType }))
  )

  const [phase, setPhase] = useState<Phase>('docs')
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guideModal, setGuideModal] = useState<string | null>(null) // 가이드 모달 표시할 docType
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // 위임 정보
  const [delegatorName, setDelegatorName] = useState('')
  const [delegatorRelation, setDelegatorRelation] = useState('')

  // 로그인 사용자 이름 자동 입력
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
        if (name) setDelegatorName(name)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 서명
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const allDocsUploaded = DOCS.every(d => documentsUploaded[d.type as keyof typeof documentsUploaded])
  const uploadedCount = DOCS.filter(d => documentsUploaded[d.type as keyof typeof documentsUploaded]).length

  // 파일 업로드
  const handleFileUpload = async (docType: string, file: File) => {
    if (!caseId) return
    setUploading(docType)
    try {
      const ext = file.name.split('.').pop()
      const path = `cases/${caseId}/${docType}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('case-documents').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: dbData, error: dbErr } = await supabase.from('case_documents').upsert({
        case_id: caseId, doc_type: docType, storage_path: path,
        file_name: file.name, file_size: file.size, mime_type: file.type,
      }, { onConflict: 'case_id,doc_type' }).select().single()
      if (dbErr) throw dbErr
      
      setDocumentUploaded(docType as keyof typeof documentsUploaded, true)

      // 🤖 서류 검증 에이전트 자동 트리거 (비동기)
      if (dbData?.id) {
        fetch('/api/agents/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: dbData.id })
        }).catch(err => console.error('Verification Trigger Failed:', err))
      }
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
      router.push('/apply/payment')
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
        {/* 가이드 모달 */}
        {guideModal && (
          <DocGuideModal
            docType={guideModal}
            onClose={() => setGuideModal(null)}
            onConfirm={() => {
              setGuideModal(null)
              setTimeout(() => fileInputRefs.current[guideModal]?.click(), 50)
            }}
          />
        )}

        <div className="animate-slide-up" style={{ flex: 1, padding: '32px 24px' }}>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-label-strong)', marginBottom: '8px', lineHeight: 1.3 }}>
            서류를 첨부해 주세요
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>
            사진 촬영 또는 파일 선택 모두 가능합니다<br/>
            <span style={{ color: 'var(--color-primary-normal)', fontWeight: 700 }}>{uploadedCount} / {DOCS.length}개 완료</span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DOCS.map(doc => {
              const uploaded = documentsUploaded[doc.type as keyof typeof documentsUploaded]
              const isUploading = uploading === doc.type
              const meta = DOC_META[doc.type] || { icon: '📄', tip: '' }
              return (
                <div key={doc.type}>
                  {/* hidden file input — capture 없음, 갤러리/파일 선택 가능 */}
                  <input
                    ref={el => { fileInputRefs.current[doc.type] = el }}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload(doc.type, e.target.files[0])
                      e.target.value = ''
                    }}
                  />
                  <div
                    className={uploaded ? 'card-soft' : 'card'}
                    onClick={() => {
                      if (!uploaded && !isUploading) setGuideModal(doc.type)
                    }}
                    style={{
                      padding: '20px',
                      borderColor: uploaded ? 'var(--color-primary-normal)' : 'var(--color-line-normal-normal)',
                      background: uploaded ? 'var(--color-blue-99)' : 'var(--color-common-100)',
                      display: 'flex', alignItems: 'center', gap: '16px',
                      transition: 'all 0.2s',
                      cursor: uploaded || isUploading ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-12)',
                      background: uploaded ? 'var(--color-primary-normal)' : 'var(--color-background-normal-alternative)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0,
                    }}>
                      {isUploading ? '⏳' : uploaded ? '✅' : meta.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-label-strong)', letterSpacing: '-0.02em' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)', marginTop: '2px' }}>{doc.desc}</div>
                      {uploaded && (
                        <div style={{ fontSize: '12px', color: 'var(--color-primary-normal)', marginTop: '4px', fontWeight: 600 }}>
                          첨부 완료 · 다시 첨부하려면 탭하세요
                        </div>
                      )}
                    </div>
                    {!uploaded && !isUploading && (
                      <span style={{
                        padding: '6px 14px', borderRadius: 'var(--radius-8)',
                        background: '#163272', color: '#fff',
                        fontSize: '13px', fontWeight: 700, flexShrink: 0,
                      }}>
                        첨부
                      </span>
                    )}
                    {isUploading && (
                      <span style={{ fontSize: '13px', color: 'var(--color-primary-normal)', fontWeight: 600, flexShrink: 0 }}>
                        업로드 중...
                      </span>
                    )}
                  </div>
                  {/* 완료된 서류도 재첨부 가능 */}
                  {uploaded && (
                    <button
                      onClick={() => setGuideModal(doc.type)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: '#9CA3AF', padding: '4px 4px 0',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      다시 첨부하기
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: '24px', padding: '14px 16px',
            background: '#F8FAFC', borderRadius: 12, border: '1px solid #E8EAF0',
            fontSize: '13px', color: '#6B7280', lineHeight: 1.6,
          }}>
            🔒 업로드된 서류는 암호화 보관되며, 처리 완료 후 30일 이내 파기됩니다.
          </div>
        </div>

        <div className="cta-dock">
          <Button block disabled={!allDocsUploaded} onClick={() => setPhase('delegator')}>
            {allDocsUploaded ? '다음 단계' : `${DOCS.length - uploadedCount}개 더 첨부해 주세요`}
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
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-alternative)', display: 'block', marginBottom: '4px' }}>
                신청인 성함 *
              </label>
              <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, margin: '0 0 12px' }}>
                ⚠️ 본명으로 기재 필수 (위임장에 그대로 사용됩니다)
              </p>
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
