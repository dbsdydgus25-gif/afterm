import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  draft:      { label: '작성 중',   bg: '#F1F3F5', color: '#9AA3B2' },
  submitted:  { label: '접수 완료', bg: '#EEF3FD', color: '#3B6FE8' },
  processing: { label: '처리 중',   bg: '#F3F0FF', color: '#8B5CF6' },
  completed:  { label: '완료',      bg: '#ECFDF5', color: '#16A34A' },
  cancelled:  { label: '취소',      bg: '#FEF2F2', color: '#DC2626' },
}

// 관리자 - 전체 신청 목록 페이지
export default async function AdminCasesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (adminEmails.length > 0 && !adminEmails.includes(user.email || '')) redirect('/')

  const { data: cases } = await adminClient
    .from('cases')
    .select(`
      id, deceased_name, deceased_birth, deceased_death, deceased_phone,
      status, payment_status, created_at,
      case_services(id, status, service_name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="admin-layout">
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
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 24px',
              textDecoration: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600,
            }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            전체 신청 목록
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>총 {cases?.length || 0}건</p>
        </div>

        <div className="stat-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['고인 성함', '생년월일', '사망일', '연락처', '신청일', '서비스 수', '상태', '상세'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cases || []).map((c: any) => {
                const statusInfo = STATUS_LABEL[c.status] || { label: c.status, bg: '#F1F3F5', color: '#999' }
                const services = c.case_services || []
                const done = services.filter((s: any) => s.status === 'done').length

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{c.deceased_name}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)', whiteSpace: 'nowrap' }}>{c.deceased_birth}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)', whiteSpace: 'nowrap' }}>{c.deceased_death}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)' }}>{c.deceased_phone || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-2)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <div>{done}/{services.length}개</div>
                      <div style={{ height: '3px', background: 'var(--color-bg)', borderRadius: '100px', marginTop: '4px', width: '60px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#22C55E', width: `${services.length ? (done / services.length) * 100 : 0}%` }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/admin/cases/${c.id}`} style={{ color: 'var(--color-accent)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                        상세 →
                      </Link>
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
