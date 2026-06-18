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
      id, deceased_name, status, created_at,
      case_services (id, service_name, service_category, status, status_note)
    `)
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) console.error('[orders]', error)

  const hasAny = (cases?.length ?? 0) > 0

  return (
    <div style={{
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      height: '100dvh', background: '#F4F6F9',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px 20px 14px', background: '#0066FF', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>신청 내역</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '3px 0 0' }}>
              {hasAny ? `총 ${cases!.length}건 진행 중` : '신청 내역이 없습니다'}
            </p>
          </div>
          <Link href="/apply?reset=true" style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 14px',
            borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>+ 새 신청</Link>
        </div>
      </div>

      {!hasAny ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>신청 내역이 없어요</p>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.6 }}>디지털 유산 행정 대행을<br />신청해보세요</p>
          <Link href="/apply" style={{ background: '#0066FF', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            신청하기 →
          </Link>
        </div>
      ) : (
        <OrdersClient cases={cases as any} userId={user.id} />
      )}
    </div>
  )
}
