'use client'
// 홈 화면 케이스 캐러셀
// ★ 스크롤 컨테이너에 padding 없음 → 각 슬롯에 padding: '0 20px' → 케이스 카드 왼쪽 선 일치
// ★ 새 신청 박스도 padding: '12px 20px 0' → 케이스 카드와 왼쪽 선 정렬

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

const CASE_STEP_LABELS = ['접수 완료', '서류 확인', '처리 중', '완료']
const CASE_STATUS_TO_STEP: Record<string, number> = {
  submitted:  0,
  reviewing:  1,
  processing: 2,
  completed:  3,
}

function classifyService(status: string) {
  if (status === 'done') return 'completed'
  if (status === 'failed') return 'action'
  if (status === 'dispatched' || status === 'received') return 'inprogress'
  return 'waiting'
}

type CaseItem = {
  id: string
  deceased_name: string
  status: string
  created_at: string
  case_services: { id: string; status: string; service_name: string }[]
}

// SVG 원형 진행률 링
function ProgressRing({ pct, size = 96, stroke = 8 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - pct / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke="#E5E7EB" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
          stroke={pct === 100 ? '#10B981' : '#163272'}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {pct}%
        </div>
        <div style={{ fontSize: size * 0.11, color: '#9CA3AF', marginTop: 2, fontWeight: 500 }}>
          처리 완료
        </div>
      </div>
    </div>
  )
}

export default function CaseCarousel({ cases }: { cases: CaseItem[] }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setCurrentIdx(idx)
  }, [])

  const goTo = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setCurrentIdx(idx)
  }

  if (cases.length === 0) {
    return (
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '24px 20px',
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.6 }}>
            아직 신청이 없어요.<br />지금 바로 디지털 유산 정리를 시작해보세요.
          </p>
          <Link href="/apply" style={{
            display: 'inline-block', background: '#fff', color: '#163272',
            fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
          }}>
            신청하기 →
          </Link>
        </div>

        {/* 새 신청 박스 */}
        <div style={{ marginTop: 12 }}>
          <Link href="/apply" style={{
            display: 'block', background: '#111827', borderRadius: 16, padding: '18px 20px',
            textDecoration: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>New Request</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>새 가족분의 정리를 시작해요</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>평균 5–7영업일 처리 · 무료</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0 }}>→</div>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ★ 스크롤 컨테이너: padding 없음 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          // ★ padding 없음 — 슬롯에 줌
        }}
      >
        {cases.map((c, cIdx) => {
          const services = c.case_services || []
          const total = services.length
          const completedCount = services.filter(s => classifyService(s.status) === 'completed').length
          const inProgressCount = services.filter(s => classifyService(s.status) === 'inprogress').length
          const actionCount = services.filter(s => classifyService(s.status) === 'action').length
          const pct = total ? Math.round((completedCount / total) * 100) : 0
          const stepIdx = CASE_STATUS_TO_STEP[c.status] ?? 0
          const statusLabel = CASE_STEP_LABELS[stepIdx]
          const createdAt = new Date(c.created_at)
            .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })

          return (
            <div
              key={c.id}
              style={{
                // ★ 슬롯 = 스크롤 컨테이너 100% → 하나씩 딱 맞게 스냅
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                // ★ 좌우 여백은 슬롯 내 padding으로
                padding: '0 20px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                background: '#fff', borderRadius: 20, padding: '18px 18px',
                border: '1px solid #E8EDF5',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
              }}>
                {/* 상단: 고인 + 상태 뱃지 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.04em' }}>
                      {cIdx === 0 ? '진행 중인 신청' : `신청 ${cIdx + 1}`}
                    </p>
                    <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                      {c.deceased_name} 님
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>
                      {createdAt} 신청 · {total}건 처리 중
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
                    background: c.status === 'completed' ? '#4ADE80' : c.status === 'processing' ? '#FBBF24' : c.status === 'reviewing' ? '#A78BFA' : '#60A5FA',
                    color: c.status === 'completed' || c.status === 'processing' ? '#111' : '#fff',
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    {statusLabel}
                  </span>
                </div>

                {/* 원형 진행률 + 통계 */}
                <div style={{
                  background: '#F4F6FA', borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14,
                  border: '1px solid #E8EDF5',
                }}>
                  <ProgressRing pct={pct} size={88} stroke={7} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: '완료', value: completedCount, color: '#10B981' },
                      { label: '진행 중', value: inProgressCount, color: '#F59E0B' },
                      { label: '조치 필요', value: actionCount, color: '#EF4444' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 케이스 단계 스텝 바 */}
                <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
                  {CASE_STEP_LABELS.map((label, i) => {
                    const isActive = i === stepIdx
                    const isPast = i < stepIdx
                    return (
                      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{
                          height: 3, borderRadius: 2,
                          background: isActive ? '#163272' : isPast ? '#93A8D8' : '#E5E7EB',
                          transition: 'background .3s',
                        }} />
                        <span style={{
                          fontSize: 9, textAlign: 'center', fontWeight: isActive ? 800 : 500,
                          color: isActive ? '#163272' : isPast ? '#6B7280' : '#D1D5DB',
                        }}>
                          {isActive ? `● ${label}` : label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 상세 보기 버튼 */}
                <Link href="/home/orders" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#EFF6FF', borderRadius: 10, padding: '10px',
                  fontSize: 13, fontWeight: 700, color: '#163272', textDecoration: 'none',
                  border: '1px solid #DBEAFE',
                }}>
                  진행 현황 상세 보기 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 도트 인디케이터 */}
      {cases.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 4px' }}>
          {cases.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: currentIdx === i ? 20 : 6, height: 6, borderRadius: 3,
                background: currentIdx === i ? '#fff' : 'rgba(255,255,255,0.35)',
                border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.25s',
              }}
            />
          ))}
        </div>
      )}

      {/* ★ 새 신청 박스: padding: '12px 20px 0' → 케이스 카드와 동일한 왼쪽선(20px) */}
      <div style={{ padding: '12px 20px 0' }}>
        <Link href="/apply?reset=true" style={{
          display: 'block', background: '#111827', borderRadius: 16, padding: '18px 20px',
          textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                New Request
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                새 가족분의 정리를 시작해요
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                평균 5–7영업일 처리 · 무료
              </p>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: '#0066FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#fff',
            }}>→</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
