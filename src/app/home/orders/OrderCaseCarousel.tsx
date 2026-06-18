'use client'
// 서비스 카드 가로 스와이프 캐러셀
// ★ 핵심: 스크롤 컨테이너에 padding 없음 → 각 슬롯에 padding → 카드가 하나씩 딱 맞게 보임

import { useState, useRef, useCallback } from 'react'
import ServiceCard from './ServiceCard'

type Service = {
  id: string
  service_name: string
  service_category: string
  status: string
  status_note?: string
}

type Props = {
  services: Service[]
  caseId: string
  userId: string
}

export default function OrderCaseCarousel({ services, caseId, userId }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // 각 슬롯이 스크롤 컨테이너 전체 너비(clientWidth)를 차지
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setCurrentIdx(Math.min(idx, services.length - 1))
  }, [services.length])

  const goTo = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setCurrentIdx(idx)
  }

  return (
    <div>
      {/* ★ 스크롤 컨테이너: padding 없음, overflow hidden으로 옆 카드 안 보임 */}
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
          // ★ 패딩은 여기에 없음 — 슬롯에 줌
        }}
      >
        {services.map((svc) => (
          <div
            key={svc.id}
            style={{
              // ★ 슬롯이 스크롤 컨테이너 너비와 동일 → 하나씩 딱 맞게
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              // ★ 카드 좌우 여백은 슬롯 내부 padding으로
              padding: '4px 16px 8px',
              boxSizing: 'border-box',
            }}
          >
            <ServiceCard svc={svc} caseId={caseId} userId={userId} />
          </div>
        ))}
      </div>

      {/* 도트 인디케이터 */}
      {services.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 5, padding: '2px 0 14px',
        }}>
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: currentIdx === i ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: currentIdx === i ? '#0066FF' : '#D1D5DB',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
