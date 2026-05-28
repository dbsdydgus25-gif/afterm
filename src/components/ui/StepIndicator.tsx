'use client'

interface StepIndicatorProps {
  steps: { id: string; label: string }[]
  current: number // 0-indexed
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div style={{
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--color-background-normal-normal)'
    }}>
      {steps.map((step, i) => (
        <div key={step.id} style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: i <= current ? 'var(--color-primary-normal)' : 'var(--color-coolNeutral-94)',
          transition: 'background 0.3s ease'
        }} />
      ))}
    </div>
  )
}
