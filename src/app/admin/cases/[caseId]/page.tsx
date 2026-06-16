import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminServiceRow from './AdminServiceRow'
import DocViewer from './DocViewer'
import CaseStatusBar from './CaseStatusBar'
import AdminChatPanel from './AdminChatPanel'
import PackageActions from './PackageActions'

interface PageProps {
  params: Promise<{ caseId: string }>
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  submitted:  { label: '접수 완료', color: '#2563EB', bg: '#EFF6FF' },
  reviewing:  { label: '서류 확인', color: '#7C3AED', bg: '#F5F3FF' },
  processing: { label: '처리 중',   color: '#D97706', bg: '#FFFBEB' },
  completed:  { label: '처리 완료', color: '#059669', bg: '#ECFDF5' },
  settled:    { label: '정산 완료', color: '#374151', bg: '#F9FAFB' },
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const { caseId } = await params

  // 쿠키 기반 어드민 인증
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') redirect('/admin-login')

  const adminClient = createAdminClient()

  const { data: caseData } = await adminClient
    .from('cases')
    .select(`*, case_services(*, dispatch_logs(*)), delegations(*), case_documents(*)`)
    .eq('id', caseId)
    .single()

  // AI 에이전트가 생성한 초안 조회
  const { data: caseDrafts } = await adminClient
    .from('case_drafts')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (!caseData) notFound()

  const services = caseData.case_services || []
  const doneCount = services.filter((s: any) => s.status === 'done').length
  const progressPct = services.length ? Math.round((doneCount / services.length) * 100) : 0

  const documentsWithUrl = await Promise.all((caseData.case_documents || []).map(async (doc: any) => {
    const { data } = await adminClient.storage.from('case-documents').createSignedUrl(doc.storage_path, 60 * 60)
    return { doc_type: doc.doc_type, file_name: doc.file_name, storage_path: doc.storage_path, public_url: data?.signedUrl || '' }
  }))

  const delegationInfo = caseData.delegations?.[0] || null
  const statusMeta = STATUS_LABEL[caseData.status] || STATUS_LABEL['submitted']

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
      {/* 상단 브레드크럼 + 상태 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/cases" style={{
            textDecoration: 'none', color: '#6b7280', fontSize: 13, fontWeight: 700,
            padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e9ef', background: '#fff',
          }}>← 목록</Link>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
              {caseData.deceased_name}님 — 케이스 상세
            </h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0', fontWeight: 600 }}>
              케이스 ID: {caseId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 100, background: statusMeta.bg, color: statusMeta.color }}>
          {statusMeta.label}
        </span>
      </div>

      {/* 케이스 상태 변경 바 */}
      <CaseStatusBar caseId={caseId} currentStatus={caseData.status} />

      {/* 2컬럼 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* 좌측: 서류 뷰어 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DocViewer
            documents={documentsWithUrl}
            signatureData={delegationInfo?.signature_data}
            delegatorName={delegationInfo?.delegator_name}
            delegatorRelation={delegationInfo?.delegator_relation}
          />

          {/* 고인 인적 사항 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
              👤 고인 인적 사항
            </h3>
            {[
              ['성명', caseData.deceased_name],
              ['생년월일', caseData.deceased_birth || '-'],
              ['사망일', caseData.deceased_death || '-'],
              ['전화번호', caseData.deceased_phone || '정보 없음'],
              ['접수일', new Date(caseData.created_at).toLocaleString('ko-KR')],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* 위임 정보 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
              📋 위임 정보
            </h3>
            {delegationInfo ? (
              <>
                {[
                  ['신청인 (유족)', delegationInfo.delegator_name],
                  ['고인과의 관계', delegationInfo.delegator_relation],
                  ['전자 서명일', new Date(delegationInfo.signed_at).toLocaleString('ko-KR')],
                  ['제출 서류 수', `${caseData.case_documents?.length || 0}개`],
                  ['개별 처리율', `${doneCount}/${services.length}개 (${progressPct}%)`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{value}</span>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>위임 서명 정보가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 우측: 서비스 관리 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 📥 서류 다운로드 */}
          <PackageActions caseId={caseId} deceasedName={caseData.deceased_name} documents={documentsWithUrl} />

