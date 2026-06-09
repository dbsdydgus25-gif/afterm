import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

// POST /api/agents/draft
// 모든 서류가 완비된 후 플랫폼별 초안을 생성하는 에이전트입니다.
export async function POST(req: NextRequest) {
  try {
    const { caseId } = await req.json()
    if (!caseId) return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })

    const adminClient = createAdminClient()

    // 1. 케이스 및 필수 정보 조회
    const { data: caseData, error } = await adminClient
      .from('cases')
      .select('*, case_services(*), delegations(*)')
      .eq('id', caseId)
      .single()

    if (error || !caseData) throw new Error('Case not found')

    const services = caseData.case_services || []
    if (services.length === 0) return NextResponse.json({ message: 'No services to draft' })

    // 2. 실행 로그 시작
    const { data: logEntry } = await adminClient.from('agent_logs').insert({
      case_id: caseId,
      agent_name: 'draft_agent',
      status: 'running'
    }).select('id').single()
    const logId = logEntry?.id

    // 3. Gemini 1.5 Pro 세팅 (작문 로직이므로 Pro 사용)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY missing')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: { responseMimeType: 'application/json' }
    })

    const deceasedName = caseData.deceased_name
    const deceasedBirth = caseData.deceased_birth || '미기재'
    const deceasedDeath = caseData.deceased_death || '미기재'
    const deceasedPhone = caseData.deceased_phone || '미기재'
    const delegatorName = caseData.delegations?.[0]?.delegator_name || '신청인'
    const delegatorRelation = caseData.delegations?.[0]?.delegator_relation || '유족'

    const results = []

    // 4. 서비스별 초안 생성 루프
    for (const svc of services) {
      const platform = svc.service_name?.toLowerCase() || ''
      const action = svc.dispatch_type === 'memorialize' ? '추모 계정 전환' : '계정 삭제'
      const accountId = svc.contact_info || svc.account_id || '알 수 없음'

      const prompt = `
당신은 디지털 유산 행정 대행 서비스의 "신청서 초안 작성 에이전트"입니다.
주어진 고인 및 신청인 정보를 바탕으로, 해당 플랫폼(${platform})에 제출할 완벽한 텍스트 폼 데이터를 작성하세요.

[입력 정보]
- 플랫폼: ${platform}
- 요청 작업: ${action}
- 유저가 입력한 추가 계정 정보: ${accountId}
- 고인 성명: ${deceasedName}
- 고인 생년월일: ${deceasedBirth}
- 고인 사망일: ${deceasedDeath}
- 고인 전화번호: ${deceasedPhone}
- 신청인 성명: ${delegatorName}
- 고인과의 관계: ${delegatorRelation}

[출력 규칙 - 무조건 아래 JSON 스키마를 따를 것]
{
  "submit_url": "이 플랫폼의 고객센터 양식 제출 URL (모르면 null)",
  "form_fields": {
    "키": "양식에 붙여넣을 값" (예: "Deceased's full name": "홍길동")
  },
  "email_body": "이메일이나 1:1 문의로 직접 글을 써야 하는 경우 본문 (없으면 null)",
  "notes": "어드민이 복붙할 때 주의할 점"
}

[가이드]
- Facebook, Instagram: 주로 form_fields에 영어 항목으로 작성.
- KakaoTalk: 1:1 문의 게시판 양식이므로 email_body에 한글로 정중한 편지 형식 작성.
- Google, Twitter: 계정 삭제를 위한 영문 이메일이나 폼 텍스트 작성.
`

      try {
        const aiRes = await model.generateContent(prompt)
        const draftContent = JSON.parse(aiRes.response.text())

        // DB (case_drafts) 에 저장
        await adminClient.from('case_drafts').insert({
          case_id: caseId,
          platform: platform,
          draft_type: draftContent.email_body ? 'email_body' : 'form_fields',
          content: draftContent
        })

        results.push({ platform, status: 'success' })
      } catch (err: any) {
        console.error(`Draft Error for ${platform}:`, err)
        results.push({ platform, status: 'failed', error: err.message })
      }
    }

    // 5. 완료 후 로그 및 상태 업데이트
    if (logId) {
      await adminClient.from('agent_logs').update({
        status: 'success',
        result: results,
        completed_at: new Date().toISOString()
      }).eq('id', logId)
    }

    // 케이스 상태를 처리중(processing) 또는 패키지 완료로 변경
    await adminClient.from('cases').update({ status: 'reviewing' }).eq('id', caseId)

    // 6. 어드민에게 패키지 준비 완료 알림 전송
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/cases/${caseId}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'package_ready' })
    }).catch(e => console.error('Notify error:', e))

    return NextResponse.json({ success: true, results })

  } catch (err: any) {
    console.error('[Draft Agent] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
