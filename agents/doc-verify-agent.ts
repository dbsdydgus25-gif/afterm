// ============================================================
// STAGE 3 — Document Verification Agent (서류 검증 에이전트)
// 목적: Claude Vision으로 업로드 파일의 유효성을 자동 검증한다
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import type {
  CaseObject,
  RequiredDoc,
  VerificationResult,
  AgentResult,
} from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 파일 → Base64 변환
function fileToBase64(filePath: string): { data: string; mediaType: string } {
  const ext = path.extname(filePath).toLowerCase()
  const mediaTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }
  const mediaType = mediaTypeMap[ext] || 'image/jpeg'
  const data = fs.readFileSync(filePath).toString('base64')
  return { data, mediaType }
}

// 가족관계증명서 발급일 유효성 확인 (3개월 이내)
function isWithin3Months(issueDateStr: string | null): boolean {
  if (!issueDateStr) return false
  const issueDate = new Date(issueDateStr)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return issueDate >= threeMonthsAgo
}

// Claude Vision으로 서류 검증
async function verifyDocumentWithVision(
  filePath: string,
  docType: 'ID' | 'FAMILY' | 'DEATH',
  deceasedName: string,
  requesterName: string
): Promise<VerificationResult> {
  const { data, mediaType } = fileToBase64(filePath)

  const docTypeLabel = {
    ID: '신분증 (주민등록증 또는 운전면허증)',
    FAMILY: '가족관계증명서',
    DEATH: '사망진단서 또는 사체검안서',
  }[docType]

  const isPdf = mediaType === 'application/pdf'

  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: `당신은 한국 행정 문서 검증 전문가입니다.
제출된 서류 이미지를 분석하고 정확하게 JSON으로만 응답합니다.
JSON 외 다른 텍스트는 절대 포함하지 마세요.`,
    messages: [
      {
        role: 'user',
        content: [
          ...(isPdf
            ? [{ type: 'text' as const, text: '[PDF 문서 분석 — 이미지 변환 필요]' }]
            : [
                {
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data,
                  },
                },
              ]),
          {
            type: 'text',
            text: `케이스 정보:
- 고인 성명: ${deceasedName}
- 신청인 성명: ${requesterName}
- 요청 서류 종류: ${docTypeLabel}

아래 항목을 검증하고 JSON으로 응답하세요:
{
  "doc_type": "실제 문서 종류 (사망진단서/가족관계증명서/신분증/기타)",
  "name_match": true/false (고인 또는 신청인 성명 일치 여부),
  "issue_date": "YYYY-MM-DD 또는 null",
  "has_official_seal": true/false (직인 또는 서명 존재),
  "image_quality": "good 또는 poor",
  "is_valid": true/false (최종 유효 여부),
  "rejection_reason": "실패 사유 또는 null"
}`,
          },
        ],
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude Vision 응답을 파싱할 수 없습니다.')
  }

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON 응답 없음')
    const result = JSON.parse(jsonMatch[0]) as VerificationResult

    // 가족관계증명서 추가 검증: 3개월 이내 발급 여부
    if (docType === 'FAMILY' && result.is_valid && result.issue_date) {
      if (!isWithin3Months(result.issue_date)) {
        result.is_valid = false
        result.rejection_reason = `발급일(${result.issue_date})이 3개월을 초과했습니다. 정부24에서 새로 발급해 주세요.`
      }
    }

    return result
  } catch {
    throw new Error(`검증 결과 파싱 실패: ${textBlock.text}`)
  }
}

