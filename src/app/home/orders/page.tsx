import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// 서비스 상태 메타
const SVC_STATUS: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: '대기 중',    color: '#6B7280', bg: '#F3F4F6', step: 1 },
  dispatched: { label: '발송 완료', color: '#2563EB', bg: '#EFF6FF', step: 2 },
  received:   { label: '기업 접수', color: '#7C3AED', bg: '#F5F3FF', step: 3 },
  done:       { label: '처리 완료', color: '#059669', bg: '#ECFDF5', step: 4 },
  failed:     { label: '처리 실패', color: '#DC2626', bg: '#FEF2F2', step: 0 },
}

// 케이스 상태 메타
const CASE_STATUS: Record<string, { label: string; color: string }> = {
  submitted:  { label: '접수 완료', color: '#2563EB' },
  reviewing:  { label: '서류 확인', color: '#7C3AED' },
  processing: { label: '처리 중',   color: '#D97706' },
  completed:  { label: '처리 완료', color: '#059669' },
  settled:    { label: '정산 완료', color: '#374151' },
}

// 서비스별 필요 서류 정보
const SVC_DOCS: Record<string, { docs: string[]; note: string }> = {
  '구글':       { docs: ['사망진단서 사본', '신청인 신분증'], note: '계정 삭제 또는 추모화 선택 가능. 영업일 7~14일 소요' },
  '카카오':     { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '카카오 고객센터 접수 후 영업일 5~10일 소요' },
  '카카오톡':   { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '카카오 고객센터 접수 후 영업일 5~10일 소요' },
  '네이버':     { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '네이버 회원 탈퇴 또는 계정 삭제 처리' },
  '인스타그램': { docs: ['사망진단서 사본', '신청인 신분증'], note: '추모 계정 전환 또는 삭제 선택 가능. 영업일 14일 내 처리' },
  '페이스북':   { docs: ['사망진단서 사본', '신청인 신분증'], note: '추모 계정 전환 또는 삭제 선택 가능' },
  '애플':       { docs: ['사망진단서 사본', '법원 명령서 또는 위임장'], note: '애플 법무팀 직접 처리, 4~8주 소요' },
  '기본':       { docs: ['사망진단서 사본', '가족관계증명서', '신청인 신분증'], note: '담당자가 서류 접수 후 처리 안내드립니다' },
}

// 서비스 진행 단계
const SVC_STEPS = ['대기 중', '발송 완료', '기업 접수', '처리 완료']

