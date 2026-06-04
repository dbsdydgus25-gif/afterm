import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ServiceCarousel from './ServiceCarousel'

const CASE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  submitted:  { label: '접수 완료', color: '#2563EB', bg: '#EFF6FF' },
  reviewing:  { label: '서류 확인', color: '#7C3AED', bg: '#F5F3FF' },
  processing: { label: '처리 중',   color: '#D97706', bg: '#FFFBEB' },
  completed:  { label: '처리 완료', color: '#059669', bg: '#ECFDF5' },
  settled:    { label: '정산 완료', color: '#374151', bg: '#F9FAFB' },
}

function shortId(id: string) {
  return id.replace(/-/g, '').toUpperCase().slice(0, 10)
}

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
      minHeight: '100vh', background: '#F0F2F5', paddingBottom: 100,
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 16px', background: '#fff',
        borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>신청 내역</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
            {hasAny ? `총 ${cases!.length}건` : '신청 내역이 없습니다'}
          </p>
        </div>
        <Link href="/apply?reset=true" style={{
          background: '#163272', color: '#fff', padding: '8px 14px',
          borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none',
        }}>+ 새 신청</Link>
      </div>

      {!hasAny ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>신청 내역이 없어요</p>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.6 }}>디지털 유산 행정 대행을<br />신청해보세요</p>
          <Link href="/apply" style={{ background: '#163272', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            신청하기 →
          </Link>
        </div>
      ) : (
        <div>
          {cases!.map((c: any) => {
            const cMeta = CASE_STATUS[c.status] || CASE_STATUS['submitted']
            const services: any[] = c.case_services || []
            const doneCount = services.filter((s: any) => s.status === 'done').length
            const progressPct = services.length ? Math.round((doneCount / services.length) * 100) : 0
            const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })

            return (
              <div key={c.id} style={{ marginTop: 16 }}>
                {/* 케이스 헤더 */}
                <div style={{ padding: '0 20px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 1px', fontWeight: 700, letterSpacing: '0.06em' }}>고인</p>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>{c.deceased_name}님</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: cMeta.bg, color: cMeta.color }}>
                        {cMeta.label}
                      </span>
                      <p style={{ fontSize: 10, color: '#C4C4CC', margin: '3px 0 0', fontWeight: 600 }}>신청 {createdAt}</p>
                    </div>
                  </div>

                  {/* 신청번호 + 진행률 */}
                  <div style={{
                    background: '#fff', borderRadius: 12, padding: '10px 14px',
                    border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div>
                      <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0, fontWeight: 600 }}>신청번호</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#163272', margin: '1px 0 0', letterSpacing: '0.04em' }}>#{shortId(c.id)}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>전체 진행률</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: progressPct === 100 ? '#059669' : '#163272' }}>
                          {doneCount}/{services.length} · {progressPct}%
                        </span>
                      </div>
                      <div style={{ height: 5, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: progressPct === 100 ? '#10B981' : '#163272',
                          width: `${progressPct}%`, transition: 'width .6s',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 서비스 카드 — 캐러셀 (도트 인디케이터 포함) */}
                {services.length === 0 ? (
                  <p style={{ padding: '0 20px', fontSize: 13, color: '#C4C4CC' }}>선택된 서비스 없음</p>
                ) : (
                  <ServiceCarousel services={services} caseId={c.id} userId={user.id} />
                )}

                <div style={{ height: 8, background: '#E8EAF0' }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
