'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyStore } from '@/store/useApplyStore'
import { createClient } from '@/lib/supabase/client'
import { getRequiredDocs } from '@/lib/services-catalog'
import type { TrackType } from '@/lib/services-catalog'
import { Screen, Body, Dock, PrimaryBtn, BackBtn, StepLabel, Question } from '../_components'
import DocScanner from '@/components/ui/DocScanner'

// ─── 서류 메타데이터 ────────────────────────────────────
const DOC_META: Record<string, { icon: string; tip: string }> = {
  death_cert:  { icon: '📋', tip: '스마트폰 카메라로 촬영하셔도 됩니다' },
  family_cert: { icon: '👨‍👩‍👧', tip: '정부24 앱에서 발급 가능합니다' },
  id_card:     { icon: '🪪', tip: '신청인(유족) 본인의 신분증입니다' },
}

const DOC_GUIDE: Record<string, { title: string; notices: string[]; maskingNote?: string }> = {
  id_card: {
    title: '신분증 첨부 유의사항',
    notices: [
      '신청인(유족) 본인의 신분증을 준비해 주세요',
      '주민번호 뒷 6자리는 가리거나 지운 후 첨부해 주세요',
      '빛 반사나 그림자 없이 선명하게 촬영해 주세요',
      '모서리가 모두 나오도록 촬영해 주세요',
    ],
    maskingNote: '주민번호 뒷자리(7자리 중 뒤 6자리)를 반드시 가려주세요',
  },
  death_cert: {
    title: '사망진단서 첨부 유의사항',
    notices: [
      '병원에서 발급받은 사망진단서 원본 또는 스캔본',
      '고인 성함, 사망일이 명확히 보여야 합니다',
      '어두운 배경에 문서만 크게 나오도록 촬영해 주세요',
      '흐리거나 잘린 부분 없이 전체가 보여야 합니다',
    ],
  },
  family_cert: {
    title: '가족관계증명서 첨부 유의사항',
    notices: [
      '정부24(gov.kr) 또는 주민센터에서 발급 가능합니다',
      '발급일로부터 3개월 이내 발급본이어야 합니다',
      '신청인이 고인의 가족임을 확인할 수 있어야 합니다',
      '모서리가 모두 나오도록 촬영 또는 스캔해 주세요',
    ],
  },
}