// 검증 실패 메시지 생성 (Claude)
async function generateRejectionMessage(
  docName: string,
  rejectionReason: string
): Promise<string> {
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 300,
    thinking: { type: 'adaptive' },
    system: `당신은 에프텀(Afterm) 서비스의 AI 어시스턴트입니다.
서류 검증 실패 시 고객에게 친절하고 명확하게 재제출 안내를 작성합니다.
3~4문장으로 간결하게 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `서류명: ${docName}
반려 사유: ${rejectionReason}

재제출 안내 메시지를 작성해주세요.`,
      },
    ],
  })

  const response = await stream.finalMessage()
  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text'
    ? textBlock.text
    : `업로드하신 ${docName}의 검증에 실패했습니다. 사유: ${rejectionReason}. 다시 업로드해 주세요.`
}

// ============================================================
// 메인 — Document Verification Agent 실행
// ============================================================
export async function runDocVerifyAgent(
  caseObj: CaseObject,
  uploadedFile: {
    doc_id: 'ID' | 'FAMILY' | 'DEATH'
    file_path: string
  }
): Promise<AgentResult & { verification?: VerificationResult; rejection_message?: string }> {
  console.log(`\n🔍 [Document Verification Agent] 검증 시작: ${uploadedFile.doc_id}`)

  try {
    // 해당 서류 찾기
    const docRecord = caseObj.required_docs.find(d => d.doc_id === uploadedFile.doc_id)
    if (!docRecord) {
      return {
        success: false,
        agent: 'doc-verify-agent',
        message: `서류 ID ${uploadedFile.doc_id}를 케이스에서 찾을 수 없습니다.`,
        error: 'doc_not_found',
      }
    }

    // 파일 존재 확인
    if (!fs.existsSync(uploadedFile.file_path)) {
      return {
        success: false,
        agent: 'doc-verify-agent',
        message: `파일을 찾을 수 없습니다: ${uploadedFile.file_path}`,
        error: 'file_not_found',
      }
    }

    // 재시도 횟수 증가
    docRecord.upload_count = (docRecord.upload_count || 0) + 1
    docRecord.file_path = uploadedFile.file_path
    docRecord.status = 'uploaded'

    console.log(`   파일: ${uploadedFile.file_path}`)
    console.log(`   시도 횟수: ${docRecord.upload_count}`)

    // 3회 이상 연속 실패 시 운영자 알림 트리거
    if (docRecord.upload_count > 3) {
      console.log('⚠️  3회 이상 재시도 — 운영자 알림 필요')
      return {
        success: false,
        agent: 'doc-verify-agent',
        message: `${docRecord.name} 3회 이상 검증 실패. 운영자 수동 처리가 필요합니다.`,
        error: 'max_retries_exceeded',
      }
    }

    // Claude Vision으로 검증
    console.log('👁️  Claude Vision으로 문서 분석 중...')
    const verificationResult = await verifyDocumentWithVision(
      uploadedFile.file_path,
      uploadedFile.doc_id,
      caseObj.deceased.name,
      caseObj.requester.name
    )

    console.log('   검증 결과:', JSON.stringify(verificationResult, null, 2))

    // 검증 통과
    if (verificationResult.is_valid) {
      docRecord.status = 'verified'
      docRecord.verified_at = new Date().toISOString()
      docRecord.rejection_reason = undefined
      caseObj.updated_at = new Date().toISOString()

      console.log(`✅ [검증 통과] ${docRecord.name}`)

      return {
        success: true,
        agent: 'doc-verify-agent',
        message: `${docRecord.name} 검증 통과. Progress Tracker로 이관합니다.`,
        data: { doc_id: uploadedFile.doc_id, status: 'verified' },
        verification: verificationResult,
      }
    }

    // 검증 실패
    docRecord.status = 'rejected'
    docRecord.rejection_reason = verificationResult.rejection_reason || '서류 검증 실패'
    caseObj.updated_at = new Date().toISOString()

    const rejectionMsg = await generateRejectionMessage(
      docRecord.name,
      docRecord.rejection_reason
    )

    console.log(`❌ [검증 실패] ${docRecord.name}: ${docRecord.rejection_reason}`)
    console.log('\n재제출 안내:')
    console.log(rejectionMsg)

    return {
      success: false,
      agent: 'doc-verify-agent',
      message: `${docRecord.name} 검증 실패. Gap Analysis Agent로 이관합니다.`,
      data: {
        doc_id: uploadedFile.doc_id,
        status: 'rejected',
        rejection_reason: docRecord.rejection_reason,
      },
      verification: verificationResult,
      rejection_message: rejectionMsg,
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ [Document Verification Agent] 오류:', errMsg)
    return {
      success: false,
      agent: 'doc-verify-agent',
      message: '서류 검증 중 오류가 발생했습니다.',
      error: errMsg,
    }
  }
}

// ============================================================
// 직접 실행 테스트 (실제 이미지 파일 필요)
// ============================================================
const isMain = (() => { try { return import.meta.url === `file://${process.argv?.[1]}`; } catch { return false; } })()
if (isMain) {
  console.log('✅ Document Verification Agent 모듈 로드 완료')
  console.log('실제 테스트는 orchestrator.ts에서 실행하세요.')
  console.log(`
사용법:
  import { runDocVerifyAgent } from './doc-verify-agent'

  const result = await runDocVerifyAgent(caseObject, {
    doc_id: 'DEATH',
    file_path: '/path/to/death_certificate.jpg'
  })
  `)
}
