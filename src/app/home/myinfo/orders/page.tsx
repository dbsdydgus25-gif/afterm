import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  submitted:  { label: '접수 완료',              color: '#2563EB', bg: '#EFF6FF', dot: '🔵' },
  reviewing:  { label: '서류 확인',              color: '#7C3AED', bg: '#F5F3FF', dot: '🟣' },
  processing: { label: '처리 중',               color: '#D97706', bg: '#FFFBEB', dot: '🟡' },
  completed:  { label: '처리 완료 (정산 대기)',  color: '#059669', bg: '#ECFDF5', dot: '🟢' },
  settled:    { label: '최종 완료 (정산 완료)',  color: '#374151', bg: '#F9FAFB', dot: '⚫' },
}

function getOrderStatus(caseStatus: string, settled: boolean) {
  if (settled || caseStatus === 'settled') return 'settled'
  return caseStatus
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: cases } = await supabase
    .from('cases')
    .select('id, deceased_name, status, created_at, settled_at, case_services(id, service_name, service_category, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const inProgress = (cases || []).filter(c => ['submitted', 'reviewing', 'processing'].includes(c.status))
  const done = (cases || []).filter(c => c.status === 'completed')
  const settled = (cases || []).filter(c => c.status === 'settled')

  const Section = ({ title, items, emptyMsg }: { title: string; items: any[]; emptyMsg: string }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', background: '#EBF3FF', padding: '2px 8px', borderRadius: 100 }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '20px 24px', color: '#aaa', fontSize: 14, textAlign: 'center' }}>{emptyMsg}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {items.map(c => {
            const meta = STATUS_META[c.status] || STATUS_META['submitted']
            const svcCount = c.case_services?.length || 0
            const doneCount = c.case_services?.filter((s: any) => s.status === 'done').length || 0
            const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
            return (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 18, padding: '20px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                border: '1.5px solid #f0f2f5',
              }}>
                {/* 상단 - 고인 정보 + 상태 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#999', margin: '0 0 3px', fontWeight: 600 }}>고인</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: 0 }}>{c.deceased_name}님</p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
                    background: meta.bg, color: meta.color,
                  }}>
                    {meta.dot} {meta.label}
                  </span>
                </div>

                {/* 구분선 */}
                <div style={{ height: 1, background: '#f3f4f6', marginBottom: 14 }} />

                {/* 서비스 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {(c.case_services || []).map((svc: any) => {
                    const isDone = svc.status === 'done'
                    return (
                      <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>
                          {svc.service_category && <span style={{ fontSize: 12, color: '#999', marginRight: 6 }}>{svc.service_category}</span>}
                          {svc.service_name}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
                          background: isDone ? '#DCFCE7' : '#F3F4F6',
                          color: isDone ? '#15803D' : '#9CA3AF',
                        }}>
                          {isDone ? '완료' : '처리중'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 구분선 */}
                <div style={{ height: 1, background: '#f3f4f6', marginBottom: 12 }} />

                {/* 하단 메타 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#aaa' }}>신청일 {createdAt}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>
                    {doneCount}/{svcCount}개 완료
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", paddingBottom: 100 }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f2f5' }}>
        <Link href="/home/myinfo" style={{ color: '#111', textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>신청 내역</h1>
      </div>

      <div style={{ paddingTop: 20 }}>
        <Section
          title="📋 진행 중"
          items={inProgress}
          emptyMsg="진행 중인 신청이 없습니다"
        />
        <Section
          title="✅ 처리 완료 (정산 대기)"
          items={done}
          emptyMsg="처리 완료된 신청이 없습니다"
        />
        <Section
          title="🏁 최종 완료 (정산 완료)"
          items={settled}
          emptyMsg="정산 완료된 신청이 없습니다"
        />
      </div>
    </div>
  )
}
