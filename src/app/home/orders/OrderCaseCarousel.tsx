'use client'
// 서비스 카드 가로 스와이프 캐러셀 (케이스 내 서비스들)
// 하나씩 보여주고 도트 인디케이터로 위치 표시

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
    // 카드 너비는 뷰포트 - 패딩 - 다음 카드 피크(24px)
    const cardWidth = el.clientWidth
    const idx = Math.round(el.scrollLeft / cardWidth)
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
      {/* 가로 스크롤 */}
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
          padding: '4px 16px 8px',
          gap: 0,
        }}
      >
        {services.map((svc, i) => (
          <div
            key={svc.id}
            style={{
              flex: '0 0 calc(100% - 0px)',
              scrollSnapAlign: 'start',
              paddingRight: i < services.length - 1 ? 10 : 0,
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
                background: currentIdx === i ? '#163272' : '#D1D5DB',
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
