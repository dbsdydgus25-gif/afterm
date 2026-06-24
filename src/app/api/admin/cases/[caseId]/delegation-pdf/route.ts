// GET /api/admin/cases/[caseId]/delegation-pdf
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'

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

  const { data: caseData } = await adminClient.from('cases').select('*, case_services(*)').eq('id', caseId).single()
  if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  const { data: delegation } = await adminClient.from('delegations').select('*').eq('case_id', caseId).single()
  const d: any = delegation || {}

  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const fontBytes     = fs.readFileSync(path.join(fontsDir, 'NotoSansKR-Regular.ttf'))
  const fontBoldBytes = fs.existsSync(path.join(fontsDir, 'NotoSansKR-Bold.ttf'))
    ? fs.readFileSync(path.join(fontsDir, 'NotoSansKR-Bold.ttf'))
    : fontBytes

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const font     = await pdfDoc.embedFont(Buffer.from(fontBytes))
  const fontBold = await pdfDoc.embedFont(Buffer.from(fontBoldBytes))

  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  const black = rgb(0, 0, 0)
  const gray  = rgb(0.4, 0.4, 0.4)
  const lgray = rgb(0.8, 0.8, 0.8)
  const ML = 50, MR = 545, CW = MR - ML

  function charW(ch: string, size: number) {
    const code = ch.charCodeAt(0)
    if (code >= 0xAC00 && code <= 0xD7A3) return size * 0.63
    if (ch === ' ') return size * 0.28
    if (ch >= '0' && ch <= '9') return size * 0.38
    return size * 0.33
  }

  function drawStr(text: string, x: number, y: number, size: number, f: typeof font, color = black) {
    let cx = x
    for (const ch of text) {
      page.drawText(ch, { x: cx, y, size, font: f, color })
      cx += charW(ch, size)
    }
    return cx
  }

  function t(text: string, x: number, y: number, size = 10, bold = false, color = black) {
    if (!text) return
    drawStr(text, x, y, size, bold ? fontBold : font, color)
  }

  function strW(text: string, size: number) {
    return Array.from(text).reduce((w, ch) => w + charW(ch, size), 0)
  }

  function line(x1: number, y1: number, x2: number, y2: number, thick = 0.5, color = black) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: thick, color })
  }

  function rect(x: number, y: number, w: number, h: number, fill = rgb(1,1,1), stroke = true) {
    page.drawRectangle({ x, y: y - h, width: w, height: h, color: fill, borderColor: black, borderWidth: stroke ? 0.5 : 0 })
  }

  // 셀 그리기: x,y는 셀 top-left 기준
  function cell(x: number, y: number, w: number, h: number, label: string, value: string, labelW = 70, bg = rgb(0.93, 0.93, 0.93)) {
    rect(x, y, labelW, h, bg)
    rect(x + labelW, y, w - labelW, h, rgb(1,1,1))
    // 라벨 중앙
    const lw = strW(label, 8.5)
    t(label, x + (labelW - lw) / 2, y - h/2 - 3.5, 8.5, true)
    // 값
    if (value) t(value, x + labelW + 6, y - h/2 - 3.5, 9)
  }

  // ── 제목 ─────────────────────────────
  const title = '위  임  장'
  const tw = strW(title, 22)
  t(title, (width - tw) / 2, height - 55, 22, true)

  line(ML, height - 66, MR, height - 66, 0.5)

  let y = height - 85

  // ── 섹션 헤더 ─────────────────────────
  function sectionHeader(label: string) {
    t(`▶ ${label}`, ML, y, 10, true)
    y -= 4
    line(ML, y, MR, y, 0.5)
    y -= 2
  }

  // ── 위임인 섹션 ──────────────────────
  sectionHeader('위임인 (신청인)')

  const ROW = 22
  // 행 1: 성명 | 값 | 생년월일 | 값
  const half = CW / 2
  cell(ML,        y, half,    ROW, '성    명', d.delegator_name || '')
  cell(ML + half, y, half,    ROW, '생년월일', '-')
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW

  // 행 2: 주소 | 값
  cell(ML, y, CW, ROW, '주    소', d.delegator_address || '')
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW

  // 행 3: 연락처 | 값 | 고인과의 관계 | 값
  cell(ML,        y, half, ROW, '연  락  처', d.delegator_phone || '')
  cell(ML + half, y, half, ROW, '고인과의 관계', d.delegator_relation || '', 80)
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW + 12

  // ── 수임인 섹션 ──────────────────────
  sectionHeader('수임인 (에프텀)')

  const AFTERM_ADDR = process.env.AFTERM_ADDR || '경기도 평택시 지산로 128, 107동 9층 901호'
  const CEO = process.env.AFTERM_CEO_NAME || '윤용현'
  const BIZ_NO = process.env.AFTERM_BUSINESS_REG || '221-20-19292'

  cell(ML,        y, half, ROW, '상    호', '에프텀 (AFTERM)')
  cell(ML + half, y, half, ROW, '대  표  자', CEO)
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW

  cell(ML,        y, half, ROW, '사업자번호', BIZ_NO)
  cell(ML + half, y, half, ROW, '연  락  처', 'afterm001@gmail.com')
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW

  cell(ML, y, CW, ROW, '주    소', AFTERM_ADDR)
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW + 12

  // ── 고인 정보 섹션 ───────────────────
  sectionHeader('고인 정보')

  cell(ML,        y, half, ROW, '성    명', caseData.deceased_name || '')
  cell(ML + half, y, half, ROW, '생년월일', caseData.deceased_birth ? String(caseData.deceased_birth).slice(0,10) : '')
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW

  cell(ML,        y, half, ROW, '사  망  일', caseData.deceased_death ? String(caseData.deceased_death).slice(0,10) : '')
  cell(ML + half, y, half, ROW, '고인 연락처', caseData.deceased_phone || '')
  line(ML, y - ROW, MR, y - ROW, 0.5)
  y -= ROW + 12

  // ── 위임 내용 섹션 ───────────────────
  sectionHeader('위임 내용')

  const boxH = 74
  rect(ML, y, CW, boxH, rgb(0.98, 0.98, 0.98))

  t('위임인은 고인의 디지털 계정 정리에 관한 아래 업무 일체를 수임인에게 위임합니다.', ML + 8, y - 13, 9)
  t('1.  SNS·포털·금융 등 디지털 서비스 계정의 해지 및 삭제 의사 전달 대행', ML + 8, y - 27, 9)
  t('2.  각 기업·기관에 대한 해지 신청 서류 제출 및 접수 대행', ML + 8, y - 41, 9)
  t('3.  위 업무 처리에 필요한 제반 행위 일체', ML + 8, y - 55, 9)
  y -= boxH + 12

  // ── 유효 기간 및 특기 사항 ───────────
  sectionHeader('유효 기간 및 특기 사항')

  const box2H = 74
  rect(ML, y, CW, box2H, rgb(0.98, 0.98, 0.98))
  t('① 본 위임장의 유효 기간은 위임일로부터 1년으로 합니다.', ML + 8, y - 13, 9)
  t('② 위임인은 본 위임장을 자유로운 의사에 따라 작성하였습니다.', ML + 8, y - 27, 9)
  t('③ 수임인은 위임받은 범위 내에서만 업무를 수행하며, 그 외 목적으로 사용하지 않습니다.', ML + 8, y - 41, 9)
  t('④ 수임인은 위임 업무 수행 결과를 위임인에게 보고합니다.', ML + 8, y - 55, 9)
  y -= box2H + 18

  // ── 서명 섹션 ──────────────────────
  line(ML, y, MR, y, 0.5)
  y -= 16

  const today = new Date()
  const dateStr = `${today.getFullYear()}년  ${today.getMonth()+1}월  ${today.getDate()}일`
  t(`위임일자 :  ${dateStr}`, ML, y, 10)
  y -= 16

  t(`위임인  성명 :  ${d.delegator_name || ''}`, ML, y, 10)
  y -= 14

  t('서       명 :', ML, y, 10)

  if (d.signature_data) {
    try {
      const b64 = d.signature_data.replace(/^data:image\/png;base64,/, '')
      const sigImg = await pdfDoc.embedPng(Buffer.from(b64, 'base64'))
      const sigW = 150, sigH = 52
      page.drawImage(sigImg, { x: ML + 56, y: y - sigH + 10, width: sigW, height: sigH })
    } catch { /* 서명 이미지 없으면 빈 서명란 */ }
  }

  // 하단 테두리
  line(ML, 44, MR, 44, 0.5)
  t(`에프텀 (AFTERM)  |  사업자등록번호 ${BIZ_NO}  |  대표 ${CEO}`, ML, 34, 7.5, false, gray)

  const pdfBytes = await pdfDoc.save()
  const fileName = `위임장_${caseData.deceased_name || 'unknown'}_${caseId.slice(0,8)}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
