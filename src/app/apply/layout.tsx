'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 신청 플로우 공통 레이아웃
// 상단 스텝 인디케이터 포함

const STEPS = [
  { label: '고인 정보', path: '/apply' },
  { label: '서비스 선택', path: '/apply/services' },
  { label: '서류·서명', path: '/apply/documents' },
  { label: '최종 확인', path: '/apply/confirm' },
]

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex(s => s.path === pathname)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          height: '56px', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/dashboard" style={{
            fontSize: '14px', color: 'var(--color-text-3)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            ← 취소
          </Link>
          <span className="logo" style={{ fontSize: '18px' }}>after<span>m</span></span>
          <div style={{ width: '48px' }} />
        </div>

        {/* 스텝 인디케이터 */}
        <div style={{ padding: '12px 20px 16px' }}>
          <div className="step-bar">
            {STEPS.map((step, i) => (
              <div
                key={step.path}
                className={`step-item ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {i < currentIndex ? '✓' : i + 1}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
