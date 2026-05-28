'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

interface TopbarProps {
  title?: string
  brand?: boolean
  onBack?: () => void
  trailing?: React.ReactNode
}

export default function Topbar({ title, brand, onBack, trailing }: TopbarProps) {
  const router = useRouter()
  
  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  return (
    <div style={{
      height: 'var(--nav-h)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 50,
      borderBottom: '1px solid var(--color-line-normal-normal)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 40 }}>
        {!brand && (
          <button onClick={handleBack} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: '8px 0', marginLeft: '-8px', color: 'var(--color-label-strong)' }}>
            <ArrowLeft size={24} />
          </button>
        )}
        {brand && <Logo />}
      </div>
      
      <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-label-strong)' }}>
        {title}
      </div>
      
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>
        {trailing}
      </div>
    </div>
  )
}
