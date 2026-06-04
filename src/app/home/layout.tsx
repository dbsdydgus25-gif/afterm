'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function TabBar() {
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
      href: '/home/chat',
      label: '채팅',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
            fill={active ? '#163272' : 'none'}
            stroke={active ? '#163272' : '#9CA3AF'}
            strokeWidth="1.8" strokeLinejoin="round" />
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

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setChecking(false)
    })
  }, [])

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e0e0e0', borderTopColor: '#163272', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#f8f9fb', paddingBottom: 72,
    }}>
      {children}
      <TabBar />
    </div>
  )
}
