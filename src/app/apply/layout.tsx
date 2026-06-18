'use client'

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="screen" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
