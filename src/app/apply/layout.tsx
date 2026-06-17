'use client'

import { usePathname, useRouter } from 'next/navigation'
import Topbar from '@/components/ui/Topbar'
import StepIndicator from '@/components/ui/StepIndicator'

const STEPS = [
  { id: 'info', label: '고인 정보', path: '/apply' },
  { id: 'services', label: '서비스 선택', path: '/apply/services' },
  { id: 'docs', label: '서류·서명', path: '/apply/documents' },
  { id: 'payment', label: '결제', path: '/apply/payment' },
  { id: 'confirm', label: '신청 완료', path: '/apply/confirm' },
]

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  // service-info는 '서비스 선택' 스텝(1)과 같은 단계로 표시
  const currentIndex = pathname.startsWith('/apply/service-info')
    ? 1
    : pathname.startsWith('/apply/payment')
    ? 3
    : STEPS.findIndex(s => s.path === pathname)
  const isConfirm = pathname === '/apply/confirm'

  const handleBack = () => {
    if (currentIndex === 0) router.push('/home')
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
