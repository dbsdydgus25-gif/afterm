import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminServiceRow from './AdminServiceRow'

// 관리자 - 신청건 상세 처리 페이지
export default async function AdminCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (adminEmails.length > 0 && !adminEmails.includes(user.email || '')) redirect('/')

  const { data: caseData } = await adminClient
    .from('cases')
    .select(`*, case_services(*, dispatch_logs(*)), delegations(*), case_documents(*)`)
    .eq('id', caseId)
    .single()

  if (!caseData) notFound()

  const services = caseData.case_services || []
  const doneCount = services.filter((s: any) => s.status === 'done').length

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link href="/admin/cases" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: '14px' }}>← 목록으로</Link>
          <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em' }}>
            신청 상세 — {caseData.deceased_name}
          </h1>
          <span style={{
            padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 700,
            background: caseData.status === 'completed' ? '#ECFDF5' : '#EEF3FD',
            color: caseData.status === 'completed' ? '#16A34A' : '#3B6FE8',
          }}>
            {caseData.status === 'completed' ? '처리 완료' : caseData.status === 'processing' ? '처리 중' : '접수 완료'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* 고인 정보 */}
          <div className="stat-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-3)', marginBottom: '16px' }}>고인 정보</h3>
            {[
              ['성명', caseData.deceased_name],
              ['생년월일', caseData.deceased_birth],
              ['사망일', caseData.deceased_death],
              ['연락처', caseData.deceased_phone || '미입력'],
              ['신청일', new Date(caseData.created_at).toLocaleDateString('ko-KR')],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* 위임 정보 */}
          <div className="stat-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-3)', marginBottom: '16px' }}>위임 정보</h3>
            {caseData.delegations?.[0] ? (
              <>
                {[
                  ['신청인', caseData.delegations[0].delegator_name],
                  ['관계', caseData.delegations[0].delegator_relation],
                  ['서명일', caseData.delegations[0].signed_at ? new Date(caseData.delegations[0].signed_at).toLocaleDateString('ko-KR') : '-'],
                  ['서류 수', `${caseData.case_documents?.length || 0}개`],
                  ['처리율', `${doneCount}/${services.length}개 (${Math.round((doneCount / (services.length || 1)) * 100)}%)`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>위임장 미작성</p>
            )}
          </div>
        </div>

        {/* 서비스별 상태 관리 */}
        <div className="stat-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
            서비스 처리 관리 ({doneCount}/{services.length}개 완료)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['서비스', '카테고리', '계정 아이디', '발송 수신처', '현재 상태', '상태 변경', '메모'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s: any) => (
                <AdminServiceRow key={s.id} service={s} caseId={caseId} />
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
