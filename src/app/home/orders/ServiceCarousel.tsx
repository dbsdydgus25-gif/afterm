'use client'

import { useState, useRef, useCallback } from 'react'
import ServiceCard from './ServiceCard'

type Service = {
  id: string
  service_name: string
  service_category: string
  status: string
  status_note?: string
}

type ServiceCarouselProps = {
  services: Service[]
  caseId: string
  userId: string
}

export default function ServiceCarousel({ services, caseId, userId }: ServiceCarouselProps) {
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

  return (
    <div>
      {/* 가로 스크롤 래퍼 */}
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
          padding: '4px 20px 8px',
          gap: 0,
        }}
      >
        {services.map((svc, i) => (
          <div
            key={svc.id}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              paddingRight: i < services.length - 1 ? 12 : 0,
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
          gap: 6, padding: '4px 0 16px',
        }}>
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: currentIdx === i ? 18 : 6,
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