// ─── 위임장 내용 보기 컴포넌트 ──────────────────────────
function DelegationContentView({ delegatorName }: { delegatorName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 10,
          background: open ? '#EBF3FF' : '#F3F4F6',
          border: `1px solid ${open ? '#BFDBFE' : '#E5E9EF'}`,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: open ? '#2563EB' : '#374151' }}>
          📄 위임장 내용 보기
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{open ? '닫기 ▲' : '펼치기 ▼'}</span>
      </button>

      {open && (
        <div style={{
          border: '1px solid #BFDBFE', borderTop: 'none',
          borderRadius: '0 0 12px 12px', overflow: 'hidden',
        }}>
          <div style={{ background: '#1E3A8A', padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>디지털 유산 사후 행정 대행 위임장</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>에프텀 (개인사업자)</div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#fff' }}>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', marginBottom: 5 }}>제1조  당사자 및 목적</div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                본 위임장은 위임인({delegatorName || '본인'})의 사망 이후 발생하는 디지털 유산 정리 및 행정 대행 업무를 에프텀(수임인)에게 위탁하기 위한 문서입니다.
              </p>
            </div>
            <div style={{ height: 1, background: '#F3F4F6' }} />

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginBottom: 5 }}>제2조  사후 위임의 존속 특약 [핵심 법적 조항]</div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                민법 제127조에도 불구하고, 본 위임 계약 및 대리권은 위임인의 사망으로 인하여 종료되지 아니하며 그 효력이 지속됩니다. 본 위임장의 효력은 위임인의 사망 시점(사망진단서 상의 일시)부터 발생합니다.
              </p>
            </div>
            <div style={{ height: 1, background: '#F3F4F6' }} />

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', marginBottom: 5 }}>제3조  위임 업무의 범위</div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>① 디지털 플랫폼 계정 처리</p>
                <p style={{ margin: '0 0 8px', paddingLeft: 10, color: '#6B7280' }}>카카오·구글·메타 등 계정 해지·삭제·추모계정 전환 신청 및 서류 제출</p>
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>② 정기 결제·구독 해지</p>
                <p style={{ margin: '0 0 8px', paddingLeft: 10, color: '#6B7280' }}>이동통신사·OTT·클라우드 등 유료 구독 서비스 해지 신청</p>
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>③ 금융 계좌 사망 통보 (제한적)</p>
                <p style={{ margin: 0, paddingLeft: 10, color: '#6B7280' }}>사망 사실 통보 및 계정 동결 요청 — 자산 인출·처분 권한 제외, 자산 귀속은 상속법 적용</p>
              </div>
            </div>
            <div style={{ height: 1, background: '#F3F4F6' }} />

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', marginBottom: 5 }}>제4조  상속인 권리 제한 및 면책</div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                수임인이 위임 범위 내에서 수행한 행위는 위임인의 확고한 생전 의사에 따른 것입니다. 법정 상속인은 수임인의 정당한 업무 수행에 민·형사상 이의를 제기할 수 없습니다. 플랫폼 방침이나 불가항력으로 인한 처리 지연·거절에 대해 수임인은 법적 책임을 지지 않습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 서류 안내 Bottom Sheet ─────────────────────────────
function DocGuideSheet({ docType, onConfirm, onScan, onClose }: {
  docType: string; onConfirm: () => void; onScan: () => void; onClose: () => void
}) {
  const guide = DOC_GUIDE[docType] || { title: '서류 첨부 유의사항', notices: ['서류의 모든 내용이 명확히 보여야 합니다'] }
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '24px 24px 0 0',
        padding: '20px 24px 40px', width: '100%', maxWidth: 480,
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: '#E5E9EF', borderRadius: 2, margin: '0 auto 20px' }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          {guide.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {guide.notices.map((notice, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#2563EB',
                color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</div>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{notice}</p>
            </div>
          ))}
        </div>
        {guide.maskingNote && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '12px 14px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, margin: 0 }}>⚠ {guide.maskingNote}</p>
          </div>
        )}
        <div style={{
          background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 20,
          fontSize: 12, color: '#6B7280',
        }}>
          📎 jpg, jpeg, png, pdf · 10MB 이하
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onScan} style={{
            width: '100%', padding: '17px', borderRadius: 14,
            background: '#111827', color: '#fff', fontSize: 16, fontWeight: 800,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span>📷</span> 카메라로 스캔
          </button>
          <button onClick={onConfirm} style={{
            width: '100%', padding: '17px', borderRadius: 14,
            background: '#fff', color: '#2563EB', fontSize: 16, fontWeight: 800,
            border: '1.5px solid #2563EB', cursor: 'pointer',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          }}>
            파일 선택하기
          </button>
        </div>
      </div>
    </div>
  )
}

type Phase = 'docs' | 'sign'

export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { caseId, selectedServices, documentsUploaded, setDocumentUploaded, setDelegation, setStep, delegation } = useApplyStore()

  // death_cert는 신청 시작 시 이미 업로드 완료 — 서류 단계에서 제외
  const DOCS = getRequiredDocs(
    selectedServices.map(s => ({ id: s.id, track: (s.track || 'delete') as TrackType }))
  ).filter(d => d.type !== 'death_cert')

  const [phase, setPhase] = useState<Phase>(() =>
    getRequiredDocs(
      (useApplyStore.getState().selectedServices || []).map(s => ({ id: s.id, track: (s.track || 'delete') as TrackType }))
    ).filter(d => d.type !== 'death_cert').length === 0 ? 'sign' : 'docs'
  )
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guideModal, setGuideModal] = useState<string | null>(null)
  const [scannerDoc, setScannerDoc] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const delegatorName = delegation?.delegatorName || ''
  const delegatorRelation = delegation?.delegatorRelation || ''

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const allDocsUploaded = DOCS.every(d => documentsUploaded[d.type as keyof typeof documentsUploaded])
  const uploadedCount = DOCS.filter(d => documentsUploaded[d.type as keyof typeof documentsUploaded]).length

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
      // AI 서류 검증 비동기 트리거
      if (dbData?.id) {
        fetch('/api/agents/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: dbData.id })
        }).catch(() => {})
      }
    } catch {
      alert('업로드 오류. 다시 시도해 주세요')
    } finally {
      setUploading(null)
    }
  }

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
    ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
    lastPos.current = pos; setHasSig(true)
  }
  const endSign = () => setIsSigning(false)
  const clearSign = () => {
    const c = canvasRef.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setHasSig(false)
  }

  const handleFinish = async () => {
    setError('')
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

  // ── 서류 업로드 단계 ──────────────────────────────────
  if (phase === 'docs') return (
    <Screen>
      {scannerDoc && (
        <DocScanner
          label={DOC_META[scannerDoc]?.icon ? (scannerDoc === 'death_cert' ? '사망진단서' : scannerDoc === 'id_card' ? '신분증' : '가족관계증명서') : '문서'}
          onCapture={file => {
            const type = scannerDoc
            setScannerDoc(null)
            handleFileUpload(type, file)
          }}
          onClose={() => setScannerDoc(null)}
        />
      )}
      {guideModal && (
        <DocGuideSheet
          docType={guideModal}
          onClose={() => setGuideModal(null)}
          onScan={() => {
            const type = guideModal!
            setGuideModal(null)
            setScannerDoc(type)
          }}
          onConfirm={() => {
            const type = guideModal
            setGuideModal(null)
            setTimeout(() => fileInputRefs.current[type]?.click(), 50)
          }}
        />
      )}
      <Body>
        <StepLabel label="서류 첨부" />
        <Question
          label={'서류를 첨부해\n주세요'}
          sub={`사진 촬영 또는 파일 선택 모두 가능합니다 · ${uploadedCount}/${DOCS.length}개 완료`}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DOCS.map(doc => {
            const uploaded = documentsUploaded[doc.type as keyof typeof documentsUploaded]
            const isUploading = uploading === doc.type
            const meta = DOC_META[doc.type] || { icon: '📄', tip: '' }
            return (
              <div key={doc.type}>
                <input
                  ref={el => { fileInputRefs.current[doc.type] = el }}
                  type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files?.[0]) handleFileUpload(doc.type, e.target.files[0])
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => { if (!isUploading) setGuideModal(doc.type) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', borderRadius: 14, cursor: isUploading ? 'default' : 'pointer',
                    background: uploaded ? '#EBF3FF' : '#F8FAFC',
                    border: `1.5px solid ${uploaded ? '#2563EB' : '#E5E9EF'}`,
                    transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: uploaded ? '#2563EB' : '#E5E9EF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {isUploading ? '⏳' : uploaded ? '✅' : meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: uploaded ? '#2563EB' : '#111827' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      {isUploading ? '업로드 중...' : uploaded ? '첨부 완료 · 탭하면 재첨부' : doc.desc}
                    </div>
                  </div>
                  {!uploaded && !isUploading && (
                    <span style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>첨부</span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 20, padding: '14px 16px', background: '#F8FAFC',
          borderRadius: 12, border: '1px solid #E5E9EF',
          fontSize: 12, color: '#9CA3AF', lineHeight: 1.7,
        }}>
          🔒 업로드된 서류는 암호화 보관되며, 처리 완료 후 30일 이내 파기됩니다.
        </div>
      </Body>
      <Dock>
        <PrimaryBtn disabled={!allDocsUploaded} onClick={() => setPhase('sign')}>
          {allDocsUploaded ? '서명하기' : `${DOCS.length - uploadedCount}개 더 첨부해 주세요`}
        </PrimaryBtn>
      </Dock>
    </Screen>
  )

  // ── 전자서명 단계 ──────────────────────────────────────
  return (
    <Screen>
      <Body>
        <StepLabel label="전자서명" />
        <Question label={'위임장에\n서명해 주세요'} sub="에프텀에 해지 대행을 위임하는 전자서명입니다" />

        <p style={{ fontSize: 14, color: '#2563EB', fontWeight: 700, margin: '0 0 24px' }}>
          위임인: {delegatorName} ({delegatorRelation})
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef} width={380} height={200}
            style={{
              width: '100%', height: 200, touchAction: 'none', cursor: 'crosshair',
              border: `2px solid ${hasSig ? '#2563EB' : '#E5E9EF'}`,
              borderRadius: 14, background: '#FAFAFA', transition: 'border-color 0.2s',
            }}
            onTouchStart={startSign} onTouchMove={drawSign} onTouchEnd={endSign}
            onMouseDown={startSign} onMouseMove={drawSign} onMouseUp={endSign} onMouseLeave={endSign}
          />
          {!hasSig && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>
                빈 공간에 손가락으로<br />서명해 주세요
              </div>
            </div>
          )}
        </div>

        {hasSig && (
          <button onClick={clearSign} style={{
            marginTop: 12, background: 'none', border: 'none',
            color: '#9CA3AF', fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', textDecoration: 'underline', padding: 0,
          }}>
            다시 서명하기
          </button>
        )}

        {/* 위임장 내용 보기 */}
        <DelegationContentView delegatorName={delegatorName} />

        <div style={{
          marginTop: 16, padding: '14px 16px', background: '#F8FAFC',
          borderRadius: 12, border: '1px solid #E5E9EF',
          fontSize: 12, color: '#9CA3AF', lineHeight: 1.7,
        }}>
          ⚖ 위의 서명은 「전자서명법」에 따른 법적 효력을 지닌 전자서명입니다.
        </div>
      </Body>
      <Dock>
        <div style={{ display: 'flex', gap: 10 }}>
          <BackBtn onClick={() => { setError(''); setPhase('docs') }} />
          <PrimaryBtn disabled={!hasSig || loading} onClick={handleFinish}>
            {loading ? '저장 중...' : '서명 완료 · 결제하기'}
          </PrimaryBtn>
        </div>
      </Dock>
    </Screen>
  )
}
