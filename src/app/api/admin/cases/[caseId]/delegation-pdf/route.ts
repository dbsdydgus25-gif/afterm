// GET /api/admin/cases/[caseId]/delegation-pdf
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const BUSINESS_REG = process.env.AFTERM_BUSINESS_REG || '미등록'
const CEO_NAME     = process.env.AFTERM_CEO_NAME     || '미등록'
const BUSINESS_ADDR = process.env.AFTERM_ADDR        || '대한민국'

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

  // delegations가 없는 케이스도 처리
  const { data: caseData } = await adminClient
    .from('cases')
    .select('*, delegations(*), case_services(*)')
    .eq('id', caseId)
    .single()

  if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  // delegations 레코드가 없으면 별도로 조회
  let delegation: any = caseData.delegations?.[0] || null
  if (!delegation) {
    const { data: delData } = await adminClient
      .from('delegations')
      .select('*')
      .eq('case_id', caseId)
      .single()
    delegation = delData || {}
  }

  // ── 폰트 로드 ──
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

  const black = rgb(0.08, 0.08, 0.08)
  const gray  = rgb(0.45, 0.45, 0.45)
  const lgray = rgb(0.75, 0.75, 0.75)
  const navy  = rgb(0.08, 0.18, 0.38)

  const ML = 55  // 좌 여백
  const MR = 540 // 우 끝
  const CW = MR - ML // 콘텐츠 너비

  // ── 헬퍼 ──────────────────────────────────────────────
  // pdf-lib 한글 glyph폭 버그 우회: 글자마다 고정 폭으로 수동 배치
  function charW(ch: string, size: number): number {
    const code = ch.charCodeAt(0)
    if (code >= 0xAC00 && code <= 0xD7A3) return size * 0.63   // 한글
    if (code >= 0x3000 && code <= 0x303F) return size * 0.63   // CJK 부호
    if (code >= 0xFF00 && code <= 0xFFEF) return size * 0.63   // 전각
    if (ch === ' ') return size * 0.28
    if (ch >= '0' && ch <= '9') return size * 0.38
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) return size * 0.33
    return size * 0.36
  }

  function drawStr(text: string, x: number, y: number, size: number, f: typeof font, color: typeof black): number {
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

  function textWidth(text: string, size: number): number {
    return Array.from(text).reduce((w, ch) => w + charW(ch, size), 0)
  }

  function line(x1: number, y1: number, x2: number, y2: number, thick = 0.6, color = lgray) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: thick, color })
  }

  // 한글 자동 줄바꿈
  function wrap(text: string, x: number, y: number, maxW: number, size = 9.5, bold = false, color = black, gap = 1.6): number {
    const f = bold ? fontBold : font
    const cw = size * 0.63
    const perLine = Math.max(1, Math.floor(maxW / cw))
    let remaining = text
    while (remaining) {
      const chunk = remaining.slice(0, perLine)
      drawStr(chunk, x, y, size, f, color)
      remaining = remaining.slice(perLine)
      if (remaining) y -= size * gap
    }
    return y
  }

  // ─────────────────────────────────────────────────────
  // 1. 제목부
  // ─────────────────────────────────────────────────────
  // 상단 얇은 선
  line(ML, height - 36, MR, height - 36, 2, navy)

  // 제목 (수동 가운데 정렬)
  const titleText = '위  임  장'
  const titleW = textWidth(titleText, 26)
  t(titleText, (width - titleW) / 2, height - 68, 26, true, navy)

  // 제목 아래 설명
  t('디지털 유산 사후 행정 대행에 관한 위임장', ML, height - 90, 9, false, gray)

  // 우측: 문서번호
  const docNo = `AFT-${caseId.slice(0, 8).toUpperCase()}`
  t(`문서번호: ${docNo}`, MR - 120, height - 90, 8, false, lgray)

  line(ML, height - 98, MR, height - 98, 0.5)
  line(ML, height - 100, MR, height - 100, 0.5)

  let y = height - 118

  // ─────────────────────────────────────────────────────
  // 2. 제1조 당사자
  // ─────────────────────────────────────────────────────
  t('제1조 (당사자 및 목적)', ML, y, 10, true, navy)
  y -= 6
  line(ML, y, MR, y, 1.2, navy)
  y -= 14

  // 목적 문장
  const purpose = `본 위임장은 위임인이 에프텀(수임인)에게 고인의 디지털 유산 정리 및 행정 대행 업무를 위탁하기 위해 작성한 법적 문서입니다.`
  y = wrap(purpose, ML, y, CW, 9.5, false, black)
  y -= 16

  // 위임인 테이블
  t('▪ 위임인 (본인)', ML, y, 9.5, true, navy)
  y -= 12

  const tableRows: [string, string][] = [
    ['성   명', delegation.delegator_name || ''],
    ['고인과의 관계', delegation.delegator_relation || ''],
    ['주   소', (delegation as any).delegator_address || ''],
    ['연   락   처', delegation.delegator_phone || ''],
  ]

  for (const [label, val] of tableRows) {
    const isAddr = label.startsWith('주')
    const rowH = isAddr && val && val.length > 20 ? 28 : 16
    page.drawRectangle({ x: ML, y: y - 3, width: CW, height: rowH, color: rgb(0.97, 0.97, 0.97) })
    line(ML, y - 3, MR, y - 3, 0.4)
    t(label, ML + 8, y + 3, 9, false, gray)
    if (isAddr && val && val.length > 20) {
      // 긴 주소는 공백 기준으로 앞/뒤 분할
      const spaceIdx = val.indexOf(' ', Math.floor(val.length * 0.4))
      const splitAt = spaceIdx > 0 ? spaceIdx : Math.ceil(val.length / 2)
      t(val.slice(0, splitAt).trim(), ML + 110, y + 9, 9, false, black)
      t(val.slice(splitAt).trim(), ML + 110, y - 2, 9, false, black)
    } else {
      t(val || '_______________', ML + 110, y + 3, 9.5, true, val ? black : lgray)
    }
    y -= rowH + 2
  }
  line(ML, y + 14, MR, y + 14, 0.4)
  y -= 10

  // 수임인 테이블
  t('▪ 수임인 (대리인)', ML, y, 9.5, true, navy)
  y -= 12

  const agentRows: [string, string][] = [
    ['상   호', '에프텀 (개인사업자)'],
    ['사업자등록번호', BUSINESS_REG],
    ['대   표   자', CEO_NAME],
    ['소   재   지', BUSINESS_ADDR],
  ]

  for (const [label, val] of agentRows) {
    page.drawRectangle({ x: ML, y: y - 3, width: CW, height: 16, color: rgb(0.97, 0.97, 0.97) })
    line(ML, y - 3, MR, y - 3, 0.4)
    t(label, ML + 8, y + 3, 9, false, gray)
    t(val, ML + 110, y + 3, 9.5, false, black)
    y -= 18
  }
  line(ML, y + 14, MR, y + 14, 0.4)
  y -= 18

  // 고인 정보 테이블
  t('▪ 고인 (피위임인)', ML, y, 9.5, true, navy)
  y -= 12

  const deceasedRows: [string, string][] = [
    ['성   명', caseData.deceased_name || ''],
    ['생   년   월   일', caseData.deceased_birth || ''],
    ['사   망   일', caseData.deceased_death || ''],
    ['전   화   번   호', caseData.deceased_phone || ''],
  ]

  for (const [label, val] of deceasedRows) {
    page.drawRectangle({ x: ML, y: y - 3, width: CW, height: 16, color: rgb(0.97, 0.97, 0.97) })
    line(ML, y - 3, MR, y - 3, 0.4)
    t(label, ML + 8, y + 3, 9, false, gray)
    t(val || '_______________', ML + 110, y + 3, 9.5, false, val ? black : lgray)
    y -= 18
  }
  line(ML, y + 14, MR, y + 14, 0.4)
  y -= 18

  // ─────────────────────────────────────────────────────
  // 3. 제2조 사후 존속 특약
  // ─────────────────────────────────────────────────────
  t('제2조 (사후 위임의 존속 특약)', ML, y, 10, true, navy)
  y -= 6
  line(ML, y, MR, y, 1.2, navy)
  y -= 14

  // 강조 박스
  page.drawRectangle({ x: ML, y: y - 30, width: CW, height: 46, color: rgb(0.97, 0.97, 1.00) })
  page.drawRectangle({ x: ML, y: y - 30, width: 3, height: 46, color: navy })
  const art2 = '본 계약은 위임인의 사후(死後) 디지털 유산 관리를 목적으로 체결된 것으로, 민법 제127조(위임의 종료사유) 제1항에도 불구하고 본 위임 계약 및 대리권은 위임인의 사망으로 인하여 종료되지 아니하며 그 효력이 지속됩니다. 본 위임장의 효력은 위임인의 사망 시점(사망진단서 상의 일시)부터 발생합니다.'
  y = wrap(art2, ML + 8, y, CW - 14, 9, false, rgb(0.1, 0.1, 0.35))
  y -= 22

  // ─────────────────────────────────────────────────────
  // 4. 제3조 위임 범위
  // ─────────────────────────────────────────────────────
  t('제3조 (위임 업무의 범위)', ML, y, 10, true, navy)
  y -= 6
  line(ML, y, MR, y, 1.2, navy)
  y -= 14

  t('본인은 수임인(에프텀)에게 다음의 권한을 위임합니다.', ML, y, 9.5); y -= 14

  const scopes = [
    ['① 디지털 플랫폼 계정 처리',
      '카카오톡·구글·메타(페이스북/인스타그램)·트위터X 등 본인 명의로 가입된 소셜미디어 및 포털 계정에 대한 영구 탈퇴, 데이터 삭제, 추모계정 전환 신청 및 관련 서류 제출 행위 일체.'],
    ['② 정기 결제 및 구독 해지',
      '이동통신사·OTT 서비스(넷플릭스 등)·클라우드 등 본인 명의의 유료 구독 서비스 현황 조회 및 해지 신청.'],
    ['③ 금융 계좌 사망 통보 (제한적 권한)',
      '본인 명의의 은행·증권사·가상자산 거래소에 대하여 사망 사실의 통보 및 계정의 동결(지급 정지)을 요청하는 행위. ※ 수임인은 자산의 인출·이체·처분 권한을 갖지 아니하며, 자산 귀속은 상속법에 따릅니다.'],
  ]

  for (const [title, desc] of scopes) {
    t(title, ML + 4, y, 9.5, true, black)
    y -= 12
    y = wrap(desc, ML + 16, y, CW - 20, 9, false, gray)
    y -= 10
  }

  // 신청 서비스 목록
  const services = caseData.case_services || []
  if (services.length > 0) {
    t('신청 서비스 목록:', ML + 4, y, 9, true, navy); y -= 12
    for (const s of services) {
      const track = (s.service_category === '추모계정' || s.service_category === 'memorialize') ? '추모계정 전환' : '계정 삭제'
      t(`• ${s.service_name}  (${track})`, ML + 16, y, 9, false, black)
      y -= 13
    }
    y -= 4
  }

  // ─────────────────────────────────────────────────────
  // 5. 제4조 면책
  // ─────────────────────────────────────────────────────
  t('제4조 (상속인의 권리 제한 및 면책)', ML, y, 10, true, navy)
  y -= 6
  line(ML, y, MR, y, 1.2, navy)
  y -= 14

  const art4s = [
    '① 수임인이 본 위임장에 명시된 권한 내에서 수행한 계정 삭제·해지·동결 등의 행위는 위임인의 확고한 생전 의사에 따른 것입니다.',
    '② 본인의 법정 상속인은 수임인의 정당한 위임 업무 수행에 대하여 어떠한 민·형사상 이의를 제기하거나 손해배상을 청구할 수 없습니다.',
    '③ 수임인은 개별 플랫폼의 자체 약관 또는 관공서의 불가항력적인 사유로 인해 대행 업무가 지연되거나 거절되는 경우 이에 대한 법적 책임을 지지 않습니다.',
  ]
  for (const a of art4s) {
    y = wrap(a, ML, y, CW, 9.5, false, black)
    y -= 8
  }
  y -= 6

  // ─────────────────────────────────────────────────────
  // 6. 첨부 서류
  // ─────────────────────────────────────────────────────
  t('첨부 서류', ML, y, 9.5, true, gray); y -= 10
  for (const d of ['사망진단서 사본 1부', '가족관계증명서 1부', '신청인(위임인) 신분증 사본 1부']) {
    t(`• ${d}`, ML + 8, y, 9, false, gray); y -= 12
  }
  y -= 10

  // ─────────────────────────────────────────────────────
  // 7. 서명
  // ─────────────────────────────────────────────────────
  line(ML, y + 4, MR, y + 4, 0.5)
  y -= 12

  const signedDate = delegation.signed_at
    ? new Date(delegation.signed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const certText = `본인은 위 내용을 모두 충분히 이해하였으며, 자유로운 의사에 따라 에프텀(대표 ${CEO_NAME})을 대리인으로 지정하여 본 위임장에 직접 전자서명합니다.`
  y = wrap(certText, ML, y, CW, 9.5, false, black)
  y -= 14

  t(`작성일자 :  ${signedDate}`, ML, y, 9.5); y -= 12
  t(`위임인 성명 :  ${delegation.delegator_name || ''}`, ML, y, 9.5); y -= 12
  t('서   명 :', ML, y, 9.5); y -= 4

  // 서명 이미지 또는 서명란
  if (delegation.signature_data) {
    try {
      const b64 = delegation.signature_data.replace(/^data:image\/png;base64,/, '')
      const sigImg = await pdfDoc.embedPng(Buffer.from(b64, 'base64'))
      const sigW = 160, sigH = 56
      page.drawImage(sigImg, { x: ML + 60, y: y - sigH + 6, width: sigW, height: sigH })
      line(ML + 60, y - sigH - 2, ML + 60 + sigW, y - sigH - 2, 0.8, black)
      t(`${delegation.delegator_name || ''} (서명)`, ML + 62, y - sigH - 13, 8.5, false, gray)
      y -= sigH + 20
    } catch {
      // 서명 이미지 로드 실패시 서명란으로 대체
      page.drawRectangle({ x: ML + 60, y: y - 48, width: 160, height: 46, color: rgb(0.97, 0.97, 0.97) })
      line(ML + 60, y - 48, ML + 220, y - 48, 0.6)
      y -= 58
    }
  } else {
    page.drawRectangle({ x: ML + 60, y: y - 48, width: 160, height: 46, color: rgb(0.97, 0.97, 0.97) })
    for (const [lx, ly, rx, ry] of [
      [ML+60, y+2, ML+220, y+2],
      [ML+60, y-46, ML+220, y-46],
      [ML+60, y-46, ML+60, y+2],
      [ML+220, y-46, ML+220, y+2],
    ]) line(lx, ly, rx, ry, 0.5, lgray)
    t('서명란', ML + 120, y - 26, 9, false, lgray)
    y -= 58
  }

  // 수임인란
  t('수 임 인 :  에프텀  대표  ', ML, y, 9.5); y -= 4
  line(ML + 100, y + 8, ML + 260, y + 8, 0.8)
  t('(인)', ML + 265, y + 3, 9.5); y -= 14

  // 본인인증 기록
  if (delegation.verified_at || delegation.verified_phone) {
    const vt = delegation.verified_at
      ? new Date(delegation.verified_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      : ''
    t(`[본인인증 완료]  인증일시: ${vt}  인증번호: ${delegation.verified_phone || ''}`, ML, y, 8, false, gray)
    y -= 14
  }

  // ─────────────────────────────────────────────────────
  // 8. 하단 푸터
  // ─────────────────────────────────────────────────────
  line(ML, 52, MR, 52, 0.5)
  line(ML, 50, MR, 50, 1.2, navy)
  t('본 문서는 디지털 유산 행정대행 목적으로 작성된 위임장이며, 수집된 개인정보는 업무 완료 후 30일 이내 파기됩니다.', ML, 40, 7.5, false, gray)
  t(`에프텀 (개인사업자)  |  사업자등록번호 ${BUSINESS_REG}  |  대표 ${CEO_NAME}  |  ${docNo}  |  © ${new Date().getFullYear()}`, ML, 28, 7.5, false, lgray)

  const pdfBytes = await pdfDoc.save()
  const fileName = `위임장_${caseData.deceased_name || 'unknown'}_${caseId.slice(0, 8)}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
