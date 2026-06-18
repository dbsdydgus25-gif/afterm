'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: '대시보드', exact: true },
  { href: '/admin/cases', icon: '📋', label: '신청 관리' },
  { href: '/admin/payments', icon: '💳', label: '결제 관리' },
  { href: '/admin/chat', icon: '💬', label: '채팅 내역' },
  { href: '/admin/agents', icon: '🤖', label: 'AI 운영 센터' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, background: '#fff', flexShrink: 0,
      borderRight: '1px solid #e5e9ef', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', padding: '16px 0',
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
        {NAV_ITEMS.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8, textDecoration: 'none',
              fontSize: 14, fontWeight: active ? 700 : 500,
              color: active ? '#0066FF' : '#374151',
              background: active ? '#EBF3FF' : 'transparent',
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 600 }}>AFTERM CONSOLE v1.0</p>
      </div>
    </aside>
  )
}
