import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'

// 상태 라벨 & 색상 매핑
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: '작성 중',   color: 'var(--color-coolNeutral-62)', bg: 'var(--color-coolNeutral-92)' },
  submitted:  { label: '접수 완료', color: 'var(--color-yellow-55)', bg: 'var(--color-yellow-90)' },
  processing: { label: '처리 중',   color: 'var(--color-blue-55)', bg: 'var(--color-blue-90)' },
  completed:  { label: '처리 완료', color: 'var(--color-green-45)', bg: 'var(--color-green-90)' },
  cancelled:  { label: '취소됨',    color: 'var(--color-red-50)', bg: 'var(--color-red-90)' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cases } = await supabase
    .from('cases')
    .select(`
      id, status, deceased_name, deceased_death, created_at,
      case_services(id, service_name, service_category, status, icon:service_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeCase = cases && cases.length > 0 ? cases[0] : null
  const pastCases = cases && cases.length > 1 ? cases.slice(1) : []

  return (
    <div className="screen" style={{ background: 'var(--color-background-normal-alternative)' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-background-normal-normal)',
        borderBottom: '1px solid var(--color-line-normal-normal)',
        padding: '0 20px', height: 'var(--nav-h)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo width={90} height={26} />
        <LogoutButton />
      </div>

      <div className="screen-body" style={{ padding: '0 0 40px' }}>
        
        {activeCase ? (
          <>
            <div style={{ padding: '24px 20px 0' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-normal)', letterSpacing: '0.02em' }}>
                진행 중인 신청
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--color-label-strong)', marginTop: '6px', letterSpacing: '-0.02em' }}>
                {activeCase.deceased_name} 님
              </h1>
              <div style={{ fontSize: '14px', color: 'var(--color-label-alternative)', marginTop: '4px' }}>
                {new Date(activeCase.created_at).toLocaleDateString('ko-KR')} 신청 · {activeCase.case_services?.length || 0}건 처리 중
              </div>
            </div>

            <div style={{ padding: '20px 20px 0' }}>
              <HomeProgressCard data={activeCase} />
            </div>

            <div style={{ padding: '40px 20px 0' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '16px' }}>
                새 신청 시작하기
              </h2>
              <Link href="/apply/new" style={{ textDecoration: 'none' }}>
                <div style={{
                  borderRadius: 'var(--radius-20)', background: 'var(--color-label-strong)', color: '#fff',
                  padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.025em', textTransform: 'uppercase' }}>
                      NEW REQUEST
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', letterSpacing: '-0.012em' }}>
                      새 가족분의 정리를 시작해요
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '6px', color: 'rgba(255,255,255,0.7)' }}>
                      무료 · 평균 5~7영업일 처리
                    </div>
                  </div>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-16)',
                    background: 'var(--color-primary-normal)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--color-blue-95)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
              📋
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '8px' }}>
              신청 내역이 없습니다
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', marginBottom: '32px' }}>
              고인의 디지털 구독 해지를 신청해 보세요
            </p>
            <Link href="/apply" style={{ textDecoration: 'none' }}>
              <Button block>새 신청 시작하기</Button>
            </Link>
          </div>
        )}

        {/* ── 앱 온보딩 활용 (안내 섹션) ── */}
        <div style={{ padding: '48px 20px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--color-label-strong)', marginBottom: '16px' }}>
            이용 안내
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>🔒</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-label-strong)', marginBottom: '4px' }}>법적 위임 대행</div>
                <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)' }}>안전하게 각 서비스사로 해지 요청을 보냅니다.</div>
              </div>
            </div>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>🗑️</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-label-strong)', marginBottom: '4px' }}>정보 즉시 파기</div>
                <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)' }}>처리 완료 즉시 제출된 모든 서류는 파기됩니다.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function HomeProgressCard({ data }: { data: any }) {
  const services = data.case_services || []
  const total = services.length
  const completed = services.filter((s: any) => s.status === 'done').length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  // SVG Progress Ring (108px)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        {/* Progress Ring */}
        <div style={{ position: 'relative', width: '108px', height: '108px' }}>
          <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="54" cy="54" r={radius} fill="none" stroke="var(--color-coolNeutral-96)" strokeWidth="9" />
            <circle cx="54" cy="54" r={radius} fill="none" stroke="var(--color-primary-normal)" strokeWidth="9" 
                    strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--color-label-strong)', letterSpacing: '-0.02em' }}>{pct}%</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-label-alternative)' }}>처리 완료</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <RingMini label="처리 완료" value={completed} color="var(--color-green-45)" />
          <RingMini label="진행 중" value={total - completed} color="var(--color-yellow-55)" />
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--color-line-normal-normal)', margin: '20px -20px 16px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-label-alternative)' }}>전체 진행 상태</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-label-strong)', marginTop: '2px' }}>{STATUS_MAP[data.status]?.label || data.status}</div>
        </div>
        <Link href={`/dashboard/${data.id}`} style={{ textDecoration: 'none' }}>
          <Button size="sm" variant="secondary" style={{ height: '40px', padding: '0 16px', fontSize: '14px' }}>
            진행 현황 보기
          </Button>
        </Link>
      </div>
    </div>
  )
}

function RingMini({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '4px', background: color }} />
      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--color-label-neutral)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--color-label-strong)' }}>{value}</span>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button type="submit" style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '14px', color: 'var(--color-label-alternative)', fontFamily: 'var(--font-sans)',
        fontWeight: 600,
      }}>
        로그아웃
      </button>
    </form>
  )
}
