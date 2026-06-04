'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function HomeTabBar() {
  const pathname = usePathname()

  const tabs = [
    {
      href: '/home',
      label: '홈',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
            fill={active ? '#163272' : 'none'}
            stroke={active ? '#163272' : '#9CA3AF'}
            strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 21V12h6v9" stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: '/home/orders',
      label: '신청내역',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2"
            fill={active ? '#163272' : 'none'}
            stroke={active ? '#163272' : '#9CA3AF'}
            strokeWidth="1.8" />
          <path d="M9 8h6M9 12h6M9 16h4"
            stroke={active ? '#fff' : '#9CA3AF'}
            strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: '/home/myinfo',
      label: '내정보',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4"
            fill={active ? '#163272' : 'none'}
            stroke={active ? '#163272' : '#9CA3AF'}
            strokeWidth="1.8" />
          <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
            stroke={active ? '#163272' : '#9CA3AF'}
            strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: '#fff', borderTop: '1px solid #f0f0f0',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const active = tab.href === '/home' ? pathname === '/home' : pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0 8px', textDecoration: 'none', gap: 3,
          }}>
            {tab.icon(active)}
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 500,
              color: active ? '#163272' : '#9CA3AF',
            }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