          {/* 진행률 요약 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: 0 }}>📊 전체 진행률</h3>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#163272' }}>{progressPct}%</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#10B981' : '#163272', borderRadius: 100, transition: 'width .6s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{doneCount}개 완료 / 전체 {services.length}개</p>
          </div>

          {/* 개별 서비스 처리 관리 — 카드형 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e9ef', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: 0 }}>⚙️ 개별 서비스 처리 관리</h3>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>저장 시 유저에게 채팅 알림 전송</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {services.length > 0 ? (
                services.map((s: any) => <AdminServiceRow key={s.id} service={s} caseId={caseId} />)
              ) : (
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>서비스 없음</p>
              )}
            </div>
          </div>

          {/* 케이스 메모 (notes) */}
          {caseData.notes && (
            <div style={{ background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', padding: '16px 18px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#92400E', margin: '0 0 8px' }}>📝 어드민 메모</h3>
              <p style={{ fontSize: 13, color: '#78350F', margin: 0, lineHeight: 1.6 }}>{caseData.notes}</p>
            </div>
          )}

          {/* 1:1 채팅 관리 패널 */}
          <AdminChatPanel userId={caseData.user_id} deceasedName={caseData.deceased_name} />
        </div>
      </div>

      {/* ── AI 에이전트 결과물 섹션 ── */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>🤖 AI 에이전트 처리 결과</h2>
          {/* 에이전트 상태 배지 */}
          {(() => {
            const agentStatus = (caseData as any).agent_status || 'pending'
            const statusMap: Record<string, { label: string; bg: string; color: string }> = {
              pending:   { label: '대기 중',    bg: '#F3F4F6', color: '#6B7280' },
              running:   { label: '실행 중 🔄', bg: '#EFF6FF', color: '#2563EB' },
              completed: { label: '완료 ✅',    bg: '#ECFDF5', color: '#059669' },
              failed:    { label: '실패 ❌',    bg: '#FEF2F2', color: '#DC2626' },
            }
            const meta = statusMap[agentStatus] || statusMap.pending
            return (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
            )
          })()}
          {(caseData as any).agent_completed_at && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              완료: {new Date((caseData as any).agent_completed_at).toLocaleString('ko-KR')}
            </span>
          )}
        </div>

        {/* 에이전트 상태가 pending이면 수동 실행 버튼 안내 */}
        {(caseData as any).agent_status === 'pending' && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>AI 에이전트가 아직 실행되지 않았습니다</p>
              <p style={{ fontSize: 13, color: '#78350F', margin: 0 }}>신청 완료 시 자동 시작됩니다. 수동으로 실행하려면 아래 버튼을 사용하세요.</p>
            </div>
          </div>
        )}

        {/* 의뢰인 안내 메시지 */}
        {(caseData as any).agent_summary && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', margin: '0 0 10px' }}>📨 의뢰인 안내 메시지 (AI 작성)</h3>
            <p style={{ fontSize: 14, color: '#1E3A8A', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {(caseData as any).agent_summary}
            </p>
          </div>
        )}

        {/* AI 생성 초안 목록 */}
        {caseDrafts && caseDrafts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {caseDrafts.map((draft: any) => {
              const platformIcon: Record<string, string> = {
                facebook: '📘', instagram: '📸', kakaotalk: '💛', google: '🔵', twitter: '🐦'
              }
              const content = draft.content || {}
              return (
                <div key={draft.id} style={{ background: '#fff', border: '1px solid #E5E9EF', borderRadius: 12, overflow: 'hidden' }}>
                  {/* 헤더 */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB' }}>
                    <span style={{ fontSize: 20 }}>{platformIcon[draft.platform] || '📄'}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>
                        {draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)} 초안
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                        {draft.draft_type} · {new Date(draft.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    {draft.is_sent && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px', borderRadius: 100, background: '#ECFDF5', color: '#059669', fontWeight: 700 }}>발송완료</span>
                    )}
                  </div>

                  {/* 내용 */}
                  <div style={{ padding: '14px 18px', fontSize: 13, lineHeight: 1.7 }}>
                    {content.form_fields && Object.keys(content.form_fields).length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 8px', letterSpacing: '0.05em' }}>양식 필드</p>
                        {Object.entries(content.form_fields).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                            <span style={{ color: '#6B7280', minWidth: 100, flexShrink: 0 }}>{k}</span>
                            <span style={{ color: '#111', fontWeight: 600 }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {content.email_draft && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 8px', letterSpacing: '0.05em' }}>이메일 초안</p>
                        <pre style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', margin: 0, background: '#F9FAFB', padding: '10px 12px', borderRadius: 8 }}>
                          {content.email_draft}
                        </pre>
                      </div>
                    )}
                    {content.letter_draft && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 8px', letterSpacing: '0.05em' }}>요청서 초안</p>
                        <pre style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', margin: 0, background: '#F9FAFB', padding: '10px 12px', borderRadius: 8 }}>
                          {content.letter_draft}
                        </pre>
                      </div>
                    )}
                    {content.submission_url && (
                      <a href={content.submission_url} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#2563EB', fontWeight: 700 }}>
                        🔗 신청 URL 바로가기 →
                      </a>
                    )}
                    {content.warnings && content.warnings.length > 0 && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                        {content.warnings.map((w: string, i: number) => (
                          <p key={i} style={{ fontSize: 12, color: '#92400E', margin: i === 0 ? 0 : '4px 0 0' }}>⚠️ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (caseData as any).agent_status === 'completed' ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>초안이 없습니다 (서비스 미선택)</p>
        ) : null}
      </div>
    </div>
  )
}
