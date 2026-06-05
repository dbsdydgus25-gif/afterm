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
      case_services(id, status, service_name, service_category),
      delegations(delegator_name, delegator_relation),
      case_documents(id)
    `)
    .neq('status', 'draft')

  if (filterStatus !== 'all') query = query.eq('status', filterStatus)
  if (filterSearch) query = query.or(`deceased_name.ilike.%${filterSearch}%,deceased_phone.ilike.%${filterSearch}%`)

  const { data: cases, error } = await query.order('created_at', { ascending: false })
  if (error) console.error('Error fetching cases:', error)

  // 요약 통계
  const allCases = cases || []
  const stats = {
    total: allCases.length,
    submitted: allCases.filter(c => c.status === 'submitted').length,
    processing: allCases.filter(c => c.status === 'processing' || c.status === 'reviewing').length,
    completed: allCases.filter(c => c.status === 'completed').length,
  }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>신청 관리</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', margin: '6px 0 0' }}>
          유족 기준으로 신청 건을 확인하고 처리합니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: '전체 신청', value: stats.total, color: '#163272', bg: '#EFF6FF', icon: '📋' },
          { label: '접수 완료', value: stats.submitted, color: '#2563EB', bg: '#DBEAFE', icon: '✅' },
          { label: '처리 중', value: stats.processing, color: '#D97706', bg: '#FEF3C7', icon: '⚙️' },
          { label: '처리 완료', value: stats.completed, color: '#059669', bg: '#D1FAE5', icon: '🎉' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 16, padding: '18px 20px',
            border: '1px solid #F0F0F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Suspense fallback={<div style={{ height: 74, background: '#fff', borderRadius: 16 }} />}>
        <AdminFilterBar />
      </Suspense>

      {/* 신청 카드 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        {allCases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: 16 }}>
            신청 건이 없습니다
          </div>
        )}
        {allCases.map((c: any) => {
          const si = STATUS_LABEL[c.status] || { label: c.status, bg: '#F3F4F6', color: '#6B7280' }
          const services: any[] = c.case_services || []
          const done = services.filter((s: any) => s.status === 'done').length
          const pct = services.length ? Math.round((done / services.length) * 100) : 0
          const docsCount = c.case_documents?.length || 0
          const delegator = c.delegations?.[0]
          const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

          return (
            <div key={c.id} style={{
              background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
              {/* 상단: 신청인 + 상태 */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F7F7F7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {/* 신청인 아바타 */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: '#EFF6FF', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#163272',
                    }}>
                      {(delegator?.delegator_name || '?').charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>
                          {delegator?.delegator_name || '신청인 미확인'}
                        </span>
                        {delegator?.delegator_relation && (
                          <span style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                            {delegator.delegator_relation}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                        고인: <strong style={{ color: '#374151' }}>{c.deceased_name}</strong>
                        {c.deceased_phone && ` · ${c.deceased_phone}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: si.bg, color: si.color }}>
                      {si.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>신청 {createdAt}</span>
                  </div>
                </div>
              </div>

              {/* 중단: 고인 정보 + 진행 */}
              <div style={{ padding: '14px 20px', display: 'flex', gap: 20, borderBottom: '1px solid #F7F7F7' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 700 }}>고인 정보</p>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    {c.deceased_birth && <span>생년월일: {c.deceased_birth}</span>}
                    {c.deceased_birth && c.deceased_death && <span style={{ margin: '0 6px', color: '#D1D5DB' }}>·</span>}
                    {c.deceased_death && <span>사망일: {c.deceased_death}</span>}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 700 }}>서류</p>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    background: docsCount > 0 ? '#D1FAE5' : '#FEF3C7',
                    color: docsCount > 0 ? '#059669' : '#D97706',
                  }}>
                    {docsCount}개 제출
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 700 }}>진행률</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 60, height: 6, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{pct}%</span>
                  </div>
                </div>
              </div>

              {/* 하단: 서비스 태그 + 관리하기 */}
              <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {services.map((s: any) => {
                    const sColor = s.status === 'done' ? '#059669' : s.status === 'pending' ? '#6B7280' : '#2563EB'
                    const sBg = s.status === 'done' ? '#D1FAE5' : s.status === 'pending' ? '#F3F4F6' : '#DBEAFE'
                    return (
                      <span key={s.id} style={{
                        padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                        background: sBg, color: sColor,
                      }}>
                        {s.service_name}
                      </span>
                    )
                  })}
                  {services.length === 0 && <span style={{ fontSize: 12, color: '#D1D5DB' }}>서비스 없음</span>}
                </div>
                <Link href={`/admin/cases/${c.id}`} style={{
                  fontSize: 13, color: '#163272', fontWeight: 800, textDecoration: 'none',
                  padding: '8px 16px', borderRadius: 10, background: '#EFF6FF',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  관리하기 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
