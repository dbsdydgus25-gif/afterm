import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

    const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL
    const secret = process.env.CLOVA_OCR_SECRET
    if (!invokeUrl || !secret) return NextResponse.json({ error: 'OCR 설정 오류' }, { status: 500 })

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const mime = file.type || ''
    let ext: string
    if (mime.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf')) ext = 'pdf'
    else if (mime.includes('png')) ext = 'png'
    else if (mime.includes('tiff') || mime.includes('tif')) ext = 'tiff'
    else ext = 'jpg'

    // ── 1단계: CLOVA OCR ──────────────────────────────────
    const ocrBody = {
      version: 'V2',
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      images: [{ format: ext, name: 'death-cert', data: base64 }],
    }

    const safeUrl = invokeUrl.replace(/^http:\/\//, 'https://')
    const ocrRes = await fetch(safeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OCR-SECRET': secret },
      body: JSON.stringify(ocrBody),
    })

    if (!ocrRes.ok) {
      const txt = await ocrRes.text()
      console.error('[OCR] CLOVA 오류', ocrRes.status, txt)
      return NextResponse.json({ error: `OCR 오류 ${ocrRes.status}` }, { status: 500 })
    }

    const ocrData = await ocrRes.json()
    const fields: { name: string; inferText: string }[] = ocrData.images?.[0]?.fields ?? []
    const allText = fields.map(f => f.inferText).join(' ')
    console.log('[OCR] 추출 텍스트:', allText)

    // ── 2단계: Claude AI 진위 검증 + 정보 추출 ────────────
    const mediaType = ext === 'pdf' ? 'application/pdf'
      : ext === 'png' ? 'image/png'
      : ext === 'tiff' ? 'image/tiff'
      : 'image/jpeg'

    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
          },
          {
            type: 'text',
            text: `당신은 대한민국 사망진단서 진위 검증 전문가입니다.

아래는 CLOVA OCR이 추출한 텍스트입니다:
---
${allText}
---

위 이미지와 텍스트를 분석하여 다음 JSON만 반환하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "name": "고인 성함 (한글 2~5자, 없으면 null)",
  "birthDate": "생년월일 YYYY-MM-DD 형식 (없으면 null)",
  "deathDate": "사망 연월일 YYYY-MM-DD 형식 (없으면 null)",
  "hospital": "의료기관명 (없으면 null)",
  "licenseNumber": "의사 면허번호 숫자 (없으면 null)",
  "hasSignature": true 또는 false,
  "authentic": true 또는 false,
  "score": 0~100 사이 진위 신뢰도 점수,
  "issues": ["문제점1"] 또는 []
}

## 진위 판단 핵심 기준 (형식 우선)

### 반드시 확인 (각 20점)
1. "사망진단서" 또는 "사체검안서(시체검안서)" 제목이 있는가
2. "의료법 시행규칙 별지 제6호서식" 또는 공식 양식 번호가 있는가
3. 성명, 주민등록번호(또는 생년월일), 사망일시 항목이 존재하는가
4. 의료기관명과 의사 성명 항목이 있는가
5. 등록번호 또는 연번호가 있는가

### 가점 항목 (각 10점)
- 의사 면허번호가 기재되어 있는가 (공백이어도 감점 없음 — 미기재는 흔함)
- 서명 또는 날인이 있는가
- 사망 원인이 기재되어 있는가 (미기재도 감점 없음 — 생략 가능한 항목)

### 중요: 아래는 감점하지 마세요
- 면허번호 공백 (테스트/실제 문서 모두 공백인 경우 많음)
- 사망 원인 미기재 (선택 항목)
- 사망의 종류 미체크 (선택 항목)
- 병원명이 낯선 경우 (모든 병원이 공식적)

### 판정
- 70점 이상: authentic=true
- 70점 미만: authentic=false, issues에 핵심 문제점만 기재`
          }
        ]
      }]
    })

    let result: {
      name: string | null
      birthDate: string | null
      deathDate: string | null
      hospital: string | null
      licenseNumber: string | null
      hasSignature: boolean
      authentic: boolean
      score: number
      issues: string[]
    }

    try {
      const raw = claudeRes.content[0].type === 'text' ? claudeRes.content[0].text : ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      result = null as unknown as typeof result
    }

    if (!result) {
      return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 })
    }

    console.log('[OCR] AI 검증 결과:', result)
    return NextResponse.json({ ...result, success: true })

  } catch (e) {
    console.error('[OCR] 오류', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
