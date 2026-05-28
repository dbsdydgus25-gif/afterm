'use client'

import { usePathname, useRouter } from 'next/navigation'
import Topbar from '@/components/ui/Topbar'
import StepIndicator from '@/components/ui/StepIndicator'

const STEPS = [
  { id: 'info', label: '고인 정보', path: '/apply' },
  { id: 'services', label: '서비스 선택', path: '/apply/services' },
  { id: 'docs', label: '서류·서명', path: '/apply/documents' },
  { id: 'confirm', label: '최종 확인', path: '/apply/confirm' },
]

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const currentIndex = STEPS.findIndex(s => s.path === pathname)
  const isConfirm = pathname === '/apply/confirm'

  const handleBack = () => {
    if (currentIndex === 0) router.push('/dashboard')
    else router.back() // or step back via history
  }

  return (
    <div className="screen">
      {!isConfirm && <Topbar onBack={handleBack} title={STEPS[currentIndex]?.label} brand={false} />}
      {!isConfirm && <StepIndicator steps={STEPS} current={currentIndex} />}
      
      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
