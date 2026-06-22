export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function ageGroup(birthStr: string | null, deathStr: string | null): string {
  if (!birthStr) return '미상'
  const birth = new Date(birthStr)
  const ref = deathStr ? new Date(deathStr) : new Date()
  const age = ref.getFullYear() - birth.getFullYear()
  if (age < 40) return '40세 미만'
  if (age < 50) return '40대'
  if (age < 60) return '50대'
  if (age < 70) return '60대'
  if (age < 80) return '70대'
  if (age < 90) return '80대'
  return '90세 이상'
}

const AGE_ORDER = ['40세 미만', '40대', '50대', '60대', '70대', '80대', '90세 이상', '미상']

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') redirect('/admin-login')

  const adminClient = createAdminClient()

  const { data: cases } = await adminClient
    .from('cases')
    .select('id, deceased_name, deceased_birth, deceased_death, deceased_gender, created_at, paid_amount, payment_status, case_services(service_name, service_category, status)')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  const allCases = cases || []
  const paidCases = allCases.filter(c => c.payment_status === 'paid' || c.payment_status === 'refunded')

  // ── 연령대 분포 ──
  const ageDist: Record<string, number> = {}
  for (const c of allCases) {
    const g = ageGroup(c.deceased_birth, c.deceased_death)
    ageDist[g] = (ageDist[g] || 0) + 1
  }

  // ── 월별 신청 추이 (최근 6개월) ──
  const now = new Date()
  const monthlyData: { label: string; count: number; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `${d.getMonth() + 1}월`
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const monthCases = paidCases.filter(c => {
      const t = new Date(c.created_at)
      return t >= d && t < nextD
    })
    monthlyData.push({
      label,
      count: monthCases.length,
      amount: monthCases.reduce((s, c) => s + (Number(c.paid_amount) || 0), 0),
    })
  }
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1)

  // ── 서비스별 신청 수 ──
  const svcDist: Record<string, number> = {}
  for (const c of allCases) {
    for (const s of (c.case_services || [])) {
      svcDist[s.service_name] = (svcDist[s.service_name] || 0) + 1
    }
  }
  const topSvcs = Object.entries(svcDist).sort(([, a], [, b]) => b - a).slice(0, 8)

  // ── 총 매출 ──
  const totalRevenue = paidCases.reduce((s, c) => s + (Number(c.paid_amount) || 0), 0)
  const avgAmount = paidCases.length ? Math.round(totalRevenue / paidCases.length) : 0

  // ── 고인 연령 평균 ──
  const ages = allCases
    .map(c => {
      if (!c.deceased_birth) return null
      const birth = new Date(c.deceased_birth)
      const ref = c.deceased_death ? new Date(c.deceased_death) : new Date()
      return ref.getFullYear() - birth.getFullYear()
    })
    .filter((a): a is number => a !== null && a > 0 && a < 120)
  const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>데이터 분석</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>고인 연령대 · 서비스 패턴 · 매출 추이</p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '총 신청 건수', value: `${allCases.length}건`, sub: '드래프트 제외' },
          { label: '결제 완료', value: `${paidCases.length}건`, sub: '취소/환불 포함' },
          { label: '총 매출', value: `${totalRevenue.toLocaleString()}원`, sub: '결제 기준' },
          { label: avgAge ? `평균 고인 연령` : '평균 연령', value: avgAge ? `${avgAge}세` : '-', sub: ages.length > 0 ? `${ages.length}건 기준` : '데이터 없음' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e5e9ef' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#2563EB', letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 월별 신청 추이 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e5e9ef' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 20px' }}>월별 신청 추이 (최근 6개월)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
            {monthlyData.map(m => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>{m.count > 0 ? m.count : ''}</span>
                <div style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  background: m.count > 0 ? '#2563EB' : '#E8EAF0',
                  height: `${Math.max((m.count / maxCount) * 90, m.count > 0 ? 10 : 4)}px`,
                  transition: 'height 0.5s',
                }} />
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{m.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>이번 달 매출</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>
              {(monthlyData[monthlyData.length - 1]?.amount || 0).toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 고인 연령대 분포 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e5e9ef' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>고인 연령대 분포</h3>
          {allCases.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>데이터 없음</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AGE_ORDER.filter(g => ageDist[g]).map(g => {
                const cnt = ageDist[g] || 0
                const pct = Math.round((cnt / allCases.length) * 100)
                return (
                  <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', width: 70, flexShrink: 0 }}>{g}</span>
                    <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#2563EB', borderRadius: 100 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', width: 50, textAlign: 'right' }}>
                      {cnt}건 ({pct}%)
                    </span>
                  </div>
                )
              })}
              {ageDist['미상'] && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  * 생년월일 미입력 {ageDist['미상']}건 제외
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 서비스별 신청 현황 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e5e9ef' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>서비스별 신청 현황 (Top 8)</h3>
        {topSvcs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>데이터 없음</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {topSvcs.map(([name, cnt], i) => {
              const maxSvc = topSvcs[0][1]
              const pct = Math.round((cnt / maxSvc) * 100)
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: i < 3 ? '#2563EB' : '#E8EAF0',
                    color: i < 3 ? '#fff' : '#6b7280', fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB' }}>{cnt}건</span>
                    </div>
                    <div style={{ height: 5, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: i < 3 ? '#2563EB' : '#93C5FD', borderRadius: 100 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
