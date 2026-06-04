// 신청내역 페이지 — 서버 컴포넌트
// 케이스별로 캐러셀 스와이프 → 각 케이스 안에서 서비스 카드 스와이프
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import OrderCaseCarousel from './OrderCaseCarousel'

// 케이스 상태 메타
const CASE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  submitted:  { label: '접수 완료', color: '#2563EB', bg: '#EFF6FF' },
  reviewing:  { label: '서류 확인', color: '#7C3AED', bg: '#F5F3FF' },
  processing: { label: '처리 중',   color: '#D97706', bg: '#FFFBEB' },
  completed:  { label: '처리 완료', color: '#059669', bg: '#ECFDF5' },
}

function shortId(id: string) {
  return id.replace(/-/g, '').toUpperCase().slice(0, 10)
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // 모든 케이스 + 서비스 조회
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
      minHeight: '100vh', background: '#F4F6F9', paddingBottom: 100,
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 16px', background: '#163272',
        position: 'sticky', top: 0, zIndex: 10,
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>신청 내역이 없어요</p>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.6 }}>디지털 유산 행정 대행을<br />신청해보세요</p>
          <Link href="/apply" style={{ background: '#163272', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            신청하기 →
          </Link>
        </div>
      ) : (
        <div style={{ padding: '16px 0 0' }}>
          {cases!.map((c: any) => {
            const cMeta = CASE_STATUS[c.status] || CASE_STATUS['submitted']
            const services: any[] = c.case_services || []
            const doneCount = services.filter((s: any) => s.status === 'done').length
            const progressPct = services.length ? Math.round((doneCount / services.length) * 100) : 0
            const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })

            return (
              <div key={c.id} style={{ marginBottom: 12 }}>
                {/* 케이스 헤더 카드 */}
                <div style={{ padding: '0 16px 10px' }}>
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: '16px',
                    border: '1px solid #E8EAF0',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  }}>
                    {/* 고인 이름 + 상태 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 700, letterSpacing: '0.04em' }}>고인</p>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
                          {c.deceased_name}님
                        </h2>
                        <p style={{ fontSize: 11, color: '#C4C4CC', margin: '3px 0 0', fontWeight: 600 }}>
                          신청 {createdAt}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: cMeta.bg, color: cMeta.color }}>
                          {cMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* 신청번호 + 진행률 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F4F6F9', borderRadius: 10 }}>
                      <div>
                        <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0, fontWeight: 700, letterSpacing: '0.04em' }}>신청번호</p>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#163272', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                          #{shortId(c.id)}
                        </p>
                      </div>
                      <div style={{ width: 1, height: 28, background: '#E0E0E0' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700 }}>전체 진행률</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: progressPct === 100 ? '#059669' : '#163272' }}>
                            {doneCount}/{services.length} · {progressPct}%
                          </span>
                        </div>
                        <div style={{ height: 5, background: '#E8EAF0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: progressPct === 100 ? '#10B981' : '#163272',
                            width: `${progressPct}%`, transition: 'width .6s',
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* 케이스 단계 */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                      {['접수 완료', '서류 확인', '처리 중', '처리 완료'].map((label, i) => {
                        const statusOrder = ['submitted', 'reviewing', 'processing', 'completed']
                        const curIdx = statusOrder.indexOf(c.status)
                        const isActive = i === curIdx
                        const isPast = i < curIdx
                        return (
                          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{
                              height: 3, borderRadius: 2,
                              background: isActive ? '#163272' : isPast ? '#93A8D4' : '#E8EAF0',
                            }} />
                            <span style={{
                              fontSize: 9, textAlign: 'center',
                              color: isActive ? '#163272' : isPast ? '#93A8D4' : '#D1D5DB',
                              fontWeight: isActive ? 800 : 500,
                            }}>
                              {isActive ? `● ${label}` : label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 서비스 카드 캐러셀 (클라이언트 컴포넌트) */}
                {services.length > 0 && (
                  <OrderCaseCarousel services={services} caseId={c.id} userId={user.id} />
                )}

                {/* 케이스 구분선 */}
                <div style={{ height: 6, background: '#E8EAF0', marginTop: 4 }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
