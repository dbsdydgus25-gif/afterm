'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid #F0F2F5',
        padding: '0 20px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" style={{
          fontSize: '14px', color: '#9AA3B2', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500,
        }}>
          ← 취소
        </Link>
        <Image src="/logo.jpg" alt="AFTERM" width={96} height={28} style={{ objectFit: 'contain' }} />
        <div style={{ width: '48px', textAlign: 'right', fontSize: '13px', color: '#9AA3B2', fontWeight: 600 }}>
          {currentIndex + 1}/{STEPS.length}
        </div>
      </div>

      {/* 진행 바 */}
      <div style={{ height: '3px', background: '#F0F2F5' }}>
        <div style={{
          height: '100%', background: '#3B6FE8',
          width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
