import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// 상태 라벨 정의
const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: '작성 중',   color: '#6B7280', bg: '#F3F4F6' },
  submitted:  { label: '접수 완료', color: '#2563EB', bg: '#EFF6FF' },
  processing: { label: '처리 중',   color: '#7C3AED', bg: '#F5F3FF' },
  completed:  { label: '완료됨',    color: '#059669', bg: '#ECFDF5' },
  cancelled:  { label: '취소됨',    color: '#DC2626', bg: '#FEF2F2' },
}

export default async function AdminPage() {
  const adminClient = createAdminClient()

  // 관리자 쿠키 확인
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && adminSession?.value !== 'authorized') {
    redirect('/admin/login')
  }

  // 전체 통계 쿼리
  const [
    { count: totalCases },
    { count: submittedCases },
    { count: processingCases },
    { count: completedCases },
    { count: totalServices },
    { count: doneServices },
    { data: recentCases },
    { data: serviceStats },
  ] = await Promise.all([
    adminClient.from('cases').select('*', { count: 'exact', head: true }),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    adminClient.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    adminClient.from('case_services').select('*', { count: 'exact', head: true }),
    adminClient.from('case_services').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    adminClient.from('cases')
      .select(`id, deceased_name, deceased_death, status, created_at, case_services(id, status)`)
      .order('created_at', { ascending: false })
      .limit(20),
    adminClient.from('case_services')
      .select('service_name, service_category, status')
      .order('created_at', { ascending: false }),
  ])

  // 서비스 카테고리별 통계
  const categoryStats = (serviceStats || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.service_category] = (acc[s.service_category] || 0) + 1
    return acc
  }, {})

  // 서비스명별 인기 순위
  const serviceNameStats = (serviceStats || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.service_name] = (acc[s.service_name] || 0) + 1
    return acc
  }, {})
  const topServices = Object.entries(serviceNameStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  const completionRate = totalServices ? Math.round(((doneServices || 0) / totalServices) * 100) : 0

  return (
    <div className="admin-layout" style={{ width: '100vw' }}>
      {/* ── 사이드바 ── */}
      <aside className="admin-sidebar" style={{
        position: 'sticky', top: 0, height: '100vh',
        justifyContent: 'space-between', boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ padding: '8px 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}>
              after<span style={{ color: '#0066ff' }}>m</span>
            </span>
            <div style={{
              display: 'inline-block', background: 'rgba(0,102,255,0.15)', color: '#3385ff',
              fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
              marginLeft: '8px', verticalAlign: 'middle', letterSpacing: '0.05em'
            }}>CONSOLE</div>
          </div>

          <nav style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Link href="/admin" style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '14px 24px', textDecoration: 'none',
              color: '#fff', background: 'rgba(0,102,255,0.15)',
              fontSize: '14px', fontWeight: 700,
              borderLeft: '4px solid #0066ff'
            }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span>대시보드 홈</span>
            </Link>

            <Link href="/admin/cases" style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '14px 24px', textDecoration: 'none',
              color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 600,
              borderLeft: '4px solid transparent', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <span>신청 관리 목록</span>
            </Link>
          </nav>
        </div>

        <div style={{
          padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>접속 계정</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              관리자
            </div>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
            }}>
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <main className="admin-content" style={{ boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-label-strong)', margin: 0 }}>
              종합 운영 현황
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-label-alternative)', marginTop: '6px', margin: 0 }}>
              실시간 디지털 유산 해지 대행 현황을 모니터링합니다.
            </p>
          </div>
          <div style={{
            background: 'var(--color-common-100)', padding: '10px 18px', borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-line-normal-normal)',
            fontSize: '14px', fontWeight: 600, color: 'var(--color-label-neutral)'
          }}>
            📅 {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </div>

        {/* ── 핵심 지표 그리드 (그라데이션 & 마이크로 호버) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: '누적 대행 신청', value: totalCases || 0, desc: '전체 유족 신청 건수', color: '#0066ff', bg: 'linear-gradient(135deg, #EBF3FF 0%, #D8E7FF 100%)' },
            { label: '접수 완료 (대기)', value: submittedCases || 0, desc: '서류 검토 필요', color: '#D97706', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' },
            { label: '행정 처리 중', value: processingCases || 0, desc: '요청 발송 완료', color: '#7C3AED', bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)' },
            { label: '완료된 케이스', value: completedCases || 0, desc: '해지 처리 최종 완료', color: '#059669', bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' },
          ].map(stat => (
            <div key={stat.label} className="stat-card" style={{
              background: stat.bg, border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: '140px', padding: '24px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ zIndex: 2 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>{stat.label}</div>
                <div className="stat-number" style={{ color: stat.color, fontSize: '38px', marginTop: '12px' }}>{stat.value}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-label-alternative)', marginTop: '8px', zIndex: 2, fontWeight: 500 }}>
                {stat.desc}
              </div>
              <div style={{
                position: 'absolute', right: '-10px', bottom: '-15px', fontSize: '72px', opacity: 0.1, pointerEvents: 'none'
              }}>📋</div>
            </div>
          ))}
        </div>

        {/* ── 실무 분석 그래프 및 카테고리 분포 그리드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* 전체 처리 현황 */}
          <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-label-strong)', margin: '0 0 8px' }}>
                서비스 해지 완료율
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-label-alternative)', margin: '0 0 24px' }}>
                개별 기업 요청서 기준 누적 완료 처리 현황
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '16px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--color-primary-normal)', letterSpacing: '-0.02em' }}>
                  {completionRate}%
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-label-alternative)', marginTop: '4px' }}>누적 완료율</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '12px', background: 'var(--color-coolNeutral-96)', borderRadius: '100px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${completionRate}%`, background: 'var(--color-primary-normal)', borderRadius: '100px', transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-label-neutral)', fontWeight: 600 }}>
                  <span>완료: {doneServices || 0}개</span>
                  <span>전체 요청: {totalServices || 0}개</span>
                </div>
              </div>
            </div>
          </div>

          {/* 카테고리 분포 */}
          <div className="stat-card">
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-label-strong)', margin: '0 0 8px' }}>
              카테고리별 대행 청구 분포
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-label-alternative)', margin: '0 0 20px' }}>
              신청 건에서 유족들이 해지 요청한 분야별 비중
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(categoryStats).length > 0 ? (
                Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([cat, count]) => {
                    const pct = totalServices ? Math.round((count / totalServices) * 100) : 0
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-label-neutral)', width: '90px' }}>{cat}</span>
                        <div style={{ flex: 1, height: '6px', background: 'var(--color-coolNeutral-96)', borderRadius: '100px', overflow: 'hidden', margin: '0 16px' }}>
                          <div style={{ height: '100%', background: 'var(--color-label-neutral)', width: `${pct}%`, borderRadius: '100px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-label-strong)', minWidth: '45px', textAlign: 'right' }}>
                          {count}건 ({pct}%)
                        </span>
                      </div>
                    )
                  })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-label-alternative)', fontSize: '13px' }}>
                  등록된 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 인기 대행 서비스 TOP 10 그리드 ── */}
        <div className="stat-card" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-label-strong)', margin: '0 0 6px' }}>
            해지 대행 신청 순위 TOP 10
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-label-alternative)', margin: '0 0 20px' }}>
            가장 빈번하게 해지가 요청되는 인기 기업 순위
          </p>
          {topServices.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {topServices.map(([name, count], i) => (
                <div key={name} style={{
                  padding: '16px', background: 'var(--color-coolNeutral-99)', borderRadius: '12px',
                  border: '1px solid var(--color-line-normal-alternative)', display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary-normal)', letterSpacing: '0.05em' }}>
                    RANK {i + 1}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-label-strong)' }}>{name}</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-label-neutral)', marginTop: '4px' }}>
                    {count} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-label-alternative)' }}>건</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-label-alternative)', fontSize: '14px' }}>
              수집된 서비스 통계가 없습니다.
            </div>
          )}
        </div>

        {/* ── 최근 대행 신청 목록 테이블 ── */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-label-strong)', margin: 0 }}>
                최근 신청 건 요약 (최대 20건)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-label-alternative)', marginTop: '4px', margin: 0 }}>
                가장 최근 접수된 서류와 해지 요청 목록입니다.
              </p>
            </div>
            <Link href="/admin/cases" style={{
              fontSize: '13px', color: 'var(--color-primary-normal)', fontWeight: 700, textDecoration: 'none',
              padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--color-primary-normal)', transition: 'all 0.2s'
            }}>
              전체 목록 보기 →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-line-solid-normal)' }}>
                  {['고인 성명', '사망일', '대행 신청일', '해지 요청 서비스', '전체 진행도', '단계 상태', '작업'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCases && recentCases.length > 0 ? (
                  recentCases.map((c: any) => {
                    const statusInfo = STATUS_LABEL[c.status] || { label: c.status, color: '#999', bg: '#f3f4f6' }
                    const services = c.case_services || []
                    const done = services.filter((s: any) => s.status === 'done').length
                    const pct = services.length ? Math.round((done / services.length) * 100) : 0

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--color-line-normal-alternative)', transition: 'background 0.2s' }}
                          className="hover-row">
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-label-strong)' }}>
                          {c.deceased_name}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-label-neutral)' }}>
                          {c.deceased_death}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-label-neutral)' }}>
                          {new Date(c.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-label-strong)' }}>
                          {services.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {services.slice(0, 3).map((s: any) => (
                                <span key={s.id} style={{
                                  padding: '2px 8px', borderRadius: '4px', background: 'var(--color-coolNeutral-96)',
                                  fontSize: '11px', fontWeight: 600, color: 'var(--color-label-neutral)'
                                }}>{s.service_name}</span>
                              ))}
                              {services.length > 3 && <span style={{ fontSize: '11px', color: 'var(--color-label-alternative)', fontWeight: 600 }}>외 {services.length - 3}개</span>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-label-assistive)' }}>신청 서비스 없음</span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--color-coolNeutral-96)', borderRadius: '100px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#10B981', width: `${pct}%`, borderRadius: '100px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>{pct}% ({done}/{services.length})</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                            background: statusInfo.bg, color: statusInfo.color
                          }}>{statusInfo.label}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Link href={`/admin/cases/${c.id}`} style={{
                            fontSize: '13px', color: 'var(--color-primary-normal)', fontWeight: 700, textDecoration: 'none'
                          }}>
                            관리 →
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-label-alternative)', fontSize: '14px' }}>
                      접수된 신청 건이 존재하지 않습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
