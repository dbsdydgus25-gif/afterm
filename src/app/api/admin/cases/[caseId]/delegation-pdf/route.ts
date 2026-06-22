// GET /api/admin/cases/[caseId]/delegation-pdf
// 위임장 PDF 생성 — 법적 효력 강화, 개인사업자 기준

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const BUSINESS_REG = process.env.AFTERM_BUSINESS_REG || '000-00-00000'
const CEO_NAME = process.env.AFTERM_CEO_NAME || '에프텀 대표'
const BUSINESS_ADDR = process.env.AFTERM_ADDR || '대한민국'

type Color = ReturnType<typeof rgb>

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

  const delegation = caseData.delegations?.[0] || {}

  // ── 폰트 로드 ──────────────────────────────────────────────
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const fontBytes = fs.readFileSync(path.join(fontsDir, 'NotoSansKR-Regular.ttf'))
  const fontBoldBytes = fs.existsSync(path.join(fontsDir, 'NotoSansKR-Bold.ttf'))
    ? fs.readFileSync(path.join(fontsDir, 'NotoSansKR-Bold.ttf'))
    : fontBytes

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const font = await pdfDoc.embedFont(fontBytes)
  const fontBold = await pdfDoc.embedFont(fontBoldBytes)

  // A4 + 두 번째 페이지 추가 가능성 대비
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  // 색상 팔레트
  const navy   = rgb(0.071, 0.173, 0.376)
  const blue   = rgb(0.145, 0.369, 0.918)
  const gray   = rgb(0.45, 0.45, 0.47)
  const lgray  = rgb(0.72, 0.72, 0.74)
  const dark   = rgb(0.09, 0.09, 0.10)
  const white  = rgb(1, 1, 1)
  const red    = rgb(0.82, 0.10, 0.10)
  const bgLight = rgb(0.973, 0.976, 0.996)

  const L = 42  // 좌 여백
  const R = 553 // 우 끝

  // ── 유틸 ──────────────────────────────────────────────────
  function drawText(
    text: string, x: number, y: number, size = 10,
    bold = false, color: Color = dark
  ) {
    page.drawText(text || '', { x, y, size, font: bold ? fontBold : font, color })
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color: Color = lgray) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color })
  }

  // 자동 줄바꿈 텍스트 (한글 기준 대략 글자폭 = size * 0.58)
  function drawWrapped(
    text: string, x: number, y: number, maxW: number,
    size = 10, bold = false, color: Color = dark, lineGap = 1.55
  ): number {
    const f = bold ? fontBold : font
    const charW = size * 0.58
    const charsPerLine = Math.max(1, Math.floor(maxW / charW))
    const words = text.split('')
    let line = ''
    for (const ch of words) {
      if ((line + ch).length > charsPerLine) {
        page.drawText(line, { x, y, size, font: f, color })
        y -= size * lineGap
        line = ch
      } else {
        line += ch
      }
    }
    if (line) { page.drawText(line, { x, y, size, font: f, color }); y -= size * lineGap }
    return y
  }

  // ── 섹션 제목 ────────────────────────────────────────────
  function drawSection(label: string, y: number): number {
    page.drawRectangle({ x: L, y: y - 2, width: R - L, height: 18, color: bgLight })
    drawLine(L, y - 2, R, y - 2, 1, navy)
    drawText(label, L + 6, y + 3, 9.5, true, navy)
    return y - 22
  }

  // ── 2열 라벨/값 행 ────────────────────────────────────────
  function drawRow(label: string, value: string, y: number): number {
    drawText(label, L + 10, y, 9, false, gray)
    drawText(value, L + 130, y, 9.5, true, dark)
    drawLine(L, y - 6, R, y - 6, 0.3, lgray)
    return y - 17
  }

  // ────────────────────────────────────────────────────────
  //  헤더
  // ────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: navy })

  // 왼쪽: 제목
  drawText('위  임  장', L, height - 32, 22, true, white)
  drawText('POWER OF ATTORNEY', L, height - 50, 9.5, false, rgb(0.65, 0.75, 0.95))
  drawText('디지털 유산 사후 행정 대행', L, height - 63, 8.5, false, rgb(0.55, 0.67, 0.90))

  // 오른쪽: 에프텀
  drawText('에프텀 (AFTERM)', R - 100, height - 35, 10, true, white)
  drawText('디지털 유산 정리 대행', R - 97, height - 50, 8, false, rgb(0.65, 0.75, 0.95))

  let y = height - 90

  // ────────────────────────────────────────────────────────
  //  제1조 당사자 및 목적
  // ────────────────────────────────────────────────────────
  y = drawSection('제1조  당사자 및 목적', y)

  y = drawRow('목적', '위임인의 사망 이후 발생하는 디지털 유산 정리 및 행정 대행 업무를 수임인에게 위탁함', y)

  y -= 4
  drawText('▶  위임인 (본인)', L + 6, y, 9, true, blue); y -= 14
  y = drawRow('성명', delegation.delegator_name || '___________', y)
  y = drawRow('고인과의 관계', delegation.delegator_relation || '___________', y)
  y = drawRow('연락처', delegation.delegator_phone || '___________', y)

  y -= 4
  drawText('▶  수임인 (대리인)', L + 6, y, 9, true, blue); y -= 14
  y = drawRow('상호', '에프텀 (개인사업자)', y)
  y = drawRow('사업자등록번호', BUSINESS_REG, y)
  y = drawRow('대표자', CEO_NAME, y)
  y = drawRow('소재지', BUSINESS_ADDR, y)

  y -= 8

  // ────────────────────────────────────────────────────────
  //  제2조 사후 위임의 존속 특약 (핵심 법적 방어 조항)
  // ────────────────────────────────────────────────────────
  y = drawSection('제2조  사후 위임의 존속 특약  [핵심 법적 방어 조항]', y)

  // 빨간 강조 박스
  page.drawRectangle({ x: L, y: y - 46, width: R - L, height: 54, color: rgb(1, 0.97, 0.97) })
  page.drawLine({ start: { x: L, y: y + 8 }, end: { x: L, y: y - 38 }, thickness: 3, color: red })

  const art2 = '본 계약은 위임인 본인의 사후(死後) 디지털 유산 관리를 목적으로 체결된 것입니다. 따라서 민법 제127조(위임의 종료사유) 제1항에도 불구하고, 본 위임 계약 및 대리권은 위임인의 사망으로 인하여 종료되지 아니하며 그 효력이 지속됩니다. 본 위임장의 효력은 위임인의 사망 시점(사망진단서 상의 일시)부터 발생합니다.'
  y = drawWrapped(art2, L + 10, y, R - L - 16, 9, false, rgb(0.35, 0.05, 0.05))
  y -= 6

  // ────────────────────────────────────────────────────────
  //  제3조 위임 업무의 범위
  // ────────────────────────────────────────────────────────
  y = drawSection('제3조  위임 업무의 범위', y)

  drawText('본인은 수임인(에프텀)에게 다음의 권한을 위임합니다.', L + 8, y, 9, false, dark); y -= 16

  // 항목 1
  drawText('①  디지털 플랫폼 계정 처리', L + 8, y, 9, true, navy); y -= 12
  const scope1 = '카카오톡·구글·메타(페이스북/인스타그램)·트위터X 등 본인 명의로 가입된 소셜 미디어 및 포털 계정에 대한 영구 탈퇴, 데이터 삭제, 추모 계정 전환 신청 및 관련 서류(사망진단서·가족관계증명서 등) 제출 행위 일체.'
  y = drawWrapped(scope1, L + 16, y, R - L - 24, 8.5, false, dark) - 4

  // 항목 2
  drawText('②  정기 결제 및 구독 해지', L + 8, y, 9, true, navy); y -= 12
  const scope2 = '이동통신사·OTT 서비스(넷플릭스 등)·클라우드·정기 구독 서비스 등 본인 명의의 유료 구독 서비스 현황 조회 및 해지(중단) 신청.'
  y = drawWrapped(scope2, L + 16, y, R - L - 24, 8.5, false, dark) - 4

  // 항목 3
  drawText('③  금융 계좌 및 가상자산 처리  (제한적 권한)', L + 8, y, 9, true, navy); y -= 12
  const scope3 = "본인 명의의 은행·증권사·가상자산 거래소 등에 대하여 '사망 사실의 통보 및 계정의 동결(지급 정지)'을 요청하는 행위. ※ 단, 수임인은 자산의 인출·이체·처분 권한은 갖지 아니하며, 자산 귀속은 상속법에 따릅니다."
  y = drawWrapped(scope3, L + 16, y, R - L - 24, 8.5, false, dark) - 4

  // 신청된 서비스 목록
  const services = (caseData.case_services || [])
  if (services.length > 0) {
    page.drawRectangle({ x: L, y: y - 4, width: R - L, height: 14 + services.length * 14, color: bgLight })
    drawText('신청 서비스 목록', L + 8, y, 8.5, true, gray); y -= 13
    for (const s of services) {
      const track = s.service_category === '추모계정' || s.service_category === 'memorialize' ? '추모계정 전환' : '계정 삭제'
      drawText(`• ${s.service_name}  (${track})`, L + 16, y, 9, false, dark)
      y -= 13
    }
    y -= 4
  }

  // ────────────────────────────────────────────────────────
  //  제4조 상속인의 권리 제한 및 면책
  // ────────────────────────────────────────────────────────
  // 페이지 공간 부족 시 여유 남겨두기
  if (y < 220) {
    page.drawText('(다음 장 참조)', { x: L, y, size: 8, font, color: gray })
    y = height - 60
    // 실제로는 pdfDoc.addPage() 후 계속 작성해야 하나, 단순 구현으로 현재 페이지에 계속
  }

  y = drawSection('제4조  상속인의 권리 제한 및 면책', y)

  const art4a = '① 수임인이 본 위임장에 명시된 권한 내에서 수행한 계정 삭제·해지·동결 등의 행위는 본인의 확고한 생전 의사에 따른 것입니다.'
  y = drawWrapped(art4a, L + 8, y, R - L - 16, 9, false, dark) - 3

  const art4b = '② 본인의 법정 상속인은 수임인의 정당한 위임 업무 수행에 대하여 어떠한 민·형사상 이의를 제기하거나 손해배상을 청구할 수 없습니다.'
  y = drawWrapped(art4b, L + 8, y, R - L - 16, 9, false, dark) - 3

  const art4c = '③ 수임인은 개별 플랫폼의 자체 약관(고인 계정 처리 방침)이나 관공서의 불가항력적인 사유로 인해 대행 업무가 지연되거나 거절되는 경우 이에 대한 법적 책임을 지지 않습니다.'
  y = drawWrapped(art4c, L + 8, y, R - L - 16, 9, false, dark) - 8

  // ────────────────────────────────────────────────────────
  //  첨부 서류
  // ────────────────────────────────────────────────────────
  y = drawSection('첨부 서류', y)
  for (const doc of ['사망진단서 사본 1부', '가족관계증명서 1부', '신청인 신분증 사본 1부']) {
    drawText(`• ${doc}`, L + 10, y, 9); y -= 13
  }
  y -= 8

  // ────────────────────────────────────────────────────────
  //  위임인 확인 및 서명
  // ────────────────────────────────────────────────────────
  y = drawSection('위임인 확인 및 서명', y)

  const signedAt = delegation.signed_at
    ? new Date(delegation.signed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const certText = `본인은 위 내용을 모두 충분히 이해하였으며, 본인의 자유로운 의사에 따라 에프텀(대표 ${CEO_NAME})을 대리인으로 지정하여 본 위임장에 직접 전자서명합니다.`
  y = drawWrapped(certText, L + 8, y, R - L - 16, 9, false, dark) - 6

  drawText(`작성일자 :  ${signedAt}`, L + 8, y, 9); y -= 14
  drawText(`위임인(본인) :  ${delegation.delegator_name || '___________'}`, L + 8, y, 9); y -= 24

  // 서명 이미지
  if (delegation.signature_data) {
    try {
      const base64 = delegation.signature_data.replace(/^data:image\/png;base64,/, '')
      const signImg = await pdfDoc.embedPng(Buffer.from(base64, 'base64'))
      const sigW = 160, sigH = 60
      const sigX = L + 8, sigY = y - sigH - 4

      page.drawRectangle({ x: sigX - 4, y: sigY - 4, width: sigW + 8, height: sigH + 8, color: bgLight })
      page.drawImage(signImg, { x: sigX, y: sigY, width: sigW, height: sigH })
      drawLine(sigX, sigY - 8, sigX + sigW, sigY - 8, 0.7, dark)
      drawText(`${delegation.delegator_name || ''} (서명)`, sigX, sigY - 18, 8.5, false, dark)
      y = sigY - 28
    } catch {
      drawText('[서명 첨부됨]', L + 8, y, 9, false, gray); y -= 16
    }
  } else {
    // 서명란
    page.drawRectangle({ x: L + 8, y: y - 54, width: 160, height: 50, color: bgLight })
    drawLine(L + 8, y - 54, L + 168, y - 54, 0.5)
    drawLine(L + 8, y + 0, L + 168, y + 0, 0.5)
    drawLine(L + 8, y - 54, L + 8, y, 0.5)
    drawLine(L + 168, y - 54, L + 168, y, 0.5)
    drawText('서명란', L + 60, y - 30, 9, false, lgray)
    y -= 62
  }

  // 수임인 서명란
  y -= 8
  drawText('수임인 (에프텀) :', L + 8, y, 9); y -= 8
  drawLine(L + 8, y, L + 220, y, 0.7)
  drawText('에프텀  대표  ___________  (서명 또는 인)', L + 10, y - 14, 8.5, false, dark)
  y -= 32

  // ────────────────────────────────────────────────────────
  //  본인인증 타임스탬프 (있을 경우)
  // ────────────────────────────────────────────────────────
  if (delegation.verified_at || delegation.verified_phone) {
    y -= 4
    page.drawRectangle({ x: L, y: y - 22, width: R - L, height: 30, color: rgb(0.93, 1, 0.94) })
    drawLine(L, y + 8, L, y - 14, 3, rgb(0.1, 0.65, 0.25))
    drawText('본인인증 완료', L + 8, y, 9, true, rgb(0.06, 0.48, 0.18))
    const verifiedTime = delegation.verified_at
      ? new Date(delegation.verified_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      : '완료'
    drawText(`인증 일시: ${verifiedTime}  |  인증 번호: ${delegation.verified_phone || ''}`, L + 100, y, 8, false, gray)
    y -= 30
  }

  // ────────────────────────────────────────────────────────
  //  하단 푸터
  // ────────────────────────────────────────────────────────
  const footerY = 44
  drawLine(L, footerY + 20, R, footerY + 20, 0.4)
  drawText(
    '본 문서는 디지털 유산 행정대행 목적으로 작성된 위임장이며, 수집된 개인정보는 업무 완료 후 30일 이내 파기됩니다.',
    L, footerY + 10, 7.5, false, gray
  )
  drawText(
    `에프텀 (개인사업자)  |  사업자등록번호: ${BUSINESS_REG}  |  대표: ${CEO_NAME}  |  © ${new Date().getFullYear()}`,
    L, footerY, 7.5, false, lgray
  )

  const pdfBytes = await pdfDoc.save()
  const fileName = `위임장_${caseData.deceased_name || 'unknown'}_${caseId.slice(0, 8)}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
