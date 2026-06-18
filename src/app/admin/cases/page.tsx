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
      id, user_id, deceased_name, deceased_birth, deceased_death, deceased_phone,
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

  const allCases = cases || []

  // 유저 ID 목록 수집 후 profiles 한번에 조회
  const userIds = [...new Set(allCases.map((c: any) => c.user_id).filter(Boolean))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, name, email, phone')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap: Record<string, { name: string; email: string; phone: string }> = {}
  for (const p of profiles || []) {
    profileMap[p.id] = { name: p.name || '', email: p.email || '', phone: p.phone || '' }
  }

  // 요약 통계
  const stats = {
    total: allCases.length,
    submitted: allCases.filter(c => c.status === 'submitted').length,
    processing: allCases.filter(c => c.status === 'processing' || c.status === 'reviewing').length,
    completed: allCases.filter(c => c.status === 'completed').length,
  }

  // 유저별 그룹핑
  type CaseWithExtras = (typeof allCases)[number]
  const userGroups: Record<string, { userName: string; userEmail: string; userPhone: string; cases: CaseWithExtras[] }> = {}
  for (const c of allCases) {
    const uid = (c as any).user_id || 'unknown'
    const profile = profileMap[uid]
    if (!userGroups[uid]) {
      userGroups[uid] = {
        userName: profile?.name || profile?.email?.split('@')[0] || '이름 미입력',
        userEmail: profile?.email || '',
        userPhone: profile?.phone || '',
        cases: [],
      }
    }
    userGroups[uid].cases.push(c)
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
          { label: '전체 신청', value: stats.total, color: '#2563EB', bg: '#EFF6FF', icon: '📋' },
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

      {/* 유저별 신청 그룹 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 20 }}>
        {allCases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: 16 }}>
            신청 건이 없습니다
          </div>
        )}
        {Object.entries(userGroups).map(([uid, group]) => (
          <div key={uid} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {/* 유저 헤더 */}
            <div style={{ padding: '16px 20px', background: '#F8FAFF', borderBottom: '1px solid #EFF2FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: '#2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: '#fff',
                }}>
                  {group.userName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{group.userName}</span>
                    {group.userPhone && (
                      <span style={{ fontSize: 12, color: '#6B7280', background: '#E8EAF0', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                        {group.userPhone}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                    {group.userEmail && <span style={{ marginRight: 8 }}>{group.userEmail}</span>}
                    신청 {group.cases.length}건
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                {uid.slice(0, 12)}...
              </span>
            </div>

            {/* 케이스 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {group.cases.map((c: any, idx: number) => {
                const si = STATUS_LABEL[c.status] || { label: c.status, bg: '#F3F4F6', color: '#6B7280' }
                const services: any[] = c.case_services || []
                const done = services.filter((s: any) => s.status === 'done').length
                const pct = services.length ? Math.round((done / services.length) * 100) : 0
                const docsCount = c.case_documents?.length || 0
                const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

                return (
                  <div key={c.id} style={{
                    borderTop: idx > 0 ? '1px solid #F0F0F0' : undefined,
                    padding: '14px 20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 2 }}>
                          고인: {c.deceased_name}
                          {c.deceased_phone && <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginLeft: 8 }}>{c.deceased_phone}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                          {c.deceased_birth && `생년월일 ${c.deceased_birth}`}
                          {c.deceased_birth && c.deceased_death && ' · '}
                          {c.deceased_death && `사망일 ${c.deceased_death}`}
                          <span style={{ marginLeft: 8 }}>· 신청 {createdAt}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: si.bg, color: si.color }}>
                          {si.label}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: docsCount > 0 ? '#D1FAE5' : '#FEF3C7',
                          color: docsCount > 0 ? '#059669' : '#D97706',
                        }}>
                          서류 {docsCount}개
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        {services.map((s: any) => {
                          const sColor = s.status === 'done' ? '#059669' : '#2563EB'
                          const sBg = s.status === 'done' ? '#D1FAE5' : '#DBEAFE'
                          return (
                            <span key={s.id} style={{ padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: sBg, color: sColor }}>
                              {s.service_name}
                            </span>
                          )
                        })}
                        {services.length === 0 && <span style={{ fontSize: 11, color: '#D1D5DB' }}>서비스 없음</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 5, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#10b981' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{pct}%</span>
                        </div>
                        <Link href={`/admin/cases/${c.id}`} style={{
                          fontSize: 12, color: '#2563EB', fontWeight: 800, textDecoration: 'none',
                          padding: '6px 14px', borderRadius: 8, background: '#EFF6FF',
                        }}>
                          관리 →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
