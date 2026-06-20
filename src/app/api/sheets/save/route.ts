// ============================================================
// POST /api/sheets/save
// 신청 완료 시 구글 시트에 케이스 정보 자동 저장
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { caseId, deceasedInfo, selectedServices, delegation, submittedAt, paidAmount, paymentId } = body

  // 환경변수 확인
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID

  if (!credentialsJson || !sheetId) {
    console.warn('[sheets] 환경변수 미설정 — 구글 시트 저장 스킵')
    return NextResponse.json({ success: false, reason: 'env_not_set' })
  }

  try {
    const credentials = JSON.parse(credentialsJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // case_services DB 형식 또는 store 형식 모두 지원
    const rows = (selectedServices || []).map((svc: any) => {
      // DB 형식: service_name, service_category, account_id, contact_info, dispatch_type
      // store 형식: name, id, track, fieldValues
      const isDbFormat = !!svc.service_name
      const platformName = isDbFormat ? svc.service_name : (svc.name || '')
      const trackRaw = isDbFormat ? svc.dispatch_type : svc.track
      const trackLabel = trackRaw === 'memorialize' || trackRaw === 'memorial' ? '추모계정' : '계정삭제'
      const accountInfo = isDbFormat
        ? (svc.account_id || svc.contact_info || '')
        : (() => { const f = svc.fieldValues || {}; return f.account_username || f.account_email || f.deceased_account_email || f.deceased_phone || '' })()
      const serviceId = isDbFormat ? svc.service_category?.toLowerCase() : svc.id

      return [
        submittedAt || new Date().toISOString(),   // A: 접수일시
        caseId?.slice(0, 8) || '',                  // B: 케이스ID
        deceasedInfo?.name || '',                   // C: 고인 성명
        deceasedInfo?.birthDate || '',              // D: 고인 생년월일
        deceasedInfo?.deathDate || '',              // E: 고인 사망일
        deceasedInfo?.phone || '',                  // F: 고인 전화번호
        delegation?.delegatorName || delegation?.delegator_name || '',   // G: 신청인 성명
        delegation?.delegatorRelation || delegation?.delegator_relation || '', // H: 관계
        platformName,                               // I: 플랫폼
        trackLabel,                                 // J: 트랙
        (serviceId === 'instagram' || serviceId === 'kakaotalk') && trackRaw !== 'memorialize'
          ? '직접신청필요' : '에프텀대행',            // K: 대행가능여부
        accountInfo,                                // L: 계정ID/연락처
        '',                                         // M: 프로필URL
        delegation?.delegatorPhone || delegation?.delegator_phone || '', // N: 신청인 전화
        '',                                         // O: 통신사
        '',                                         // P: 환불계좌
        paidAmount ? Number(paidAmount).toLocaleString() + '원' : '', // Q: 결제금액
        paymentId || '',                            // R: PG결제ID
        '',                                         // S: 처리 상태
        '',                                         // T: 처리 완료일
        '',                                         // U: 메모
      ]
    })

    // 헤더가 없으면 추가
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:S1',
    })

    if (!existingData.data.values || existingData.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'A1:S1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            '접수일시', '케이스ID', '고인성명', '고인생년월일', '고인사망일', '고인전화번호',
            '신청인성명', '고인과의관계', '플랫폼', '트랙(삭제/추모)', '대행가능여부',
            '계정ID/이메일/전화', '프로필URL', '신청인연락처', '통신사', '환불계좌',
            '결제금액', 'PG결제ID', '처리상태', '처리완료일', '메모'
          ]]
        }
      })
    }

    // 데이터 행 추가
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:S',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    })

    console.log(`[sheets] ${rows.length}개 행 저장 완료 — 케이스 ${caseId?.slice(0, 8)}`)
    return NextResponse.json({ success: true, rowsAdded: rows.length })

  } catch (error) {
    console.error('[sheets] 저장 실패:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
