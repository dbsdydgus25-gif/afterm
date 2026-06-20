'use client'
// 2레벨 캐러셀:
// ① 바깥(가로): 고인별 케이스 스와이프
// ② 안쪽(가로): 각 케이스 내 서비스 카드 스와이프

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ServiceCard from './ServiceCard'

const CASE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  submitted:  { label: '접수 완료', color: '#2563EB', bg: '#EFF6FF' },
  reviewing:  { label: '서류 확인', color: '#7C3AED', bg: '#F5F3FF' },
  processing: { label: '처리 중',   color: '#D97706', bg: '#FFFBEB' },
  completed:  { label: '처리 완료', color: '#059669', bg: '#ECFDF5' },
}
const STATUS_ORDER = ['submitted', 'reviewing', 'processing', 'completed']

function shortId(id: string) {
  return id.replace(/-/g, '').toUpperCase().slice(0, 10)
}

type CaseItem = {
  id: string
  deceased_name: string
  status: string
  created_at: string
  payment_status: string
  paid_amount: number | null
  case_services: {
    id: string
    service_name: string
    service_category: string
    status: string
    status_note?: string
  }[]
}

type Props = { activeCases: CaseItem[]; doneCases: CaseItem[]; userId: string }

export default function OrdersClient({ activeCases: initialActive, doneCases, userId }: Props) {
  const [tab, setTab] = useState<'active' | 'done'>('active')
  const [cases, setCases] = useState(initialActive)
  const [cancelTarget, setCancelTarget] = useState<CaseItem | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const supabase = createClient()

  const displayCases = tab === 'active' ? cases : doneCases

  const switchTab = (t: 'active' | 'done') => {
    setTab(t)
    setCaseIdx(0)
    caseScrollRef.current?.scrollTo({ left: 0, behavior: 'instant' })
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: cancelTarget.id, reason: '고객 요청 취소' }),
      })
      const data = await res.json()
      if (!res.ok) { setCancelError(data.error || '취소 실패'); setCancelling(false); return }
      setCases(prev => prev.filter(c => c.id !== cancelTarget.id))
      setCancelTarget(null)
    } catch {
      setCancelError('네트워크 오류가 발생했습니다')
    }
    setCancelling(false)
  }

  // case_services 변경 실시간 구독
  useEffect(() => {
    const caseIds = initialActive.map(c => c.id)
    if (caseIds.length === 0) return

    const channel = supabase
      .channel('orders_svc')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'case_services' },
        (payload) => {
          const updated = payload.new as any
          setCases(prev => prev.map(c => ({
            ...c,
            case_services: c.case_services.map(s =>
              s.id === updated.id
                ? { ...s, status: updated.status, status_note: updated.status_note }
                : s
            ),
          })))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // 현재 케이스 인덱스
  const [caseIdx, setCaseIdx] = useState(0)
  // 서비스 인덱스 (케이스별)
  const [svcIdxMap, setSvcIdxMap] = useState<Record<number, number>>({})

  const caseScrollRef = useRef<HTMLDivElement>(null)
  // 각 케이스의 서비스 스크롤 컨테이너 ref 배열
  const svcScrollRefs = useRef<(HTMLDivElement | null)[]>([])

  // 케이스 스크롤 감지
  const handleCaseScroll = useCallback(() => {
    const el = caseScrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setCaseIdx(Math.min(idx, displayCases.length - 1))
  }, [displayCases.length])

  // 서비스 스크롤 감지
  const handleSvcScroll = useCallback((cIdx: number) => {
    const el = svcScrollRefs.current[cIdx]
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setSvcIdxMap(prev => ({ ...prev, [cIdx]: idx }))
  }, [])

  const goToCase = (idx: number) => {
    caseScrollRef.current?.scrollTo({ left: idx * (caseScrollRef.current.clientWidth), behavior: 'smooth' })
    setCaseIdx(idx)
  }

  const goToSvc = (cIdx: number, sIdx: number) => {
    const el = svcScrollRefs.current[cIdx]
    if (!el) return
    el.scrollTo({ left: sIdx * el.clientWidth, behavior: 'smooth' })
    setSvcIdxMap(prev => ({ ...prev, [cIdx]: sIdx }))
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* 취소 확인 모달 */}
      {cancelTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => { setCancelTarget(null); setCancelError('') }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>신청 취소</h3>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                <b>{cancelTarget.deceased_name}</b>님 신청을 취소하시겠습니까?<br />
                결제 금액 <b>{cancelTarget.paid_amount?.toLocaleString()}원</b>이<br />
                3~5 영업일 내 환불됩니다.
              </p>
            </div>
            {cancelError && <p style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', margin: '0 0 12px', fontWeight: 600 }}>⚠️ {cancelError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setCancelTarget(null); setCancelError('') }} style={{
                flex: 1, padding: '14px', borderRadius: 14, background: '#F3F4F6',
                color: '#374151', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
              }}>돌아가기</button>
              <button onClick={handleCancel} disabled={cancelling} style={{
                flex: 1, padding: '14px', borderRadius: 14, background: '#DC2626',
                color: '#fff', fontSize: 15, fontWeight: 700, border: 'none',
                cursor: cancelling ? 'default' : 'pointer', opacity: cancelling ? 0.7 : 1,
              }}>{cancelling ? '처리 중...' : '취소하기'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 바 ── */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #E8EAF0', flexShrink: 0 }}>
        {([['active', '진행 중', cases.length], ['done', '완료/취소', doneCases.length]] as [string, string, number][]).map(([t, label, cnt]) => (
          <button key={t} onClick={() => switchTab(t as 'active' | 'done')} style={{
            flex: 1, padding: '13px 0', fontSize: 14, fontWeight: tab === t ? 800 : 600,
            color: tab === t ? '#2563EB' : '#9CA3AF',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent',
            fontFamily: 'inherit',
          }}>
            {label}{cnt > 0 && <span style={{ fontSize: 12, background: tab === t ? '#2563EB' : '#E5E9EF', color: tab === t ? '#fff' : '#9CA3AF', padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* ── 케이스 인디케이터 (상단) ── */}
      {displayCases.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0 6px',
          background: '#F4F6F9', flexShrink: 0,
        }}>
          {displayCases.map((c, i) => (
            <button
              key={c.id}
              onClick={() => goToCase(i)}
              title={c.deceased_name}
              style={{
                width: caseIdx === i ? 28 : 8, height: 8, borderRadius: 4,
                background: caseIdx === i ? '#2563EB' : '#CBD5E1',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>
      )}

      {/* ── 바깥 케이스 캐러셀 ── */}
      <div
        ref={caseScrollRef}
        onScroll={handleCaseScroll}
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {displayCases.map((c, cIdx) => {
          const cMeta = CASE_STATUS[c.status] || CASE_STATUS['submitted']
          const services = c.case_services || []
          const doneCount = services.filter(s => s.status === 'done').length
          const progressPct = services.length ? Math.round((doneCount / services.length) * 100) : 0
          const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
          const curSvcIdx = svcIdxMap[cIdx] ?? 0
          const curStatusIdx = STATUS_ORDER.indexOf(c.status)

          return (
            <div
              key={c.id}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                padding: '10px 16px 0',
                overflow: 'hidden',
                gap: 10,
              }}
            >
              {/* ── 케이스 헤더 카드 ── */}
              <div style={{
                background: '#fff', borderRadius: 16, padding: '16px',
                border: '1px solid #E8EAF0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}>
                {/* 고인 + 상태 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 700, letterSpacing: '0.04em' }}>고인</p>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
                      {c.deceased_name}님
                    </h2>
                    <p style={{ fontSize: 11, color: '#C4C4CC', margin: '3px 0 0', fontWeight: 600 }}>
                      신청 {createdAt}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: cMeta.bg, color: cMeta.color }}>
                    {cMeta.label}
                  </span>
                </div>

                {/* 신청번호 + 진행률 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F4F6F9', borderRadius: 10, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0, fontWeight: 700 }}>신청번호</p>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                      #{shortId(c.id)}
                    </p>
                  </div>
                  <div style={{ width: 1, height: 28, background: '#E0E0E0' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700 }}>전체 진행률</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: progressPct === 100 ? '#059669' : '#2563EB' }}>
                        {doneCount}/{services.length} · {progressPct}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: '#E8EAF0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: progressPct === 100 ? '#10B981' : '#2563EB',
                        width: `${progressPct}%`, transition: 'width .6s',
                      }} />
                    </div>
                  </div>
                </div>

                {/* 단계 스텝 바 */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {['접수 완료', '서류 확인', '처리 중', '처리 완료'].map((label, i) => {
                    const isActive = i === curStatusIdx
                    const isPast = i < curStatusIdx
                    return (
                      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{
                          height: 3, borderRadius: 2,
                          background: isActive ? '#2563EB' : isPast ? '#93A8D4' : '#E8EAF0',
                        }} />
                        <span style={{
                          fontSize: 9, textAlign: 'center', fontWeight: isActive ? 800 : 500,
                          color: isActive ? '#2563EB' : isPast ? '#93A8D4' : '#D1D5DB',
                        }}>
                          {isActive ? `● ${label}` : label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 취소 버튼 - 결제 완료 + 처리 완료/취소 아닌 경우만 */}
                {c.payment_status === 'paid' && !['completed', 'cancelled'].includes(c.status) && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F0F0' }}>
                    <button
                      onClick={() => setCancelTarget(c)}
                      style={{
                        width: '100%', padding: '10px',
                        background: '#FEF2F2', color: '#DC2626',
                        border: '1px solid #FECACA', borderRadius: 10,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      신청 취소하기
                    </button>
                  </div>
                )}
                {c.payment_status === 'refunded' && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F0F0', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>✅ 취소 / 환불 완료</span>
                  </div>
                )}
              </div>

              {/* ── 서비스 캐러셀 ── */}
              {services.length > 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  {/* 서비스 도트 */}
                  {services.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 6, flexShrink: 0 }}>
                      {services.map((_, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => goToSvc(cIdx, sIdx)}
                          style={{
                            width: curSvcIdx === sIdx ? 20 : 6, height: 6, borderRadius: 3,
                            background: curSvcIdx === sIdx ? '#2563EB' : '#D1D5DB',
                            border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.25s',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* 서비스 스크롤 */}
                  <div
                    ref={el => { svcScrollRefs.current[cIdx] = el }}
                    onScroll={() => handleSvcScroll(cIdx)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollSnapType: 'x mandatory',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {services.map(svc => (
                      <div
                        key={svc.id}
                        style={{
                          flex: '0 0 100%',
                          scrollSnapAlign: 'start',
                          boxSizing: 'border-box',
                          paddingBottom: 80, // 탭바 공간
                          overflowY: 'auto',
                        }}
                      >
                        <ServiceCard svc={svc} caseId={c.id} userId={userId} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 14 }}>등록된 서비스가 없습니다</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
