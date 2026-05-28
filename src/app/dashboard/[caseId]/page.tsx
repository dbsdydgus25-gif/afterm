import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STATUS_STEPS = [
  { key: 'submitted',  label: '신청 접수', desc: '에프텀이 신청을 접수했습니다' },
  { key: 'processing', label: '서류 검토', desc: '업로드된 서류를 검토하고 있습니다' },
  { key: 'dispatching',label: '요청서 발송', desc: '각 기업에 해지 요청서를 발송했습니다' },
  { key: 'completed',  label: '처리 완료', desc: '모든 서비스 처리가 완료되었습니다' },
]

const SERVICE_STATUS_MAP: Record<string, { label: string; badge: string; icon: string }> = {
  pending:    { label: '대기 중',   badge: 'badge-pending',    icon: '⏳' },
  dispatched: { label: '발송 완료', badge: 'badge-dispatched', icon: '📨' },
  received:   { label: '기업 접수', badge: 'badge-received',   icon: '📥' },
  done:       { label: '처리 완료', badge: 'badge-done',       icon: '✅' },
  failed:     { label: '처리 실패', badge: 'badge-failed',     icon: '❌' },
}

// 신청건 상세 - 진행상태 트래킹
export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 신청건 + 서비스 목록 + 발송 이력 조회
  const { data: caseData } = await supabase
    .from('cases')
    .select(`
      *,
      case_services(*, dispatch_logs(*)),
      delegations(delegator_name, delegator_relation, signed_at)
    `)
    .eq('id', caseId)
    .eq('user_id', user.id)
    .single()

  if (!caseData) notFound()

  const services = caseData.case_services || []
  const doneCount = services.filter((s: any) => s.status === 'done').length
  const progress = services.length > 0 ? Math.round((doneCount / services.length) * 100) : 0

  // 전체 진행 단계 계산
  const currentStatusIndex = ['submitted','processing','dispatching','completed']
    .indexOf(caseData.status === 'submitted' ? 'submitted' :
             caseData.status === 'processing' ? 'processing' :
             caseData.status === 'completed' ? 'completed' : 'dispatching')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
        padding: '0 20px', height: '56px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-2)', textDecoration: 'none', fontSize: '14px' }}>
          ← 목록
        </Link>
        <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>진행 현황</span>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 고인 정보 카드 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              {caseData.deceased_name}
            </h2>
            <span className={`badge ${caseData.status === 'completed' ? 'badge-done' : caseData.status === 'processing' ? 'badge-received' : 'badge-dispatched'}`}>
              {caseData.status === 'completed' ? '처리 완료' : caseData.status === 'processing' ? '처리 중' : '접수 완료'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-3)', fontWeight: 600, marginBottom: '2px' }}>생년월일</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{caseData.deceased_birth}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-3)', fontWeight: 600, marginBottom: '2px' }}>사망일</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{caseData.deceased_death}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-3)', fontWeight: 600, marginBottom: '2px' }}>신청일</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{new Date(caseData.created_at).toLocaleDateString('ko-KR')}</div>
            </div>
          </div>
        </div>

        {/* 전체 진행률 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>전체 처리 진행률</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-accent)' }}>{progress}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--color-bg)', borderRadius: '100px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{
              height: '100%', borderRadius: '100px', background: 'var(--color-accent)',
              width: `${progress}%`, transition: 'width 0.5s',
            }} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
            {services.length}개 중 {doneCount}개 완료
          </p>
        </div>

        {/* 처리 단계 타임라인 */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-3)', marginBottom: '20px', letterSpacing: '0.02em' }}>
            처리 단계
          </h3>
          <div className="status-timeline">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < currentStatusIndex
              const isActive = i === currentStatusIndex
              return (
                <div key={step.key} className={`status-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="status-dot" style={{ color: '#fff', fontSize: '12px' }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', letterSpacing: '-0.01em' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{step.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 서비스별 상태 */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            서비스별 처리 현황
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {services.map((s: any) => {
              const statusInfo = SERVICE_STATUS_MAP[s.status] || SERVICE_STATUS_MAP.pending
              return (
                <div key={s.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{statusInfo.icon}</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>{s.service_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '2px' }}>
                        {s.service_category}
                        {s.dispatched_at && ` · 발송: ${new Date(s.dispatched_at).toLocaleDateString('ko-KR')}`}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 도움말 */}
        <div className="alert-banner alert-info">
          <span>💬</span>
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
            추가 서류가 필요한 경우 카카오 알림톡 또는 이메일로 안내드립니다.
            문의: <strong>afterm001@gmail.com</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
