import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// 서비스 상태 메타
const SVC_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: '대기',      color: '#6B7280', bg: '#F3F4F6' },
  dispatched: { label: '발송 완료', color: '#2563EB', bg: '#EFF6FF' },
  received:   { label: '기업 접수', color: '#7C3AED', bg: '#F5F3FF' },
  done:       { label: '처리 완료', color: '#059669', bg: '#ECFDF5' },
  failed:     { label: '처리 실패', color: '#DC2626', bg: '#FEF2F2' },
}

// 케이스 상태 메타
const CASE_STATUS: Record<string, { label: string; color: string; step: number }> = {
  submitted:  { label: '접수 완료', color: '#2563EB', step: 1 },
  reviewing:  { label: '서류 확인', color: '#7C3AED', step: 2 },
  processing: { label: '처리 중',   color: '#D97706', step: 3 },
  completed:  { label: '처리 완료', color: '#059669', step: 4 },
  settled:    { label: '정산 완료', color: '#374151', step: 5 },
}

// 서비스 아이콘 (카테고리별)
const SERVICE_ICONS: Record<string, string> = {
  '통신': '📱', '금융': '🏦', '보험': '📄', '포털': '💻',
  '이메일': '✉️', 'SNS': '📸', '구독': '💳', '기타': '📋',
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
      case_services (id, service_name, service_category, status)
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
        padding: '20px 24px 16px', background: '#fff',
        borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>신청 내역</h1>
        <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
          {hasAny ? `총 ${cases!.length}건의 신청` : '신청 내역이 없습니다'}
        </p>
      </div>

      {!hasAny ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#333', margin: '0 0 8px' }}>신청 내역이 없어요</p>
          <p style={{ fontSize: 14, color: '#999', margin: '0 0 28px', lineHeight: 1.6 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
          {cases!.map((c: any) => {
            const cMeta = CASE_STATUS[c.status] || CASE_STATUS['submitted']
            const services: any[] = c.case_services || []
            const doneCount = services.filter((s: any) => s.status === 'done').length
            const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'short', day: 'numeric',
            })

            return (
              <div key={c.id}>
                {/* 고인 섹션 헤더 */}
                <div style={{ padding: '0 20px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        고인
                      </p>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
                        {c.deceased_name}님
                      </h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100,
                        background: '#EBF3FF', color: cMeta.color,
                      }}>
                        {cMeta.label}
                      </span>
                      <p style={{ fontSize: 10, color: '#bbb', margin: '4px 0 0', fontWeight: 600 }}>
                        신청 {createdAt}
                      </p>
                    </div>
                  </div>

                  {/* 신청번호 + 진행률 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff', borderRadius: 12, padding: '10px 14px', marginTop: 10,
                    border: '1px solid #f0f0f0',
                  }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#aaa', margin: 0, fontWeight: 600 }}>신청번호</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#163272', margin: '2px 0 0', letterSpacing: '0.05em' }}>
                        #{shortId(c.id)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, color: '#aaa', margin: 0, fontWeight: 600 }}>진행률</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '2px 0 0' }}>
                        {doneCount}/{services.length}개 완료
                      </p>
                    </div>
                    <div style={{ width: 80 }}>
                      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: '#163272',
                          width: services.length ? `${Math.round((doneCount / services.length) * 100)}%` : '0%',
                          transition: 'width .5s',
                        }} />
                      </div>
                      <p style={{ fontSize: 10, color: '#888', margin: '3px 0 0', textAlign: 'right', fontWeight: 700 }}>
                        {services.length ? Math.round((doneCount / services.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* 서비스 카드 가로 스크롤 */}
                {services.length === 0 ? (
                  <p style={{ padding: '0 20px', fontSize: 13, color: '#bbb' }}>선택된 서비스 없음</p>
                ) : (
                  <div style={{
                    display: 'flex', gap: 14, overflowX: 'auto',
                    padding: '4px 20px 12px', scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none', scrollbarWidth: 'none',
                  }}>
                    {services.map((svc: any) => {
                      const sMeta = SVC_STATUS[svc.status] || SVC_STATUS['pending']
                      const icon = SERVICE_ICONS[svc.service_category] || '📋'
                      const isPaid = svc.status === 'done' // 완료된 서비스는 결제 완료로 간주

                      return (
                        <div key={svc.id} style={{
                          flexShrink: 0, width: 168,
                          scrollSnapAlign: 'start',
                          // Neumorphic style
                          background: '#F0F2F5',
                          borderRadius: 24,
                          padding: '20px 18px',
                          boxShadow: '8px 8px 16px rgba(0,0,0,0.12), -8px -8px 16px rgba(255,255,255,0.85)',
                          display: 'flex', flexDirection: 'column', gap: 12,
                          transition: 'box-shadow 0.2s',
                        }}>
                          {/* 아이콘 */}
                          <div style={{
                            width: 52, height: 52, borderRadius: 16,
                            background: '#F0F2F5',
                            boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24,
                          }}>
                            {icon}
                          </div>

                          {/* 서비스 정보 */}
                          <div>
                            <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700 }}>
                              {svc.service_category}
                            </p>
                            <p style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1.3, wordBreak: 'keep-all' }}>
                              {svc.service_name}
                            </p>
                          </div>

                          {/* 진행 상태 */}
                          <span style={{
                            alignSelf: 'flex-start', fontSize: 11, fontWeight: 700,
                            padding: '4px 10px', borderRadius: 100,
                            background: sMeta.bg, color: sMeta.color,
                          }}>
                            {sMeta.label}
                          </span>

                          {/* 구분선 */}
                          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />

                          {/* 결제 상태 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: isPaid ? '#22c55e' : '#f59e0b',
                              boxShadow: isPaid ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(245,158,11,0.5)',
                            }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: isPaid ? '#15803D' : '#92400E' }}>
                              {isPaid ? '정산 완료' : '정산 대기'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 구분선 */}
                <div style={{ height: 8, background: '#E8EAF0', margin: '4px 0 0' }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
