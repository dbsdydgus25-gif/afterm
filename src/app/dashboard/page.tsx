import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// 상태 라벨 & 색상 매핑
const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  draft:      { label: '작성 중',   badge: 'badge-pending' },
  submitted:  { label: '접수 완료', badge: 'badge-dispatched' },
  processing: { label: '처리 중',   badge: 'badge-received' },
  completed:  { label: '완료',      badge: 'badge-done' },
  cancelled:  { label: '취소',      badge: 'badge-failed' },
}

// 대시보드 - 내 신청건 목록
export default async function DashboardPage() {
  const supabase = await createClient()

  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 내 신청건 + 서비스 목록 조회
  const { data: cases } = await supabase
    .from('cases')
    .select(`
      id, status, deceased_name, deceased_death, created_at,
      case_services(id, service_name, service_category, status, icon:service_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const hasCases = cases && cases.length > 0

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
        padding: '0 20px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span className="logo">after<span>m</span></span>
        <LogoutButton />
      </div>

      {/* 본문 */}
      <div style={{ padding: '24px 20px' }}>
        {/* 환영 메시지 */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            내 신청 현황
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
            {hasCases ? `총 ${cases!.length}건의 신청이 있습니다` : '아직 신청 내역이 없습니다'}
          </p>
        </div>

        {/* 신청하기 버튼 */}
        <Link href="/apply" className="btn btn-primary" style={{
          display: 'flex', marginBottom: '28px',
        }}>
          + 새 신청 시작하기
        </Link>

        {/* 신청 목록 */}
        {!hasCases ? (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: 'var(--color-surface)', borderRadius: '16px',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              신청 내역이 없습니다
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
              고인의 디지털 구독 해지를 신청해 보세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cases!.map((c: any) => {
              const statusInfo = STATUS_MAP[c.status] || { label: c.status, badge: 'badge-pending' }
              const services = c.case_services || []
              const doneCount = services.filter((s: any) => s.status === 'done').length

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/${c.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                          고인: {c.deceased_name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                          사망일: {c.deceased_death} · 신청: {new Date(c.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                    </div>

                    {/* 서비스 진행률 */}
                    {services.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '6px' }}>
                          <span>처리 현황</span>
                          <span>{doneCount} / {services.length}개 완료</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--color-bg)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '100px', background: 'var(--color-accent)',
                            width: `${services.length > 0 ? (doneCount / services.length) * 100 : 0}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                          {services.slice(0, 5).map((s: any) => (
                            <span key={s.id} style={{
                              padding: '3px 8px', borderRadius: '100px',
                              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                              fontSize: '11px', fontWeight: 600, color: 'var(--color-text-2)',
                            }}>{s.service_name}</span>
                          ))}
                          {services.length > 5 && (
                            <span style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--color-text-3)' }}>
                              +{services.length - 5}개 더
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '13px', color: 'var(--color-accent)', fontWeight: 600 }}>
                      상세 보기 →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// 로그아웃 버튼 (클라이언트 컴포넌트)
function LogoutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button type="submit" style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '14px', color: 'var(--color-text-3)', fontFamily: 'var(--font-base)',
        fontWeight: 600,
      }}>
        로그아웃
      </button>
    </form>
  )
}
