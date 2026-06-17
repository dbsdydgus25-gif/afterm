// ============================================================
// POST /api/agents/trigger
// 케이스 접수 시 AI 에이전트 파이프라인 자동 실행
// 클라이언트에서 fire-and-forget으로 호출됨
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createAdminClient } from '@/lib/supabase/admin'
import { runOrchestrator } from '../../../../../agents/orchestrator'
import type { IntakeFormData } from '../../../../../agents/intake-agent'

export const runtime = 'nodejs'
export const maxDuration = 300 // Vercel Pro: 5분

export async function POST(req: NextRequest) {
  const { caseId } = await req.json()

  if (!caseId) {
    return NextResponse.json({ error: 'caseId 필수' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // ── 케이스 데이터 조회 ──
  const { data: caseData, error } = await adminClient
    .from('cases')
    .select(`
      *,
      case_services(*),
      delegations(*),
      case_documents(*)
    `)
    .eq('id', caseId)
    .single()

  if (error || !caseData) {
    return NextResponse.json({ error: '케이스를 찾을 수 없습니다.' }, { status: 404 })
  }

  // 이미 실행 중이면 중복 방지
  if (caseData.agent_status === 'running' || caseData.agent_status === 'completed') {
    return NextResponse.json({ message: `이미 ${caseData.agent_status} 상태입니다.` })
  }

  // ── Supabase 데이터 → IntakeFormData 변환 ──
  const delegation = caseData.delegations?.[0]
  const services = caseData.case_services || []

  const selectedServices: IntakeFormData['selected_services'] = services.map((svc: any) => {
    const platform = mapServiceIdToPlatform(svc.service_id || svc.service_name)
    const action = svc.service_category === 'memorialize' ? 'memorialize' : 'delete'
    return {
      platform,
      action,
      account_url: svc.contact_info || undefined,
      email: svc.contact_info?.includes('@') ? svc.contact_info : undefined,
      username: svc.account_id || undefined,
      phone: svc.contact_info?.match(/^010/) ? svc.contact_info : undefined,
    }
  }).filter((s: any) => s.platform) // 알 수 없는 플랫폼 제외

  const formData: IntakeFormData = {
    requester_name: delegation?.delegator_name || '신청인',
    requester_relation: delegation?.delegator_relation || '유족',
    requester_email: '',   // profiles에 없으면 공란
    requester_phone: '',
    deceased_name: caseData.deceased_name,
    deceased_birth_date: caseData.deceased_birth || '',
    deceased_death_date: caseData.deceased_death || '',
    selected_services: selectedServices,
    kakaopay_question: services.some((s: any) =>
      (s.service_id || '').toLowerCase().includes('kakao') ||
      (s.service_name || '').includes('카카오')
    ),
  }

  // ── 에이전트 상태를 'running'으로 업데이트 ──
  await adminClient
    .from('cases')
    .update({
      agent_status: 'running',
      agent_started_at: new Date().toISOString(),
    })
    .eq('id', caseId)

  // ── waitUntil: 응답 반환 후에도 에이전트 계속 실행 ──
  waitUntil(
    runPipelineAndSave(caseId, formData, adminClient)
  )

  return NextResponse.json({
    success: true,
    message: 'AI 에이전트 파이프라인 시작됨',
    caseId,
  })
}

// ── 파이프라인 실행 + 결과 저장 ──
async function runPipelineAndSave(
  caseId: string,
  formData: IntakeFormData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  try {
    // 에이전트 실행 (이벤트 콜백으로 로그 저장)
    const result = await runOrchestrator(formData, undefined, async (event) => {
      // agent_logs 테이블에 실시간 기록
      if (event.type === 'stage_complete' || event.type === 'stage_error' || event.type === 'pipeline_complete') {
        await adminClient.from('agent_logs').insert({
          case_id: caseId,
          agent_name: event.agent,
          status: event.type === 'stage_error' ? 'failed' : 'success',
          result: { message: event.message, stage: event.stage, data: event.data },
          completed_at: event.timestamp,
        }).then(() => {}) // 에러 무시
      }
    })

    // ── 초안 결과 case_drafts에 저장 ──
    if (result.case_object?.draft_results) {
      for (const draft of result.case_object.draft_results) {
        await adminClient.from('case_drafts').insert({
          case_id: caseId,
          platform: draft.platform,
          draft_type: draft.email_draft ? 'email_body' : draft.letter_draft ? 'letter' : 'form_fields',
          content: {
            submission_url: draft.submission_url,
            form_fields: draft.form_fields,
            email_draft: draft.email_draft,
            letter_draft: draft.letter_draft,
            attachments: draft.attachments,
            warnings: draft.warnings,
            operator_notes: draft.operator_notes,
          },
        }).then(() => {})
      }
    }

    // ── 최종 결과 cases 테이블에 저장 ──
    await adminClient
      .from('cases')
      .update({
        agent_status: result.success ? 'completed' : 'failed',
        agent_summary: result.final_summary || null,
        agent_checklist: result.case_object ? {
          stage: result.case_object.stage,
          services: result.case_object.services,
          draft_count: result.case_object.draft_results?.length || 0,
        } : null,
        agent_completed_at: new Date().toISOString(),
        status: 'submitted', // 어드민이 직접 확인 후 processing으로 변경
      })
      .eq('id', caseId)

  } catch (err) {
    console.error('[trigger] 파이프라인 오류:', err)
    await adminClient
      .from('cases')
      .update({
        agent_status: 'failed',
        agent_summary: err instanceof Error ? err.message : '알 수 없는 오류',
        agent_completed_at: new Date().toISOString(),
      })
      .eq('id', caseId)
  }
}

// ── service_id → platform 매핑 ──
function mapServiceIdToPlatform(serviceId: string): 'facebook' | 'instagram' | 'kakaotalk' | 'google' | 'twitter' | null {
  const id = serviceId.toLowerCase()
  if (id.includes('facebook') || id.includes('fb')) return 'facebook'
  if (id.includes('instagram') || id.includes('insta')) return 'instagram'
  if (id.includes('kakao')) return 'kakaotalk'
  if (id.includes('google') || id.includes('gmail') || id.includes('youtube')) return 'google'
  if (id.includes('twitter') || id.includes('x.com') || id.includes('naver')) return 'twitter'
  return null
}
