// ============================================================
// GET /api/admin/cases/[caseId]/delegation-pdf
// 위임장 PDF 생성 및 반환
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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

  // 케이스 + 위임 정보 조회
  const { data: caseData } = await adminClient
    .from('cases')
    .select('*, delegations(*), case_services(*)')
    .eq('id', caseId)
    .single()

  if (!caseData) {
    return NextResponse.json({ error: '케이스 없음' }, { status: 404 })
  }

  const delegation = caseData.delegations?.[0]
  if (!delegation) {
    return NextResponse.json({ error: '위임 정보 없음' }, { status: 404 })
  }

  const services = (caseData.case_services || []).map((s: any) => {
    const track = s.service_category === 'memorialize' ? '추모계정 전환' : '계정 삭제'
    return `• ${s.service_name || s.service_id} (${track})`
  })

  const signedAt = delegation.signed_at
    ? new Date(delegation.signed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const deceasedBirth = caseData.deceased_birth
    ? new Date(caseData.deceased_birth).toLocaleDateString('ko-KR')
    : ''
  const deceasedDeath = caseData.deceased_death
    ? new Date(caseData.deceased_death).toLocaleDateString('ko-KR')
    : ''

  // PDF 생성
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const drawText = (text: string, x: number, y: number, size = 11, bold = false, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color })
  }

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  }

  // 제목
  drawText('Wi Im Jang', width / 2 - 40, height - 60, 9, false, rgb(0.5, 0.5, 0.5))
  drawText('      (Power of Attorney)', width / 2 - 40, height - 72, 8, false, rgb(0.5, 0.5, 0.5))

  // 한글 제목 (크게)
  page.drawRectangle({ x: 40, y: height - 130, width: width - 80, height: 44, color: rgb(0.086, 0.196, 0.447) })
  drawText('Wi Im Jang  (Power of Attorney)', 55, height - 98, 18, true, rgb(1, 1, 1))
  drawText('Delegation Agreement', 55, height - 115, 10, false, rgb(0.7, 0.8, 1))

  let y = height - 160

  // 섹션: 위임인
  drawText('Wi Im In (Delegator / Principal)', 40, y, 10, true, rgb(0.086, 0.196, 0.447))
  y -= 4
  drawLine(40, y, width - 40, y)
  y -= 18

  drawText(`Seong Myeong (Name):`, 56, y, 10)
  drawText(delegation.delegator_name || '', 200, y, 10, true)
  y -= 18

  drawText(`Go In gwa ui Gwan Gye (Relation to Deceased):`, 56, y, 10)
  drawText(delegation.delegator_relation || '', 280, y, 10, true)
  y -= 28

  // 섹션: 수임인
  drawText('Su Im In (Delegatee / Agent)', 40, y, 10, true, rgb(0.086, 0.196, 0.447))
  y -= 4
  drawLine(40, y, width - 40, y)
  y -= 18

  drawText(`Sanho (Company): Afterm Co., Ltd. (Aepeoteum Jusik Hoesa)`, 56, y, 10)
  y -= 18
  drawText(`Daepyo (Representative): Afterm CEO`, 56, y, 10)
  y -= 28

  // 섹션: 고인
  drawText('Go In Jeong Bo (Deceased Information)', 40, y, 10, true, rgb(0.086, 0.196, 0.447))
  y -= 4
  drawLine(40, y, width - 40, y)
  y -= 18

  drawText(`Seong Myeong (Name):`, 56, y, 10)
  drawText(caseData.deceased_name || '', 200, y, 10, true)
  y -= 18

  if (deceasedBirth) {
    drawText(`Saengnyeonwolil (Date of Birth):`, 56, y, 10)
    drawText(deceasedBirth, 200, y, 10)
    y -= 18
  }

  if (deceasedDeath) {
    drawText(`Salmang Il (Date of Death):`, 56, y, 10)
    drawText(deceasedDeath, 200, y, 10)
    y -= 18
  }
  y -= 10

  // 섹션: 위임 내용
  drawText('Wi Im Nae Yong (Scope of Delegation)', 40, y, 10, true, rgb(0.086, 0.196, 0.447))
  y -= 4
  drawLine(40, y, width - 40, y)
  y -= 18

  drawText('Wi Im In eun Su Im In eun e Dae Ha Yeo A Rae Eul Wi Im Ham:', 56, y, 10)
  drawText('(The Delegator hereby delegates the following to the Delegatee:)', 56, y - 14, 9, false, rgb(0.4, 0.4, 0.4))
  y -= 36

  for (const svc of services) {
    drawText(svc, 72, y, 10)
    y -= 16
  }
  y -= 10

  // 위임 범위 설명
  const scopeText = [
    'Sang Gi Dig I Tal Gye Jong Hwa Gye Jeong Gwan Ryeon Ban Mul Seo Ryu',
    'Je Chul, Gwa Gwan Gwan Cheong Cheong Wi Im, Gi Ta Pil Yoh Han',
    'Haeng Jeong Haeng Wi Il Che.',
    '(All administrative procedures including document submission,',
    'contact with authorities, and related actions for the above digital',
    'account termination/memorializaton.)',
  ]
  for (const line of scopeText) {
    drawText(line, 72, y, 9, false, rgb(0.3, 0.3, 0.3))
    y -= 13
  }
  y -= 16

  // 첨부 서류
  drawText('Cheom Bu Seo Ryu (Attached Documents)', 40, y, 10, true, rgb(0.086, 0.196, 0.447))
  y -= 4
  drawLine(40, y, width - 40, y)
  y -= 18

  const attachDocs = [
    'Salang Jindan Seo (Death Certificate) Sabon - 1 Bu',
    'Gajeok Gwan Gye Jeung Myeong Seo (Family Relation Certificate) - 1 Bu',
    'Wi Im In Sin Bun Jeung (Delegator ID Card) Sabon - 1 Bu',
  ]
  for (const doc of attachDocs) {
    drawText(`• ${doc}`, 56, y, 10)
    y -= 16
  }
  y -= 20

  // 서명 영역
  drawText('Wi Im In Seo Myeong (Delegator Signature)', 40, y, 10, true, rgb(0.086, 0.196, 0.447))
  y -= 4
  drawLine(40, y, width - 40, y)
  y -= 20

  drawText(`Nal Ja (Date):  ${signedAt}`, 56, y, 10)
  y -= 30

  drawText('Wi Im In (Delegator / Signature):', 56, y, 10)

  // 서명 이미지 삽입
  if (delegation.signature_data) {
    try {
      const base64 = delegation.signature_data.replace(/^data:image\/png;base64,/, '')
      const signatureBytes = Buffer.from(base64, 'base64')
      const signatureImage = await pdfDoc.embedPng(signatureBytes)
      const sigDims = signatureImage.scale(0.4)
      page.drawImage(signatureImage, {
        x: 200,
        y: y - 50,
        width: Math.min(sigDims.width, 160),
        height: Math.min(sigDims.height, 60),
      })
      y -= 70
    } catch {
      drawText('[Signature on file]', 200, y - 14, 10)
      y -= 30
    }
  }

  drawLine(200, y + 5, 380, y + 5)
  drawText(`${delegation.delegator_name || ''} (In) / Seal`, 200, y - 10, 9)
  y -= 30

  // 수임인 서명
  drawText('Su Im In (Delegatee / Signature):', 56, y, 10)
  drawLine(200, y - 5, 380, y - 5)
  drawText('Afterm Co., Ltd.  (Aepeoteum)', 200, y - 18, 9)
  y -= 40

  // 하단 안내
  drawLine(40, 80, width - 40, 80)
  drawText('* I Mun Seo Neun Haeng Jeong Daenghaeng Mok Jeog Euro Man Jak Doe Eoss Seu Myeo, Gae In Jeong Bo Neun An Jeon Ha Ge Gwan Li Deob Ni Da.', 40, 65, 7, false, rgb(0.5, 0.5, 0.5))
  drawText('  (This document was created for administrative agency purposes. Personal information is managed securely.)', 40, 54, 7, false, rgb(0.5, 0.5, 0.5))
  drawText(`Afterm Co., Ltd.  |  afterm.co.kr  |  © ${new Date().getFullYear()}`, width / 2 - 80, 38, 8, false, rgb(0.5, 0.5, 0.5))

  const pdfBytes = await pdfDoc.save()

  const fileName = `delegation_${caseData.deceased_name || 'unknown'}_${caseId.slice(0, 8)}.pdf`

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
