import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (session?.value !== 'authorized') {
    redirect('/admin-login')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
      background: '#f4f6f8', zIndex: 9999,
    }}>
      {/* 상단 헤더 */}
      <header style={{
        height: 56, background: '#0066FF', display: 'flex', alignItems: 'center',
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

      {/* 바디 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AdminNav />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
