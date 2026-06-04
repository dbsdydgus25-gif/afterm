import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: '작성 중',   color: '#6B7280', bg: '#F3F4F6' },
  submitted:  { label: '접수 완료', color: '#2563EB', bg: '#EFF6FF' },
  reviewing:  { label: '서류 확인', color: '#7C3AED', bg: '#F5F3FF' },
  processing: { label: '처리 중',   color: '#D97706', bg: '#FFFBEB' },
  completed:  { label: '완료됨',    color: '#059669', bg: '#ECFDF5' },
  cancelled:  { label: '취소됨',    color: '#DC2626', bg: '#FEF2F2' },
}

export default async function AdminPage() {
  const adminClient = createAdminClient()

  const [
    { count: totalCases },
    { count: submittedCases },
    { count: reviewingCases },
    { count: processingCases },
    { count: completedCases },
    { count: totalServices },
    { count: doneServices },
    { data: recentCases },
    { data: serviceStats },
  ] = await Promise.all([
    adminClient.from('cases').select('*', { count: 'exact', head: true }).neq('status', 'draft'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    adminClient.from('case_services').select('*', { count: 'exact', head: true }),
    adminClient.from('case_services').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    adminClient.from('cases')
      .select(`id, deceased_name, deceased_death, status, created_at, case_services(id, status)`)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(20),
    adminClient.from('case_services')
      .select('service_name, service_category, status')
      .order('created_at', { ascending: false }),
  ])

  const categoryStats = (serviceStats || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.service_category] = (acc[s.service_category] || 0) + 1
    return acc
  }, {})

  const serviceNameStats = (serviceStats || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.service_name] = (acc[s.service_name] || 0) + 1
    return acc
  }, {})
  const topServices = Object.entries(serviceNameStats).sort(([, a], [, b]) => b - a).slice(0, 10)
  const completionRate = totalServices ? Math.round(((doneServices || 0) / totalServices) * 100) : 0

  const STATS = [
    { label: '전체 신청',  value: totalCases || 0,      desc: '누적 대행 신청 건수', color: '#163272', bg: '#EBF3FF', emoji: '📋' },
    { label: '접수 완료',  value: submittedCases || 0,  desc: '서류 검토 대기 중',   color: '#2563EB', bg: '#EFF6FF', emoji: '📬' },
    { label: '서류 확인',  value: reviewingCases || 0,  desc: '서류 확인 진행 중',   color: '#7C3AED', bg: '#F5F3FF', emoji: '🔍' },
    { label: '처리 중',    value: processingCases || 0, desc: '행정 처리 진행 중',   color: '#D97706', bg: '#FFFBEB', emoji: '⚙️' },
    { label: '처리 완료',  value: completedCases || 0,  desc: '최종 완료 케이스',    color: '#059669', bg: '#ECFDF5', emoji: '✅' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>대시보드</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} 기준 실시간 현황
        </p>
      </div>

      {/* 지표 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '20px 22px',
            border: '1px solid #e5e9ef', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{s.label}</span>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{s.emoji}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {s.value.toLocaleString()}
            </div>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{s.desc}</span>
          </div>
        ))}
      </div>

      {/* 중간 2열 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 완료율 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e5e9ef' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>서비스 완료율</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 20px' }}>개별 기업 요청서 기준</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#163272' }}>{completionRate}%</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>완료율</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${completionRate}%`, background: '#163272', borderRadius: 100, transition: 'width 0.8s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                <span>완료 {doneServices || 0}건</span>
                <span>전체 {totalServices || 0}건</span>
              </div>
            </div>
          </div>
        </div>

        {/* 카테고리 분포 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e5e9ef' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>카테고리별 분포</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 16px' }}>해지 요청 분야별 비중</p>
          {Object.entries(categoryStats).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(categoryStats).sort(([, a], [, b]) => b - a).slice(0, 4).map(([cat, count]) => {
                const pct = totalServices ? Math.round((count / totalServices) * 100) : 0
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', width: 80, flexShrink: 0 }}>{cat}</span>
                    <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#163272', borderRadius: 100 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', width: 50, textAlign: 'right' }}>{count}건</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>데이터 없음</div>
          )}
        </div>
      </div>

      {/* 최근 신청 테이블 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>최근 신청 목록</h3>
          <Link href="/admin/cases" style={{ fontSize: 13, color: '#163272', fontWeight: 600, textDecoration: 'none' }}>
            전체 보기 →
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['고인 성명', '사망일', '신청일', '서비스', '진행도', '상태', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCases && recentCases.length > 0 ? recentCases.map((c: any) => {
                const si = STATUS_LABEL[c.status] || { label: c.status, color: '#999', bg: '#f3f4f6' }
                const services = c.case_services || []
                const done = services.filter((s: any) => s.status === 'done').length
                const pct = services.length ? Math.round((done / services.length) * 100) : 0
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: '#111' }}>{c.deceased_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b7280' }}>{c.deceased_death}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b7280' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{services.length}건</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 5, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#10b981' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: si.bg, color: si.color }}>{si.label}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <Link href={`/admin/cases/${c.id}`} style={{ fontSize: 13, color: '#163272', fontWeight: 700, textDecoration: 'none' }}>관리 →</Link>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 14 }}>신청 내역 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
