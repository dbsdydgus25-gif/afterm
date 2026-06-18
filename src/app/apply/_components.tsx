// /apply 플로우 공통 UI 컴포넌트
import React from 'react'

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif", background: '#fff',
    }}>
      {children}
    </div>
  )
}

export function Body({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, padding: '40px 24px 120px' }}>{children}</div>
}

export function Dock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, padding: '16px 24px',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', zIndex: 50,
    }}>
      {children}
    </div>
  )
}

export function PrimaryBtn({ children, onClick, disabled, style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '17px', borderRadius: 14,
      background: disabled ? '#E5E9EF' : '#2563EB',
      color: disabled ? '#9CA3AF' : '#fff',
      fontSize: 16, fontWeight: 800, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', letterSpacing: '-0.02em', transition: 'background 0.15s',
      ...style,
    }}>
      {children}
    </button>
  )
}

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 52, height: 52, borderRadius: 12, border: '1.5px solid #E5E9EF',
      background: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>←</button>
  )
}

export function StepLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 700, color: '#2563EB',
      letterSpacing: '0.06em', margin: '0 0 12px', opacity: 0.7,
    }}>{label}</p>
  )
}

export function Question({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: '#111827',
        letterSpacing: '-0.03em', lineHeight: 1.35, margin: 0, whiteSpace: 'pre-line',
      }}>{label}</h2>
      {sub && <p style={{ fontSize: 14, color: '#9CA3AF', margin: '8px 0 0', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProgressBar({ current, total = 8 }: { current: number; total?: number }) {
  return null
}
