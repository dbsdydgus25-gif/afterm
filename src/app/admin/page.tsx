import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 관리자 대시보드 - 핵심 통계 + 전체 신청 현황
export default async function AdminPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (adminEmails.length > 0 && !adminEmails.includes(user.email || '')) redirect('/')

  // 전체 통계 쿼리
  const [
    { count: totalCases },
    { count: submittedCases },
    { count: processingCases },
    { count: completedCases },
    { count: totalServices },
    { count: doneServices },
    { data: recentCases },
    { data: serviceStats },
  ] = await Promise.all([
    adminClient.from('cases').select('*', { count: 'exact', head: true }),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    adminClient.from('case_services').select('*', { count: 'exact', head: true }),
    adminClient.from('case_services').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    adminClient.from('cases')
      .select(`id, deceased_name, deceased_death, status, created_at, case_services(id, status)`)
      .order('created_at', { ascending: false })
      .limit(20),
    adminClient.from('case_services')
      .select('service_name, service_category, status')
      .order('created_at', { ascending: false }),
  ])

  // 서비스 카테고리별 통계
  const categoryStats = (serviceStats || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.service_category] = (acc[s.service_category] || 0) + 1
    return acc
  }, {})

  // 서비스명별 인기 순위
  const serviceNameStats = (serviceStats || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.service_name] = (acc[s.service_name] || 0) + 1
    return acc
  }, {})
  const topServices = Object.entries(serviceNameStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  const completionRate = totalServices ? Math.round(((doneServices || 0) / totalServices) * 100) : 0

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft:      { label: '작성 중',   color: '#9AA3B2' },
    submitted:  { label: '접수 완료', color: '#3B6FE8' },
    processing: { label: '처리 중',   color: '#8B5CF6' },
    completed:  { label: '완료',      color: '#22C55E' },
    cancelled:  { label: '취소',      color: '#EF4444' },
  }

  return (
    <div className="admin-layout">
      {/* 사이드바 */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.04em' }}>
            after<span style={{ color: '#3B6FE8' }}>m</span>
          </span>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>ADMIN</div>
        </div>

        <nav style={{ padding: '20px 0', flex: 1 }}>
          {[
            { href: '/admin', icon: '📊', label: '대시보드' },
            { href: '/admin/cases', icon: '📋', label: '신청 관리' },
            { href: '/admin/services', icon: '⚙️', label: '서비스 현황' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '12px 24px', textDecoration: 'none',
              color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600,
              transition: 'background 0.15s',
            }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="admin-content">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            관리자 대시보드
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
          </p>
        </div>

        {/* 핵심 지표 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: '전체 신청', value: totalCases || 0, sub: '누적 신청 건수', color: 'var(--color-primary)' },
            { label: '접수 완료', value: submittedCases || 0, sub: '처리 대기 중', color: '#3B6FE8' },
            { label: '처리 중', value: processingCases || 0, sub: '진행 중인 케이스', color: '#8B5CF6' },
            { label: '처리 완료', value: completedCases || 0, sub: '완전 완료', color: '#22C55E' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-number" style={{ color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{stat.label}</div>
              <div className="stat-label">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          {/* 서비스 처리 현황 */}
          <div className="stat-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>서비스 처리 현황</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div className="stat-number" style={{ fontSize: '40px', color: 'var(--color-accent)' }}>{completionRate}%</div>
                <div className="stat-label">전체 완료율</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '8px', background: 'var(--color-bg)', borderRadius: '100px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${completionRate}%`, background: 'var(--color-accent)', borderRadius: '100px' }} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                  {doneServices || 0}개 완료 / {totalServices || 0}개 전체
                </div>
              </div>
            </div>
          </div>

          {/* 카테고리별 분포 */}
          <div className="stat-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>카테고리별 신청 현황</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(categoryStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-2)' }}>{cat}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '80px', height: '4px', background: 'var(--color-bg)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', background: 'var(--color-accent)', borderRadius: '100px',
                          width: `${Math.round((count / (totalServices || 1)) * 100)}%`,
                        }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '24px', textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 인기 서비스 TOP 10 */}
        <div className="stat-card" style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>인기 서비스 TOP 10</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {topServices.map(([name, count], i) => (
              <div key={name} style={{
                padding: '12px', background: 'var(--color-bg)', borderRadius: '10px',
                display: 'flex', flexDirection: 'column', gap: '4px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-3)' }}>#{i + 1}</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{name}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-accent)' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 신청 목록 */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>최근 신청 목록</h3>
            <Link href="/admin/cases" style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              전체 보기 →
            </Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['고인 성함', '사망일', '신청일', '서비스 수', '상태', '관리'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-3)', letterSpacing: '0.02em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentCases || []).map((c: any) => {
                const statusInfo = STATUS_LABEL[c.status] || { label: c.status, color: '#999' }
                const services = c.case_services || []
                const done = services.filter((s: any) => s.status === 'done').length
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{c.deceased_name}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)' }}>{c.deceased_death}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)' }}>
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {done}/{services.length}개
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                        background: `${statusInfo.color}18`, color: statusInfo.color,
                      }}>{statusInfo.label}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/admin/cases/${c.id}`} style={{
                        fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none',
                      }}>상세</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
