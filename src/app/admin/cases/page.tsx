export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { Suspense } from 'react'
import AdminFilterBar from './AdminFilterBar'

const STATUS_TABS = [
  { value: 'all',        label: '전체' },
  { value: 'submitted',  label: '접수완료' },
  { value: 'reviewing',  label: '서류확인' },
  { value: 'processing', label: '처리중' },
  { value: 'completed',  label: '완료' },
  { value: 'cancelled',  label: '취소' },
]

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  draft:      { label: '작성중',   bg: '#F3F4F6', color: '#6B7280' },
  submitted:  { label: '접수완료', bg: '#DBEAFE', color: '#1D4ED8' },
  reviewing:  { label: '서류확인', bg: '#EDE9FE', color: '#6D28D9' },
  processing: { label: '처리중',   bg: '#FEF3C7', color: '#B45309' },
  completed:  { label: '완료',     bg: '#D1FAE5', color: '#065F46' },
  cancelled:  { label: '취소',     bg: '#FEE2E2', color: '#991B1B' },
}

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
  paid:     { label: '결제완료', color: '#059669' },
  pending:  { label: '미결제',   color: '#D97706' },
  refunded: { label: '환불',     color: '#DC2626' },
  failed:   { label: '실패',     color: '#6B7280' },
}

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdminCasesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') redirect('/admin-login')

  const adminClient = createAdminClient()
  const { status, q } = await searchParams
  const filterStatus = status || 'all'
  const filterSearch = q || ''

  // 케이스 + 서비스 + 결제 한 번에 조회 (delegations는 RLS join 오류로 별도 쿼리)
  let query = adminClient
    .from('cases')
    .select(`
      id, user_id, status, created_at,
      deceased_name, deceased_birth, deceased_death,
      payment_status, paid_amount, paid_at,
      delegator_phone,
      case_services(id, service_name, service_category, dispatch_type, status),
      case_documents(id, doc_type)
    `)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (filterStatus !== 'all') query = query.eq('status', filterStatus)

  const { data: cases } = await query
  const allCases = cases || []

  // delegations 별도 조회
  const caseIds = allCases.map((c: any) => c.id)
  const { data: delegationsData } = caseIds.length > 0
    ? await adminClient.from('delegations').select('case_id, delegator_name, delegator_relation, delegator_phone').in('case_id', caseIds)
    : { data: [] }
  const delegationsMap: Record<string, any> = {}
  for (const d of delegationsData || []) delegationsMap[d.case_id] = d

  // 신청인 이름/이메일 조회 (profiles)
  const userIds = [...new Set(allCases.map((c: any) => c.user_id).filter(Boolean))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, name, email, phone')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap: Record<string, { name: string; email: string; phone: string }> = {}
  for (const p of profiles || []) profileMap[p.id as string] = { name: (p as any).name || '', email: (p as any).email || '', phone: (p as any).phone || '' }

  // 검색 필터 (이름·전화·고인명)
  const filtered = filterSearch
    ? allCases.filter((c: any) => {
        const s = filterSearch.toLowerCase()
        const del = delegationsMap[c.id]
        const profile: { name: string; email: string; phone: string } = profileMap[c.user_id] || { name: '', email: '', phone: '' }
        return (
          c.deceased_name?.toLowerCase().includes(s) ||
          del?.delegator_name?.toLowerCase().includes(s) ||
          del?.delegator_phone?.includes(s) ||
          c.delegator_phone?.includes(s) ||
          profile.name.toLowerCase().includes(s) ||
          profile.phone.includes(s) ||
          profile.email.toLowerCase().includes(s)
        )
      })
    : allCases

  // 통계
  const stats = {
    total:      allCases.length,
    submitted:  allCases.filter((c: any) => c.status === 'submitted').length,
    reviewing:  allCases.filter((c: any) => c.status === 'reviewing').length,
    processing: allCases.filter((c: any) => c.status === 'processing').length,
    completed:  allCases.filter((c: any) => c.status === 'completed').length,
    cancelled:  allCases.filter((c: any) => c.status === 'cancelled').length,
    revenue:    allCases.filter((c: any) => c.payment_status === 'paid').reduce((s: number, c: any) => s + (c.paid_amount || 0), 0),
  }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>신청 관리</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>총 {stats.total}건 · 누적 결제 {stats.revenue.toLocaleString()}원</p>
      </div>

      {/* 스탯 바 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: '접수완료', value: stats.submitted,  color: '#1D4ED8', bg: '#DBEAFE' },
          { label: '서류확인', value: stats.reviewing,  color: '#6D28D9', bg: '#EDE9FE' },
          { label: '처리중',   value: stats.processing, color: '#B45309', bg: '#FEF3C7' },
          { label: '완료',     value: stats.completed,  color: '#065F46', bg: '#D1FAE5' },
          { label: '취소',     value: stats.cancelled,  color: '#991B1B', bg: '#FEE2E2' },
        ].map(s => (
          <Link key={s.label} href={`/admin/cases?status=${STATUS_TABS.find(t => t.label === s.label)?.value}`}
            style={{ textDecoration: 'none', background: s.bg, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.color, opacity: 0.8 }}>{s.label}</span>
          </Link>
        ))}
      </div>

      {/* 검색 + 필터 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Suspense fallback={null}>
          <AdminFilterBar />
        </Suspense>
      </div>

      {/* 상태 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #E5E9EF', paddingBottom: 0 }}>
        {STATUS_TABS.map(t => (
          <Link key={t.value} href={`/admin/cases?status=${t.value}${filterSearch ? `&q=${filterSearch}` : ''}`}
            style={{
              textDecoration: 'none', padding: '8px 14px', fontSize: 13, fontWeight: 700,
              color: filterStatus === t.value ? '#2563EB' : '#9CA3AF',
              borderBottom: filterStatus === t.value ? '2px solid #2563EB' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
            {t.label}
            {t.value !== 'all' && (
              <span style={{ marginLeft: 4, fontSize: 11, background: filterStatus === t.value ? '#2563EB' : '#E5E9EF', color: filterStatus === t.value ? '#fff' : '#9CA3AF', padding: '1px 5px', borderRadius: 8 }}>
                {stats[t.value as keyof typeof stats] ?? 0}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* 케이스 테이블 */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9EF', overflow: 'hidden' }}>
        {/* 테이블 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 120px 120px 90px 1fr 90px 80px 70px',
          padding: '10px 16px', background: '#F8FAFC',
          borderBottom: '1px solid #E5E9EF', gap: 8,
        }}>
          {['접수일시', '신청인', '고인명', '사망일', '신청 서비스', '결제', '상태', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>
            신청 건이 없습니다
          </div>
        ) : (
          filtered.map((c: any) => {
            const del = delegationsMap[c.id]
            const profile: { name: string; email: string; phone: string } = profileMap[c.user_id] || { name: '', email: '', phone: '' }
            const applicantName = del?.delegator_name || profile.name || '-'
            const applicantPhone = del?.delegator_phone || c.delegator_phone || profile.phone || '-'
            const services: any[] = c.case_services || []
            const docs: any[] = c.case_documents || []
            const statusBadge = STATUS_BADGE[c.status] || STATUS_BADGE['submitted']
            const payBadge = PAYMENT_BADGE[c.payment_status || 'pending']
            const createdAt = new Date(c.created_at)
            const docTypes = docs.map((d: any) => d.doc_type)

            return (
              <div key={c.id} style={{
                display: 'grid',
                gridTemplateColumns: '140px 120px 120px 90px 1fr 90px 80px 70px',
                padding: '14px 16px', gap: 8,
                borderBottom: '1px solid #F3F4F6',
                alignItems: 'center',
              }}>
                {/* 접수일시 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                    {createdAt.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    {createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* 신청인 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{applicantName}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{applicantPhone}</div>
                </div>

                {/* 고인명 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{c.deceased_name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    {docTypes.includes('death_cert') ? '📋사망진단서' : '서류없음'}
                    {docTypes.includes('id_card') ? ' · 신분증' : ''}
                  </div>
                </div>

                {/* 사망일 */}
                <div style={{ fontSize: 12, color: '#6B7280' }}>{c.deceased_death || '-'}</div>

                {/* 서비스 */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {services.map((s: any) => (
                    <span key={s.id} style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                      background: s.status === 'done' ? '#D1FAE5' : '#EFF6FF',
                      color: s.status === 'done' ? '#065F46' : '#1D4ED8',
                    }}>
                      {s.service_name}
                    </span>
                  ))}
                  {services.length === 0 && <span style={{ fontSize: 11, color: '#D1D5DB' }}>없음</span>}
                </div>

                {/* 결제 */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: payBadge.color }}>{payBadge.label}</div>
                  {c.paid_amount && (
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{Number(c.paid_amount).toLocaleString()}원</div>
                  )}
                </div>

                {/* 상태 */}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
                  background: statusBadge.bg, color: statusBadge.color, whiteSpace: 'nowrap',
                }}>
                  {statusBadge.label}
                </span>

                {/* 관리 버튼 */}
                <Link href={`/admin/cases/${c.id}`} style={{
                  fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none',
                  padding: '6px 10px', borderRadius: 8, background: '#EFF6FF', whiteSpace: 'nowrap',
                }}>
                  상세 →
                </Link>
              </div>
            )
          })
        )}
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>
        {filtered.length}건 표시 중 (전체 {allCases.length}건)
      </p>
    </div>
  )
}
