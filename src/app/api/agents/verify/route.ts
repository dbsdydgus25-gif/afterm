import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractTextFromImage } from '@/lib/clova-ocr'
import { GoogleGenerativeAI, Schema, Type } from '@google/generative-ai'

// POST /api/agents/verify
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. 서류 및 케이스 정보 조회
    const { data: doc, error: docError } = await adminClient
      .from('case_documents')
      .select('*, cases(id, deceased_name, delegations(delegator_name))')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 2. 실행 로그 (agent_logs) 시작 기록
    const { data: logEntry } = await adminClient
      .from('agent_logs')
      .insert({
        case_id: doc.case_id,
        agent_name: 'doc_verify',
        status: 'running'
      })
      .select('id')
      .single()

    const logId = logEntry?.id
    const deceasedName = doc.cases?.deceased_name || '고인'
    const delegatorName = doc.cases?.delegations?.[0]?.delegator_name || '신청인'

    // 3. 파일 다운로드 및 Public URL 발급 (1시간)
    const { data: signedUrlData } = await adminClient.storage
      .from('case-documents')
      .createSignedUrl(doc.storage_path, 60 * 60)

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to create signed URL')
    }

    const fileExt = doc.file_name?.split('.').pop() || 'jpg'

    // 4. CLOVA OCR 호출 (텍스트 추출)
    const ocrResult = await extractTextFromImage(signedUrlData.signedUrl, fileExt)
    if (!ocrResult.success || !ocrResult.text) {
      await updateLog(logId, 'failed', null, `OCR 실패: ${ocrResult.error}`)
      return NextResponse.json({ error: 'OCR failed' }, { status: 500 })
    }

    // 5. Gemini API 호출 (논리 검증)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY missing')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // 가볍고 빠른 모델 사용
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_valid: { type: Type.BOOLEAN, description: '서류가 유효하고 적합한지 여부' },
            doc_type: { type: Type.STRING, description: '실제 문서 종류 (예: 사망진단서, 가족관계증명서, 주민등록증 등)' },
            name_match: { type: Type.BOOLEAN, description: '고인 이름 또는 신청인 이름이 포함되어 있는지 여부' },
            rejection_reason: { type: Type.STRING, description: 'is_valid가 false인 경우의 구체적이고 친절한 거절/반려 사유 (한국어). 통과면 null' }
          },
          required: ['is_valid', 'doc_type', 'name_match']
        }
      }
    })

    const prompt = `
당신은 한국 행정 문서 검증 전문가(AI 에이전트)입니다.
아래는 네이버 CLOVA OCR을 통해 추출된 문서의 텍스트입니다.
이 텍스트를 바탕으로 제출된 서류가 올바른지 논리적으로 판단하세요.

[케이스 정보]
- 고인 성명: ${deceasedName}
- 신청인 성명: ${delegatorName}
- 유저가 선택한 서류 유형: ${doc.doc_type === 'death_cert' ? '사망진단서' : doc.doc_type === 'family_cert' ? '가족관계증명서' : '신분증'}

[OCR 추출 텍스트]
"""
${ocrResult.text}
"""

[검증 가이드라인]
1. 유저가 선택한 서류 유형과 내용이 일치하는가?
2. 문서 내에 고인 성명(${deceasedName}) 또는 신청인 성명(${delegatorName})이 존재하는가?
3. (가족관계증명서의 경우) 발급일이 명시되어 있다면 너무 오래되지 않았는가?
이 사항들을 종합하여 최종 is_valid 값을 도출하세요.
`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const verificationData = JSON.parse(responseText)

    // 6. DB 업데이트 (case_documents)
    const finalStatus = verificationData.is_valid ? 'verified' : 'rejected'
    
    await adminClient
      .from('case_documents')
      .update({
        status: finalStatus,
        verification_result: verificationData,
        rejection_reason: verificationData.is_valid ? null : verificationData.rejection_reason,
        verified_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // 7. Progress Tracker: 모든 서류가 완비되었는지 확인
    const { data: allDocs } = await adminClient
      .from('case_documents')
      .select('status')
      .eq('case_id', doc.case_id)

    const isAllVerified = allDocs && allDocs.length >= 3 && allDocs.every(d => d.status === 'verified')

    if (isAllVerified) {
      // 8. 서류가 모두 통과했으면 Draft Agent(STAGE 5) 자동 트리거
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agents/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: doc.case_id })
      }).catch(e => console.error('[Verify] Draft Trigger Failed:', e))
    }

    // 9. 로그 성공 기록
    await updateLog(logId, 'success', verificationData)

    return NextResponse.json({
      success: true,
      status: finalStatus,
      result: verificationData
    })

  } catch (err: any) {
    console.error('[Verify Agent] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function updateLog(logId: string | undefined, status: string, result: any = null, errorMessage: string | null = null) {
  if (!logId) return
  const adminClient = createAdminClient()
  await adminClient.from('agent_logs').update({
    status,
    result,
    error_message: errorMessage,
    completed_at: new Date().toISOString()
  }).eq('id', logId)
}
