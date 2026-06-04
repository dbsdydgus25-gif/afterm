import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminFilterBar from './AdminFilterBar'
import { Suspense } from 'react'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  draft:      { label: '작성 중',   bg: '#F3F4F6', color: '#6B7280' },
  submitted:  { label: '접수 완료', bg: '#EFF6FF', color: '#2563EB' },
  reviewing:  { label: '서류 확인', bg: '#F5F3FF', color: '#7C3AED' },
  processing: { label: '처리 중',   bg: '#FFFBEB', color: '#D97706' },
  completed:  { label: '완료됨',    bg: '#ECFDF5', color: '#059669' },
  cancelled:  { label: '취소됨',    bg: '#FEF2F2', color: '#DC2626' },
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function AdminCasesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') redirect('/admin-login')

  const adminClient = createAdminClient()
  const { status, search } = await searchParams
  const filterStatus = status || 'all'
  const filterSearch = search || ''

  let query = adminClient
    .from('cases')
    .select(`
      id, deceased_name, deceased_birth, deceased_death, deceased_phone,
      status, created_at,
      case_services(id, status, service_name),
      delegations(delegator_name, delegator_relation),
      case_documents(id)
    `)
    .neq('status', 'draft')

  if (filterStatus !== 'all') query = query.eq('status', filterStatus)
  if (filterSearch) query = query.or(`deceased_name.ilike.%${filterSearch}%,deceased_phone.ilike.%${filterSearch}%`)

  const { data: cases, error } = await query.order('created_at', { ascending: false })
  if (error) console.error('Error fetching cases:', error)

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>전체 신청 관리</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', margin: '6px 0 0' }}>
          유족들이 접수한 디지털 유산 대행 건의 서류 심사 및 처리를 관리합니다.
        </p>
      </div>

      <Suspense fallback={<div style={{ height: 74, background: '#fff', borderRadius: 16 }} />}>
        <AdminFilterBar />
      </Suspense>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', overflow: 'hidden', marginTop: 20 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
            검색 결과: <strong style={{ color: '#163272' }}>{cases?.length || 0}</strong>건
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['고인 정보', '생년월일 / 사망일', '신청인 (유족)', '관계', '제출 서류', '신청 서비스', '진행도', '상태', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases && cases.length > 0 ? cases.map((c: any) => {
                const si = STATUS_LABEL[c.status] || { label: c.status, bg: '#F3F4F6', color: '#6B7280' }
                const services = c.case_services || []
                const done = services.filter((s: any) => s.status === 'done').length
                const pct = services.length ? Math.round((done / services.length) * 100) : 0
                const docsCount = c.case_documents?.length || 0
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#111', fontSize: 14 }}>{c.deceased_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.deceased_phone || '연락처 없음'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>
                      <div>생일: {c.deceased_birth || '-'}</div>
                      <div style={{ marginTop: 2 }}>사망: {c.deceased_death || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14, color: '#111' }}>
                      {c.delegations?.[0]?.delegator_name || <span style={{ color: '#ccc' }}>미확인</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>{c.delegations?.[0]?.delegator_relation || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: docsCount > 0 ? '#E8F5E9' : '#FFF3E0', color: docsCount > 0 ? '#2E7D32' : '#EF6C00' }}>
                        {docsCount}개 제출
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                        {services.slice(0, 2).map((s: any) => (
                          <span key={s.id} style={{ padding: '2px 6px', borderRadius: 4, background: '#f3f4f6', fontSize: 11, fontWeight: 600, color: '#374151' }}>{s.service_name}</span>
                        ))}
                        {services.length > 2 && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>외 {services.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 5, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#10b981' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: si.bg, color: si.color }}>{si.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/admin/cases/${c.id}`} style={{ fontSize: 13, color: '#163272', fontWeight: 700, textDecoration: 'none', padding: '6px 12px', borderRadius: 6, background: '#EFF6FF' }}>
                        관리하기 →
                      </Link>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>신청 건이 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
