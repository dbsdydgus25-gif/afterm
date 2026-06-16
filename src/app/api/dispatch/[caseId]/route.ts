import { NextRequest, NextResponse } from 'next/server'

// POST /api/dispatch/[caseId]
// 어드민 알림은 이메일(/api/admin/cases/[caseId]/notify)로만 처리
// SMS 발송 없음
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  return NextResponse.json({ success: true, message: '이메일 알림으로 대체됨' })
}
