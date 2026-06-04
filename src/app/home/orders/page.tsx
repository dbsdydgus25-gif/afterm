import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ServiceCard from './ServiceCard'

// 케이스 상태 메타
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>신청 내역</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
            {hasAny ? `총 ${cases!.length}건의 신청` : '신청 내역이 없습니다'}
          </p>
        </div>
        <Link href="/apply?reset=true" style={{
          background: '#163272', color: '#fff', padding: '9px 16px',
          borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          + 새 신청
        </Link>
      </div>

      {!hasAny ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>신청 내역이 없어요</p>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 28px', lineHeight: 1.6 }}>
            디지털 유산 행정 대행을<br />신청해보세요
          </p>
          <Link href="/apply" style={{
            background: '#163272', color: '#fff', padding: '14px 28px',
            borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            신청하기 →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {cases!.map((c: any) => {
            const cMeta = CASE_STATUS[c.status] || CASE_STATUS['submitted']
            const services: any[] = c.case_services || []
            const doneCount = services.filter((s: any) => s.status === 'done').length
            const progressPct = services.length ? Math.round((doneCount / services.length) * 100) : 0
            const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'short', day: 'numeric',
            })

            return (
              <div key={c.id} style={{ marginTop: 20 }}>
                {/* ── 케이스 헤더 ── */}
                <div style={{ padding: '0 20px 12px' }}>
                  {/* 고인명 + 상태 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 700, letterSpacing: '0.06em' }}>고인</p>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
                        {c.deceased_name}님
                      </h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
                        background: cMeta.bg, color: cMeta.color,
                        border: `1px solid ${cMeta.color}33`,
                      }}>
                        {cMeta.label}
                      </span>
                      <p style={{ fontSize: 10, color: '#C4C4CC', margin: '4px 0 0', fontWeight: 600 }}>신청 {createdAt}</p>
                    </div>
                  </div>

                  {/* 신청번호 + 진행률 카드 */}
                  <div style={{
                    background: '#fff', borderRadius: 14, padding: '12px 16px',
                    border: '1px solid #F0F0F0',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, fontWeight: 600 }}>신청번호</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#163272', margin: '2px 0 0', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
                        #{shortId(c.id)}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>전체 진행률</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: progressPct === 100 ? '#059669' : '#163272' }}>
                          {doneCount}/{services.length}개 · {progressPct}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: progressPct === 100 ? '#10B981' : '#163272',
                          width: `${progressPct}%`,
                          transition: 'width .6s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 서비스 카드 — 가로 스크롤 ── */}
                {services.length === 0 ? (
                  <p style={{ padding: '0 20px', fontSize: 13, color: '#C4C4CC' }}>선택된 서비스 없음</p>
                ) : (
                  <div style={{
                    display: 'flex', gap: 12, overflowX: 'auto',
                    padding: '4px 20px 20px',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  }}>
                    {services.map((svc: any) => (
                      <ServiceCard
                        key={svc.id}
                        svc={svc}
                        caseId={c.id}
                        userId={user.id}
                      />
                    ))}
                  </div>
                )}

                {/* 섹션 구분선 */}
                <div style={{ height: 8, background: '#E8EAF0' }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
