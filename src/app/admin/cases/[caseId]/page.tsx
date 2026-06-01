import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminServiceRow from './AdminServiceRow'
import DocViewer from './DocViewer'

interface PageProps {
  params: Promise<{ caseId: string }>
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const { caseId } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  const isDev = process.env.NODE_ENV === 'development'
  const isAuthorized = isDev || (user.email && adminEmails.includes(user.email))
  if (!isAuthorized) redirect('/')

  // 신청 건 상세 정보 및 연관 데이터 조회
  const { data: caseData } = await adminClient
    .from('cases')
    .select(`*, case_services(*, dispatch_logs(*)), delegations(*), case_documents(*)`)
    .eq('id', caseId)
    .single()

  if (!caseData) notFound()

  const services = caseData.case_services || []
  const doneCount = services.filter((s: any) => s.status === 'done').length

  // 제출 서류들의 Public URL 생성
  const documentsWithUrl = (caseData.case_documents || []).map((doc: any) => {
    const { data } = adminClient.storage.from('case-documents').getPublicUrl(doc.storage_path)
    return {
      doc_type: doc.doc_type,
      file_name: doc.file_name,
      storage_path: doc.storage_path,
      public_url: data.publicUrl,
    }
  })

  const delegationInfo = caseData.delegations?.[0] || null

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
              color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 600,
              borderLeft: '4px solid transparent', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span>대시보드 홈</span>
            </Link>

            <Link href="/admin/cases" style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '14px 24px', textDecoration: 'none',
              color: '#fff', background: 'rgba(0,102,255,0.15)',
              fontSize: '14px', fontWeight: 700,
              borderLeft: '4px solid #0066ff'
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
              {user.email}
            </div>
          </div>
          <form action="/auth/signout" method="POST">
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
        
        {/* 상단 네비게이션 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/admin/cases" style={{
              textDecoration: 'none', color: 'var(--color-label-alternative)',
              fontSize: '14px', fontWeight: 700, padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--color-line-solid-normal)', background: '#fff', transition: 'all 0.2s'
            }}>
              ← 목록으로
            </Link>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-label-strong)', margin: 0 }}>
              신청 건 상세 행정 제어
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-label-alternative)', fontWeight: 600 }}>상태제어 코드: {caseId}</span>
            <span style={{
              padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 800,
              background: caseData.status === 'completed' ? '#ECFDF5' : '#EFF6FF',
              color: caseData.status === 'completed' ? '#059669' : '#2563EB',
            }}>
              {caseData.status === 'completed' ? '처리 최종 완료' : caseData.status === 'processing' ? '대행 처리 중' : '접수 완료'}
            </span>
          </div>
        </div>

        {/* ── PC 전용 2컬럼 레이아웃 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* 좌측 컬럼: 이미지/위임장 검토 뷰어 */}
          <DocViewer
            documents={documentsWithUrl}
            signatureData={delegationInfo?.signature_data}
            delegatorName={delegationInfo?.delegator_name}
            delegatorRelation={delegationInfo?.delegator_relation}
          />

          {/* 우측 컬럼: 신청 정보 요약 & 개별 서비스 관리 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 정보 카드 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* 고인 인적 사항 */}
              <div className="stat-card">
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-label-neutral)', marginBottom: '16px', borderBottom: '1px solid var(--color-line-normal-normal)', paddingBottom: '10px' }}>
                  고인 인적 사항
                </h3>
                {[
                  ['성명', caseData.deceased_name],
                  ['생년월일', caseData.deceased_birth],
                  ['사망일', caseData.deceased_death],
                  ['전화번호', caseData.deceased_phone || '정보 없음'],
                  ['대행 접수일', new Date(caseData.created_at).toLocaleString('ko-KR')],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-line-normal-alternative)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-label-alternative)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-label-strong)' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* 신청인 및 위임 사한 */}
              <div className="stat-card">
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-label-neutral)', marginBottom: '16px', borderBottom: '1px solid var(--color-line-normal-normal)', paddingBottom: '10px' }}>
                  위임 정보 요약
                </h3>
                {delegationInfo ? (
                  <>
                    {[
                      ['신청인 (유족)', delegationInfo.delegator_name],
                      ['고인과의 관계', delegationInfo.delegator_relation],
                      ['전자 서명일', new Date(delegationInfo.signed_at).toLocaleString('ko-KR')],
                      ['제출 서류 수', `${caseData.case_documents?.length || 0}개`],
                      ['개별 처리율', `${doneCount}개 완료 / 총 ${services.length}개 (${services.length ? Math.round((doneCount / services.length) * 100) : 0}%)`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-line-normal-alternative)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-label-alternative)' }}>{label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-label-strong)' }}>{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-label-alternative)', fontSize: '13px' }}>
                    위임 서명이 아직 입력되지 않은 신청 건입니다.
                  </div>
                )}
              </div>

            </div>

            {/* 개별 서비스 상태 및 행정 통제 테이블 */}
            <div className="stat-card" style={{ padding: '20px 0 0' }}>
              <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--color-line-normal-normal)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-label-strong)', margin: 0 }}>
                  개별 해지 대행 진행 통제
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-line-solid-normal)', background: 'var(--color-coolNeutral-99)' }}>
                      {['서비스사', '분야', '계정 ID', '요청 수신처', '현재 상태', '행정 상태 변경', '작업 메모'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-label-neutral)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.length > 0 ? (
                      services.map((s: any) => (
                        <AdminServiceRow key={s.id} service={s} caseId={caseId} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-label-alternative)', fontSize: '14px' }}>
                          해지 요청된 서비스가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  )
}