const SERVICE_ICONS: Record<string, string> = {
  '통신': '📱', '금융': '🏦', '보험': '📄', '포털': '💻',
  '이메일': '✉️', 'SNS': '📸', '구독': '💳', '메신저': '💬', '기타': '📋',
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
        padding: '20px 24px 16px', background: '#fff',
        borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>신청 내역</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            {hasAny ? `총 ${cases!.length}건의 신청` : '신청 내역이 없습니다'}
          </p>
        </div>
        <Link href="/apply?reset=true" style={{
          background: '#163272', color: '#fff', padding: '10px 18px',
          borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {cases!.map((c: any) => {
            const cMeta = CASE_STATUS[c.status] || CASE_STATUS['submitted']
            const services: any[] = c.case_services || []
            const doneCount = services.filter((s: any) => s.status === 'done').length
            const createdAt = new Date(c.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'short', day: 'numeric',
            })

            return (
              <div key={c.id} style={{ marginTop: 16 }}>
                {/* 고인 섹션 헤더 */}
                <div style={{ padding: '0 20px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 3px', fontWeight: 700, letterSpacing: '0.05em' }}>고인</p>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
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
                      <p style={{ fontSize: 10, color: '#bbb', margin: '4px 0 0', fontWeight: 600 }}>신청 {createdAt}</p>
                    </div>
                  </div>

                  {/* 신청번호 + 진행률 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff', borderRadius: 14, padding: '12px 16px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#aaa', margin: 0, fontWeight: 600 }}>신청번호</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#163272', margin: '2px 0 0', letterSpacing: '0.05em' }}>
                        #{shortId(c.id)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, color: '#aaa', margin: 0, fontWeight: 600 }}>진행률</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '2px 0 0' }}>
                        {doneCount}/{services.length}개 완료
                      </p>
                    </div>
                    <div style={{ width: 88 }}>
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

                {/* 서비스 카드 — 가로 스크롤, 거의 전체 너비 */}
                {services.length === 0 ? (
                  <p style={{ padding: '0 20px', fontSize: 13, color: '#bbb' }}>선택된 서비스 없음</p>
                ) : (
                  <div style={{
                    display: 'flex', gap: 14, overflowX: 'auto',
                    padding: '4px 20px 20px',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  }}>
                    {services.map((svc: any) => {
                      const sMeta = SVC_STATUS[svc.status] || SVC_STATUS['pending']
                      const icon = SERVICE_ICONS[svc.service_category] || '📋'
                      const isPaid = svc.status === 'done'
                      const docInfo = SVC_DOCS[svc.service_name] || SVC_DOCS['기본']
                      const currentStep = sMeta.step

                      return (
                        <div key={svc.id} style={{
                          flexShrink: 0,
                          width: 'calc(100vw - 56px)',
                          scrollSnapAlign: 'center',
                          background: '#F0F2F5',
                          borderRadius: 24,
                          padding: '22px 20px',
                          boxShadow: '8px 8px 20px rgba(0,0,0,0.10), -8px -8px 20px rgba(255,255,255,0.90)',
                        }}>
                          {/* 상단: 아이콘 + 서비스명 + 상태 뱃지 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                            <div style={{
                              width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                              background: '#F0F2F5',
                              boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.10), inset -4px -4px 10px rgba(255,255,255,0.95)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 26,
                            }}>
                              {icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 3px', fontWeight: 700 }}>
                                {svc.service_category}
                              </p>
                              <p style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', margin: 0, letterSpacing: '-0.01em' }}>
                                {svc.service_name}
                              </p>
                            </div>
                            <span style={{
                              flexShrink: 0, fontSize: 12, fontWeight: 700,
                              padding: '6px 12px', borderRadius: 100,
                              background: sMeta.bg, color: sMeta.color,
                            }}>
                              {sMeta.label}
                            </span>
                          </div>

                          {/* 진행 스텝 바 */}
                          <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
                            {SVC_STEPS.map((step, i) => {
                              const isActive = i + 1 === currentStep
                              const isPastStep = i + 1 < currentStep
                              return (
                                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                  <div style={{
                                    width: '100%', height: 4, borderRadius: 2,
                                    background: isPastStep || isActive ? '#163272' : 'rgba(0,0,0,0.12)',
                                    opacity: isPastStep ? 0.35 : 1,
                                  }} />
                                  <span style={{
                                    fontSize: 10, fontWeight: isActive ? 800 : 500,
                                    color: isActive ? '#163272' : isPastStep ? '#aaa' : '#ccc',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {isActive ? `● ${step}` : step}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* 구분선 */}
                          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '0 0 16px' }} />

                          {/* 필요 서류 */}
                          <div style={{ marginBottom: 14 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#555', margin: '0 0 10px' }}>
                              📎 제출 서류
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {docInfo.docs.map((doc, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                                    background: '#F0F2F5',
                                    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.10), inset -2px -2px 5px rgba(255,255,255,0.9)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, color: '#163272', fontWeight: 800,
                                  }}>
                                    {i + 1}
                                  </div>
                                  <span style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>{doc}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 안내 메모 */}
                          <div style={{
                            background: '#F0F2F5',
                            boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.08), inset -3px -3px 6px rgba(255,255,255,0.9)',
                            borderRadius: 12, padding: '10px 14px', marginBottom: 14,
                          }}>
                            <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.7 }}>
                              💡 {docInfo.note}
                            </p>
                          </div>

                          {/* 담당자 메모 (있을 때만) */}
                          {svc.status_note && (
                            <div style={{
                              background: '#FFF9E6', borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                              border: '1px solid #FEE500',
                            }}>
                              <p style={{ fontSize: 12, color: '#7A6100', margin: 0, lineHeight: 1.6 }}>
                                📢 {svc.status_note}
                              </p>
                            </div>
                          )}

                          {/* 정산 상태 */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 9, height: 9, borderRadius: '50%',
                                background: isPaid ? '#22c55e' : '#f59e0b',
                                boxShadow: isPaid ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(245,158,11,0.5)',
                              }} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: isPaid ? '#15803D' : '#92400E' }}>
                                {isPaid ? '정산 완료' : '정산 대기'}
                              </span>
                            </div>
                            <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                              {isPaid ? '✅ 처리비 정산됨' : '처리 완료 후 정산'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 구분선 */}
                <div style={{ height: 8, background: '#E8EAF0' }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
