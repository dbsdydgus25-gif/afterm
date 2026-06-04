import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: '대시보드', exact: true },
  { href: '/admin/cases', icon: '📋', label: '신청 관리' },
  { href: '/admin/users', icon: '👤', label: '회원 관리' },
  { href: '/admin/chat', icon: '💬', label: '채팅 문의' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  const isDev = process.env.NODE_ENV === 'development'

  // /admin/login 은 체크 제외
  if (!isDev && session?.value !== 'authorized') {
    redirect('/admin-login')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
      background: '#f4f6f8', zIndex: 9999,
    }}>
      {/* ── 상단 헤더 ── */}
      <header style={{
        height: 56, background: '#163272', display: 'flex', alignItems: 'center',
        padding: '0 24px', flexShrink: 0, gap: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 220 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>
            after<span style={{ color: '#60a5fa' }}>m</span>
          </span>
          <span style={{
            background: 'rgba(96,165,250,0.2)', color: '#93c5fd',
            fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.08em',
          }}>CONSOLE</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>관리자</span>
          <form action="/api/admin/logout" method="POST" style={{ margin: 0 }}>
            <button type="submit" style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 14px',
              borderRadius: 6, cursor: 'pointer',
            }}>로그아웃</button>
          </form>
        </div>
      </header>

      {/* ── 바디 (사이드바 + 컨텐츠) ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 사이드바 */}
        <aside style={{
          width: 220, background: '#fff', flexShrink: 0,
          borderRight: '1px solid #e5e9ef', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', padding: '16px 0',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8, textDecoration: 'none',
                fontSize: 14, fontWeight: 600, color: '#374151',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 600 }}>AFTERM CONSOLE v1.0</p>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
