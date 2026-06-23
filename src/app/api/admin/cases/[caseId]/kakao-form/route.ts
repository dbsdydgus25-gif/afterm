// GET /api/admin/cases/[caseId]/kakao-form
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb } from 'pdf-lib'
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

  const { data: caseData } = await adminClient
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  const { data: delegation } = await adminClient
    .from('delegations')
    .select('*')
    .eq('case_id', caseId)
    .single()

  const d = delegation || {}

  const templatePath = path.join(process.cwd(), 'public', 'templates', 'kakao-withdrawal.pdf')
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: '카카오 탈퇴 요청서 템플릿 없음 (public/templates/kakao-withdrawal.pdf)' }, { status: 500 })
  }

  const fontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Regular.ttf'))
  const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath))
  pdfDoc.registerFontkit(fontkit)
  const font = await pdfDoc.embedFont(Buffer.from(fontBytes))

  const pages = pdfDoc.getPages()
  const p1 = pages[0]  // 고인 정보 / 신청인 정보 / 체크박스
  const p2 = pages[1]  // 제출서류 / 개인정보 동의 / 날짜 / 서명

  const black = rgb(0.05, 0.05, 0.05)
  const SIZE = 9.5

  // pdf-lib 좌표계: 좌하단 = (0,0). 아래 좌표는 pdfminer 텍스트 추출로 검증한 값.
  // P1 height = 841.68

  function drawOn(page: typeof p1, text: string, x: number, y: number, size = SIZE) {
    if (!text) return
    let cx = x
    for (const ch of text) {
      const code = ch.charCodeAt(0)
      let w: number
      if (code >= 0xAC00 && code <= 0xD7A3) w = size * 0.63
      else if (ch === ' ') w = size * 0.28
      else if (ch >= '0' && ch <= '9') w = size * 0.38
      else w = size * 0.33
      page.drawText(ch, { x: cx, y, size, font, color: black })
      cx += w
    }
  }

  function checkOn(page: typeof p1, x: number, y: number) {
    page.drawText('✔', { x, y, size: 10, font, color: black })
  }

  // ── 데이터 ──
  const deceasedName     = caseData.deceased_name || ''
  const deceasedPhone    = caseData.deceased_phone || ''
  const deceasedKakao    = (caseData as any).deceased_kakao || ''
  const delegatorName    = (d as any).delegator_name || ''
  const delegatorRelation = (d as any).delegator_relation || ''
  const delegatorPhone   = (d as any).delegator_phone || ''

  const today = new Date()
  const yyyy = String(today.getFullYear())
  const mm   = String(today.getMonth() + 1)
  const dd   = String(today.getDate())

  // ──────────────────────────────────────────
  // 페이지 1: 고인 정보 + 신청인 정보 + 체크박스
  // ──────────────────────────────────────────
  // 고인 계정 정보 (y 값은 pdfminer 기준: 685~695 → 입력값은 y=688)
  drawOn(p1, deceasedName,   220, 688)  // 고인 성명
  drawOn(p1, deceasedKakao,  220, 662)  // 카카오계정
  drawOn(p1, deceasedPhone,  220, 636)  // 휴대폰 번호

  // 신청인 정보 (y=556~566 → y=559)
  drawOn(p1, delegatorName,     220, 559)  // 신청인 성명
  drawOn(p1, delegatorRelation, 440, 559)  // 고인과의 관계 (같은 행 우측)
  drawOn(p1, delegatorPhone,    220, 533)  // 신청인 휴대폰

  // 체크박스 — "아니요, 계정 즉시 탈퇴" (y=273~285 → y=278)
  // "◼ 아니요, 계정 즉시 탈퇴  [    ]" 의 [ ] 위치: x≈527
  checkOn(p1, 527, 278)

  // 체크박스 — "아니요, 고인 톡 즉시 탈퇴" (y=63~74 → y=68)
  // "◼ 아니요, 고인 톡 즉시 탈퇴  [    ]" 의 [ ] 위치: x≈527
  checkOn(p1, 527, 68)

  // ──────────────────────────────────────────
  // 페이지 2: 개인정보 동의 + 날짜 + 서명
  // ──────────────────────────────────────────
  // "◼ 동의합니다  [    ]" 의 [ ] 위치: y=192~236 block → y≈212, x≈387
  checkOn(p2, 387, 212)

  // 날짜: 템플릿에 "년 월 일" 텍스트가 x=436~550에 이미 인쇄됨
  // 숫자를 각 한자 '년'/'월'/'일' 바로 앞에 기입
  // 년(x=436), 월(x=488), 일(x=532) → 각 숫자 텍스트 너비만큼 왼쪽에 배치
  const yyyyW = Array.from(yyyy).reduce((w, ch) => w + (ch >= '0' && ch <= '9' ? SIZE * 0.38 : SIZE * 0.33), 0)
  const mmW   = Array.from(mm).reduce((w, ch) => w + (ch >= '0' && ch <= '9' ? SIZE * 0.38 : SIZE * 0.33), 0)
  const ddW   = Array.from(dd).reduce((w, ch) => w + (ch >= '0' && ch <= '9' ? SIZE * 0.38 : SIZE * 0.33), 0)
  drawOn(p2, yyyy, 436 - yyyyW - 2, 163)
  drawOn(p2, mm,   488 - mmW - 2,   163)
  drawOn(p2, dd,   532 - ddW - 2,   163)

  // 신청인 이름: "신청인  :     이   름     (서명 또는 인)" at y=127~154
  // "이   름"(이름 라벨) 위에 흰 사각형으로 덮고 이름 기입
  p2.drawRectangle({ x: 390, y: 127, width: 120, height: 27, color: rgb(1, 1, 1) })
  drawOn(p2, delegatorName, 395, 136)

  const pdfBytes = await pdfDoc.save()
  const fileName = `카카오탈퇴요청서_${deceasedName || 'unknown'}_${caseId.slice(0, 8)}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
