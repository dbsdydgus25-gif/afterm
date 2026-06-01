import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminFilterBar from './AdminFilterBar'
import { Suspense } from 'react'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  draft:      { label: '작성 중',   bg: '#F3F4F6', color: '#6B7280' },
  submitted:  { label: '접수 완료', bg: '#EFF6FF', color: '#2563EB' },
  processing: { label: '처리 중',   bg: '#F5F3FF', color: '#7C3AED' },
  completed:  { label: '완료됨',    bg: '#ECFDF5', color: '#059669' },
  cancelled:  { label: '취소됨',    bg: '#FEF2F2', color: '#DC2626' },
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
  }>
}

export default async function AdminCasesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  const isDev = process.env.NODE_ENV === 'development'
  const isAuthorized = isDev || (user.email && adminEmails.includes(user.email))
  if (!isAuthorized) redirect('/')

  // 필터 및 검색어 처리
  const { status, search } = await searchParams
  const filterStatus = status || 'all'
  const filterSearch = search || ''

  // 쿼리 작성
  let query = adminClient
    .from('cases')
    .select(`
      id, deceased_name, deceased_birth, deceased_death, deceased_phone,
      status, created_at,
      case_services(id, status, service_name),
      delegations(delegator_name, delegator_relation),
      case_documents(id)
    `)

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus)
  }

  if (filterSearch) {
    query = query.or(`deceased_name.ilike.%${filterSearch}%,deceased_phone.ilike.%${filterSearch}%`)
  }

  // 최신순 정렬
  const { data: cases, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cases:', error)
  }

  return (
    <div className="admin-layout" style={{ width: '100vw' }}>
      {/* ── 사이드바 ── */}
      <aside className="admin-sidebar" style={{
        position: 'sticky', top: 0, height: '100vh',
        justifyContent: 'space-between', boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ padding: '8px 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}>
              after<span style={{ color: '#0066ff' }}>m</span>
            </span>
            <div style={{
              display: 'inline-block', background: 'rgba(0,102,255,0.15)', color: '#3385ff',
              fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
              marginLeft: '8px', verticalAlign: 'middle', letterSpacing: '0.05em'
            }}>CONSOLE</div>
          </div>

          <nav style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Link href="/admin" style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '14px 24px', textDecoration: 'none',
              color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 600,
              borderLeft: '4px solid transparent', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span>대시보드 홈</span>
            </Link>

            <Link href="/admin/cases" style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '14px 24px', textDecoration: 'none',
              color: '#fff', background: 'rgba(0,102,255,0.15)',
              fontSize: '14px', fontWeight: 700,
              borderLeft: '4px solid #0066ff'
            }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <span>신청 관리 목록</span>
            </Link>
          </nav>
        </div>

        <div style={{
          padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>접속 계정</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              {user.email}
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button type="submit" style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
            }}>
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <main className="admin-content" style={{ boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-label-strong)', margin: 0 }}>
            전체 대행 신청 관리
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-label-alternative)', marginTop: '6px', margin: 0 }}>
            유족들이 접수한 디지털 유산 대행 건들의 서류 심사 및 해지 처리를 관리합니다.
          </p>
        </div>

        {/* ── 필터 및 검색 영역 ── */}
        <Suspense fallback={<div style={{ height: '74px', background: '#fff', borderRadius: '16px' }} />}>
          <AdminFilterBar />
        </Suspense>

        {/* ── 테이블 카드 ── */}
        <div className="stat-card" style={{ padding: '12px 0 0' }}>
          <div style={{ padding: '12px 24px 20px', borderBottom: '1px solid var(--color-line-normal-normal)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>
              검색 결과: <strong style={{ color: 'var(--color-primary-normal)' }}>{cases?.length || 0}</strong> 건
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-line-solid-normal)', background: 'var(--color-coolNeutral-99)' }}>
                  {['고인 정보', '생년월일 / 사망일', '신청인 (유족)', '관계', '제출 서류', '신청 서비스', '대행 진행도', '상태', '수행 작업'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases && cases.length > 0 ? (
                  cases.map((c: any) => {
                    const statusInfo = STATUS_LABEL[c.status] || { label: c.status, bg: '#F3F4F6', color: '#6B7280' }
                    const services = c.case_services || []
                    const done = services.filter((s: any) => s.status === 'done').length
                    const pct = services.length ? Math.round((done / services.length) * 100) : 0
                    const docsCount = c.case_documents?.length || 0

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--color-line-normal-alternative)', transition: 'background 0.2s' }}
                          className="hover-row">
                        <td style={{ padding: '18px 20px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-label-strong)', fontSize: '15px' }}>{c.deceased_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-label-alternative)', marginTop: '3px' }}>{c.deceased_phone || '연락처 미입력'}</div>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: '13px', color: 'var(--color-label-neutral)' }}>
                          <div>생일: {c.deceased_birth}</div>
                          <div style={{ marginTop: '2px' }}>사망: {c.deceased_death}</div>
                        </td>
                        <td style={{ padding: '18px 20px', fontWeight: 600, color: 'var(--color-label-strong)', fontSize: '14px' }}>
                          {c.delegations?.[0]?.delegator_name || <span style={{ color: 'var(--color-label-assistive)' }}>미확인</span>}
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: '13px', color: 'var(--color-label-neutral)' }}>
                          {c.delegations?.[0]?.delegator_relation || '-'}
                        </td>
                        <td style={{ padding: '18px 20px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700,
                            background: docsCount === 3 ? '#E8F5E9' : '#FFF3E0',
                            color: docsCount === 3 ? '#2E7D32' : '#EF6C00'
                          }}>
                            {docsCount} / 3개 제출
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: '13px' }}>
                          {services.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                              {services.slice(0, 2).map((s: any) => (
                                <span key={s.id} style={{
                                  padding: '2px 6px', borderRadius: '4px', background: 'var(--color-coolNeutral-96)',
                                  fontSize: '11px', fontWeight: 600, color: 'var(--color-label-neutral)'
                                }}>{s.service_name}</span>
                              ))}
                              {services.length > 2 && <span style={{ fontSize: '11px', color: 'var(--color-label-alternative)', fontWeight: 600 }}>외 {services.length - 2}</span>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-label-assistive)' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'var(--color-coolNeutral-96)', borderRadius: '100px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#10B981', width: `${pct}%`, borderRadius: '100px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '18px 20px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                            background: statusInfo.bg, color: statusInfo.color
                          }}>{statusInfo.label}</span>
                        </td>
                        <td style={{ padding: '18px 20px' }}>
                          <Link href={`/admin/cases/${c.id}`} style={{
                            fontSize: '13px', color: '#0066ff', fontWeight: 700, textDecoration: 'none',
                            padding: '6px 14px', borderRadius: '6px', background: '#EFF6FF', transition: 'all 0.2s'
                          }}>
                            관리하기
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-label-alternative)', fontSize: '14px' }}>
                      검색 조건에 맞는 신청 건이 존재하지 않습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
