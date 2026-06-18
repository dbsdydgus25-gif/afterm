// ============================================================
// PATCH /api/admin/cases/[caseId]/status
// 케이스 상태 변경 → 고객 알림톡 + 구글시트 자동 업데이트
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { google } from 'googleapis'
import { sendKakao } from '@/lib/kakao/sendKakao'

export const runtime = 'nodejs'

const STATUS_NOTIFY_MAP: Record<string, string> = {
  reviewing:  'submitted',
  processing: 'processing',
  completed:  'completed',
}

const STATUS_LABEL: Record<string, string> = {
  submitted:  '접수 완료',
  reviewing:  '서류 검토 중',
  processing: '처리 중',
  completed:  '처리 완료',
  cancelled:  '취소',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (session?.value !== 'authorized') {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { caseId } = await params
  const { status } = await req.json()
  if (!status) return NextResponse.json({ error: '상태값 필요' }, { status: 400 })

  const adminClient = createAdminClient()

  // 케이스 + 고객 정보 조회
  const { data: caseData, error: fetchErr } = await adminClient
    .from('cases')
    .select('*, delegations(*), case_services(*)')
    .eq('id', caseId)
    .single()

  if (fetchErr || !caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

  // 상태 업데이트
  const { error: updateErr } = await adminClient
    .from('cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', caseId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // 고객 연락처
  const { data: { user } } = await adminClient.auth.admin.getUserById(caseData.user_id)
  const { data: profileRow } = await adminClient
    .from('profiles')
    .select('name, phone')
    .eq('id', caseData.user_id)
    .single()

  const delegation = caseData.delegations?.[0]
  const customerPhone = caseData.delegator_phone || delegation?.delegator_phone || profileRow?.phone || user?.phone || ''
  const customerName = delegation?.delegator_name || profileRow?.name || user?.user_metadata?.full_name || ''
  const customerEmail = user?.email || ''
  const deceasedName = caseData.deceased_name || ''
  const services = (caseData.case_services || [])
    .map((s: any) => s.service_name || s.service_id)
    .join(', ')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr'
  const notifyType = STATUS_NOTIFY_MAP[status]

  // 병렬: 알림톡 + 이메일 + 구글시트
  await Promise.allSettled([
    notifyType && customerPhone
      ? sendKakao({ phone: customerPhone, caseId, type: notifyType as any, requesterName: customerName, deceasedName, services })
      : Promise.resolve(),
    notifyType && customerEmail
      ? fetch(`${siteUrl}/api/notify/email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toEmail: customerEmail, caseId, type: notifyType, requesterName: customerName, deceasedName, services }),
        }).catch(() => {})
      : Promise.resolve(),
    updateGoogleSheetStatus(caseId, status),
  ])

  return NextResponse.json({ ok: true, status, label: STATUS_LABEL[status] || status })
}


async function updateGoogleSheetStatus(caseId: string, status: string) {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!credJson || !sheetId) return

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credJson),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    const shortId = caseId.slice(0, 8)

    const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'B:B' })
    const rows = res.data.values || []
    const matchedRows: number[] = []
    rows.forEach((row, idx) => {
      if (row[0]?.toString().startsWith(shortId)) matchedRows.push(idx + 1)
    })
    if (matchedRows.length === 0) return

    const statusLabel = STATUS_LABEL[status] || status
    const completedAt = status === 'completed' ? new Date().toLocaleDateString('ko-KR') : ''

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: matchedRows.map(n => ({ range: `Q${n}:R${n}`, values: [[statusLabel, completedAt]] })),
      },
    })
  } catch (e) { console.error('[구글시트] 업데이트 실패:', e) }
}
