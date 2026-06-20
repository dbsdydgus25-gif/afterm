export const revalidate = 0  // 신청내역은 항상 최신 데이터

// 신청내역 페이지 — 서버 컴포넌트
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      id, deceased_name, status, created_at, payment_status, paid_amount,
      case_services (id, service_name, service_category, status, status_note)
    `)
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) console.error('[orders]', error)

  const allCases = (cases || []) as any[]
  const activeCases = allCases.filter(c => !['completed', 'cancelled'].includes(c.status))
  const doneCases = allCases.filter(c => ['completed', 'cancelled'].includes(c.status))

  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      height: '100dvh', background: '#F4F6F9',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px 14px', background: '#2563EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>신청 내역</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '3px 0 0' }}>
              진행 중 {activeCases.length}건 · 완료 {doneCases.length}건
            </p>
          </div>
          <Link href="/apply/new" style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 14px',
            borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>+ 새 신청</Link>
        </div>
      </div>

      {allCases.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>신청 내역이 없어요</p>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.6 }}>디지털 유산 행정 대행을<br />신청해보세요</p>
          <Link href="/apply" style={{ background: '#2563EB', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            신청하기 →
          </Link>
        </div>
      ) : (
        <OrdersClient activeCases={activeCases} doneCases={doneCases} userId={user.id} />
      )}
    </div>
  )
}
