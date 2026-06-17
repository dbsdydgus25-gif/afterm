import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatKRW(amount: number | null) {
  if (!amount) return '-'
  return amount.toLocaleString('ko-KR') + '원'
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  paid:     { label: '결제완료', color: '#059669', bg: '#ECFDF5' },
  refunded: { label: '환불완료', color: '#DC2626', bg: '#FEF2F2' },
  pending:  { label: '미결제',   color: '#D97706', bg: '#FFFBEB' },
  failed:   { label: '실패',     color: '#6B7280', bg: '#F9FAFB' },
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('cases')
    .select(`
      id, deceased_name, created_at,
      payment_status, payment_id, paid_amount, paid_at, refunded_at,
      profiles:user_id (full_name, phone)
    `)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('payment_status', searchParams.status)
  }

  const { data: cases } = await query

  const filtered = cases?.filter(c => {
    if (!searchParams.q) return true
    const q = searchParams.q.toLowerCase()
    return (
      c.deceased_name?.toLowerCase().includes(q) ||
      (c.profiles as any)?.full_name?.toLowerCase().includes(q) ||
      c.payment_id?.toLowerCase().includes(q)
    )
  }) ?? []

  const totalPaid    = filtered.filter(c => c.payment_status === 'paid').reduce((s, c) => s + (c.paid_amount || 0), 0)
  const totalRefunded = filtered.filter(c => c.payment_status === 'refunded').reduce((s, c) => s + (c.paid_amount || 0), 0)
  const countPaid    = filtered.filter(c => c.payment_status === 'paid').length
  const countRefund  = filtered.filter(c => c.payment_status === 'refunded').length
  const countPending = filtered.filter(c => !c.payment_status || c.payment_status === 'pending').length

  const TABS = [
    { value: 'all',      label: '전체' },
    { value: 'paid',     label: '결제완료' },
    { value: 'refunded', label: '환불' },
    { value: 'pending',  label: '미결제' },
  ]

  const currentStatus = searchParams.status || 'all'

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>결제 관리</h1>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: '총 결제액', value: formatKRW(totalPaid), color: '#059669' },
          { label: '총 환불액', value: formatKRW(totalRefunded), color: '#DC2626' },
          { label: '결제 완료', value: `${countPaid}건`, color: '#2563EB' },
          { label: '미결제', value: `${countPending}건`, color: '#D97706' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: 14, padding: '18px 20px',
            border: '1px solid #E5E9EF', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 6px', fontWeight: 600 }}>{card.label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* 필터 탭 + 검색 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
          {TABS.map(tab => (
            <Link
              key={tab.value}
              href={`/admin/payments?status=${tab.value}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
              style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
                background: currentStatus === tab.value ? '#fff' : 'transparent',
                color: currentStatus === tab.value ? '#163272' : '#6B7280',
                boxShadow: currentStatus === tab.value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form method="GET" action="/admin/payments" style={{ display: 'flex', gap: 6 }}>
          <input type="hidden" name="status" value={currentStatus} />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="고인명 / 신청인 / 결제 ID 검색"
            style={{
              padding: '8px 14px', border: '1px solid #E5E9EF', borderRadius: 8,
              fontSize: 13, width: 260, outline: 'none',
            }}
          />
          <button type="submit" style={{
            padding: '8px 16px', background: '#163272', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>검색</button>
        </form>
      </div>

      {/* 테이블 */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #E5E9EF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E9EF' }}>
              {['신청인', '고인', '결제 금액', '결제 상태', '결제일시', '환불일시', '결제 ID', '액션'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                  결제 내역이 없습니다
                </td>
              </tr>
            ) : filtered.map((c, idx) => {
              const profile = c.profiles as any
              const payStatus = c.payment_status || 'pending'
              const meta = STATUS_META[payStatus] || STATUS_META['pending']

              return (
                <tr key={c.id} style={{
                  borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                  transition: 'background 0.1s',
                }}>
                  <td style={{ padding: '14px', fontWeight: 600, color: '#111827' }}>
                    <div>{profile?.full_name || '-'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{profile?.phone || ''}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#374151' }}>{c.deceased_name}</td>
                  <td style={{ padding: '14px', fontWeight: 800, color: '#111827' }}>
                    {formatKRW(c.paid_amount)}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
                      background: meta.bg, color: meta.color,
                    }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px', color: '#6B7280', fontSize: 12 }}>
                    {formatDate(c.paid_at)}
                  </td>
                  <td style={{ padding: '14px', color: '#6B7280', fontSize: 12 }}>
                    {formatDate(c.refunded_at)}
                  </td>
                  <td style={{ padding: '14px' }}>
                    {c.payment_id ? (
                      <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>
                        {c.payment_id.slice(0, 20)}...
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Link href={`/admin/cases/${c.id}`} style={{
                      fontSize: 12, fontWeight: 700, color: '#163272', textDecoration: 'none',
                      padding: '5px 10px', background: '#EBF3FF', borderRadius: 6,
                    }}>
                      케이스 보기
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
        총 {filtered.length}건 · 환불은 각 케이스 상세 페이지에서 처리
      </p>
    </div>
  )
}
