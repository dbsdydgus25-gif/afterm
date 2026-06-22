// ============================================================
// GET /api/admin/cases/[caseId]/delegation-pdf
// 위임장 PDF 생성 및 반환 (한글 폰트 지원)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { caseId } = await params
  const adminClient = createAdminClient()

  const { data: caseData } = await adminClient
    .from('cases')
    .select('*, delegations(*), case_services(*)')
    .eq('id', caseId)
    .single()

  if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  const delegation = caseData.delegations?.[0]
  if (!delegation) return NextResponse.json({ error: '위임 정보 없음' }, { status: 404 })

  // Noto Sans KR 폰트 런타임 fetch
  const fontRes = await fetch('https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.otf')
  if (!fontRes.ok) return NextResponse.json({ error: '폰트 로드 실패' }, { status: 500 })
  const fontBytes = await fontRes.arrayBuffer()

  const fontBoldRes = await fetch('https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.otf')
  const fontBoldBytes = fontBoldRes.ok ? await fontBoldRes.arrayBuffer() : fontBytes

  // PDF 생성
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const font = await pdfDoc.embedFont(fontBytes)
  const fontBold = await pdfDoc.embedFont(fontBoldBytes)

  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const blue = rgb(0.086, 0.196, 0.447)
  const gray = rgb(0.5, 0.5, 0.5)
  const dark = rgb(0.1, 0.1, 0.1)

  const drawText = (text: string, x: number, y: number, size = 11, bold = false, color = dark) => {
    const f = bold ? fontBold : font
    page.drawText(text || '', { x, y, size, font: f, color })
  }

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  }

  const services = (caseData.case_services || []).map((s: any) => {
    const track = (s.service_category === 'memorialize' || s.service_category === '추모계정') ? '추모계정 전환' : '계정 삭제'
    return `• ${s.service_name || ''} (${track})`
  })

  const signedAt = delegation.signed_at
    ? new Date(delegation.signed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const deceasedBirth = caseData.deceased_birth || ''
  const deceasedDeath = caseData.deceased_death || ''

  // 헤더
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue })
  drawText('위 임 장', 40, height - 38, 22, true, rgb(1, 1, 1))
  drawText('Power of Attorney', 40, height - 58, 11, false, rgb(0.7, 0.85, 1))
  drawText('에프텀 행정대행 서비스', width - 180, height - 42, 10, false, rgb(0.7, 0.85, 1))
  drawText('Afterm Administrative Service', width - 180, height - 58, 9, false, rgb(0.6, 0.75, 0.95))

  let y = height - 105

  // ── 위임인 ──
  drawText('위임인 (Delegator)', 40, y, 11, true, blue)
  y -= 5; drawLine(40, y, width - 40, y); y -= 18

  drawText('성명 (Name)', 56, y, 10, false, gray)
  drawText(delegation.delegator_name || '', 200, y, 10, true)
  y -= 17
  drawText('고인과의 관계 (Relation)', 56, y, 10, false, gray)
  drawText(delegation.delegator_relation || '', 200, y, 10, true)
  y -= 28

  // ── 수임인 ──
  drawText('수임인 (Delegatee)', 40, y, 11, true, blue)
  y -= 5; drawLine(40, y, width - 40, y); y -= 18

  drawText('상호 (Company)', 56, y, 10, false, gray)
  drawText('에프텀 주식회사 (Afterm Co., Ltd.)', 200, y, 10, true)
  y -= 17
  drawText('대표 (Representative)', 56, y, 10, false, gray)
  drawText('에프텀 대표이사', 200, y, 10, true)
  y -= 28

  // ── 고인 정보 ──
  drawText('고인 정보 (Deceased Information)', 40, y, 11, true, blue)
  y -= 5; drawLine(40, y, width - 40, y); y -= 18

  drawText('성명 (Name)', 56, y, 10, false, gray)
  drawText(caseData.deceased_name || '', 200, y, 10, true)
  y -= 17
  if (deceasedBirth) {
    drawText('생년월일 (Date of Birth)', 56, y, 10, false, gray)
    drawText(deceasedBirth, 200, y, 10)
    y -= 17
  }
  if (deceasedDeath) {
    drawText('사망일 (Date of Death)', 56, y, 10, false, gray)
    drawText(deceasedDeath, 200, y, 10)
    y -= 17
  }
  y -= 14

  // ── 위임 내용 ──
  drawText('위임 내용 (Scope of Delegation)', 40, y, 11, true, blue)
  y -= 5; drawLine(40, y, width - 40, y); y -= 18

  drawText('위임인은 수임인에게 아래 디지털 계정 처리에 관한 모든 행정 업무를 위임합니다.', 56, y, 9, false, dark)
  y -= 13
  drawText('(The Delegator delegates all administrative tasks related to the following digital accounts.)', 56, y, 8, false, gray)
  y -= 20

  for (const svc of services) {
    drawText(svc, 72, y, 10)
    y -= 16
  }
  y -= 6

  drawText('위임 범위: 관련 서류 제출, 기관 연락, 기타 필요한 행정 행위 일체', 56, y, 9, false, rgb(0.3, 0.3, 0.3))
  y -= 13
  drawText('(Scope: document submission, authority contact, and all related administrative actions)', 56, y, 8, false, gray)
  y -= 22

  // ── 첨부 서류 ──
  drawText('첨부 서류 (Attached Documents)', 40, y, 11, true, blue)
  y -= 5; drawLine(40, y, width - 40, y); y -= 18

  const attachDocs = ['• 사망진단서 사본 1부', '• 가족관계증명서 1부', '• 신청인 신분증 사본 1부']
  for (const doc of attachDocs) {
    drawText(doc, 56, y, 10); y -= 16
  }
  y -= 20

  // ── 서명 ──
  drawText('위임인 서명 (Delegator Signature)', 40, y, 11, true, blue)
  y -= 5; drawLine(40, y, width - 40, y); y -= 22

  drawText(`서명일 (Date):  ${signedAt}`, 56, y, 10)
  y -= 28

  drawText('위임인 (Signature):', 56, y, 10)

  if (delegation.signature_data) {
    try {
      const base64 = delegation.signature_data.replace(/^data:image\/png;base64,/, '')
      const signatureImage = await pdfDoc.embedPng(Buffer.from(base64, 'base64'))
      const sigDims = signatureImage.scale(0.4)
      page.drawImage(signatureImage, {
        x: 200, y: y - 50,
        width: Math.min(sigDims.width, 160),
        height: Math.min(sigDims.height, 60),
      })
      y -= 70
    } catch {
      drawText('[서명 있음]', 200, y - 14, 10)
      y -= 30
    }
  }

  drawLine(200, y + 5, 380, y + 5)
  drawText(`${delegation.delegator_name || ''} (인)`, 200, y - 12, 9)
  y -= 30

  drawText('수임인 (Afterm Co., Ltd.):', 56, y, 10)
  drawLine(200, y - 5, 380, y - 5)
  drawText('에프텀 주식회사', 200, y - 18, 9)

  // 하단
  drawLine(40, 80, width - 40, 80)
  drawText('본 문서는 디지털 유산 행정대행 목적으로 작성되었으며, 개인정보는 안전하게 관리됩니다.', 40, 66, 8, false, gray)
  drawText('(This document was created for digital estate administration. Personal info is managed securely.)', 40, 54, 7, false, gray)
  drawText(`에프텀 주식회사  |  afterm.co.kr  |  © ${new Date().getFullYear()}`, width / 2 - 100, 38, 8, false, gray)

  const pdfBytes = await pdfDoc.save()
  const fileName = `위임장_${caseData.deceased_name || 'unknown'}_${caseId.slice(0, 8)}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
