// 김비서 — 매일 아침 8시 모닝 브리핑
// Vercel Cron: 0 23 * * * (UTC) = KST 08:00

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

const OWNER_EMAIL = 'afterm001@gmail.com'

const STATUS_LABEL: Record<string, string> = {
  submitted: '접수 완료',
  reviewing: '서류 검토 중',
  processing: '처리 중',
  completed: '처리 완료',
  cancelled: '취소',
}

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()
    const today = new Date()
    const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // 어제 신규 신청 건
    const { data: newCases } = await adminClient
      .from('cases')
      .select('id, deceased_name, status, payment_status, paid_amount, created_at, case_services(service_name)')
      .gte('created_at', yesterday.toISOString())
      .neq('status', 'draft')
      .order('created_at', { ascending: false })

    // 처리 중인 전체 케이스
    const { data: activeCases } = await adminClient
      .from('cases')
      .select('id, deceased_name, status, payment_status, created_at')
      .in('status', ['submitted', 'reviewing', 'processing'])
      .order('created_at', { ascending: true })

    // 미결제 케이스
    const { data: unpaidCases } = await adminClient
      .from('cases')
      .select('id, deceased_name, created_at')
      .eq('payment_status', 'pending')
      .neq('status', 'draft')

    // PROGRESS.md에서 오늘 할일 추출 (DB에 저장된 메모 활용)
    const { data: todoData } = await adminClient
      .from('secretary_notes')
      .select('content')
      .eq('type', 'tomorrow_todo')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const todoContent = todoData?.content || `• 카카오 알림톡 실 발송 테스트\n• 위임장 PDF 다운로드 버그 수정\n• 사망진단서 OCR 연동\n• 전체 신청 플로우 end-to-end 테스트`

    const newCasesHtml = (newCases && newCases.length > 0)
      ? newCases.map(c => {
          const services = (c.case_services as any[]).map(s => s.service_name).join(', ')
          const paid = c.payment_status === 'paid' ? `💳 결제완료 (${c.paid_amount?.toLocaleString()}원)` : '⏳ 미결제'
          return `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${c.deceased_name}님</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6B7280;">${services}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${paid}</td>
          </tr>`
        }).join('')
      : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#9CA3AF;">어제 신규 신청 없음</td></tr>`

    const activeCasesHtml = (activeCases && activeCases.length > 0)
      ? activeCases.map(c => {
          const statusLabel = STATUS_LABEL[c.status] || c.status
          const statusColor = c.status === 'submitted' ? '#2563EB' : c.status === 'processing' ? '#D97706' : '#6B7280'
          const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)
          return `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${c.deceased_name}님</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
              <span style="background:${statusColor}20;color:${statusColor};padding:2px 8px;border-radius:100px;font-size:12px;font-weight:700;">${statusLabel}</span>
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#9CA3AF;font-size:13px;">신청 ${days}일째</td>
          </tr>`
        }).join('')
      : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#9CA3AF;">진행 중인 케이스 없음</td></tr>`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#F4F6F9;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- 헤더 -->
    <div style="background:#1E3A8A;border-radius:16px 16px 0 0;padding:28px 32px;">
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 6px;">📅 ${todayStr}</p>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">안녕하세요, 대표님 👋</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:8px 0 0;">김비서입니다. 오늘의 업무 브리핑 드립니다.</p>
    </div>

    <!-- 오늘 할일 -->
    <div style="background:#fff;padding:24px 32px;border-left:4px solid #2563EB;margin-top:2px;">
      <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 14px;">✅ 오늘 할일 체크리스트</h2>
      <div style="font-size:14px;color:#374151;line-height:2;white-space:pre-line;">${todoContent}</div>
    </div>

    <!-- 신규 신청 -->
    <div style="background:#fff;padding:24px 32px;margin-top:2px;">
      <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 14px;">🆕 어제 신규 신청 (${newCases?.length || 0}건)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#F9FAFB;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;font-weight:600;">고인</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;font-weight:600;">신청 서비스</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;font-weight:600;">결제</th>
          </tr>
        </thead>
        <tbody>${newCasesHtml}</tbody>
      </table>
    </div>

    <!-- 진행 중 케이스 -->
    <div style="background:#fff;padding:24px 32px;margin-top:2px;">
      <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 14px;">📋 현재 진행 중 (${activeCases?.length || 0}건)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#F9FAFB;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">고인</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">상태</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">기간</th>
          </tr>
        </thead>
        <tbody>${activeCasesHtml}</tbody>
      </table>
    </div>

    ${(unpaidCases && unpaidCases.length > 0) ? `
    <!-- 미결제 경고 -->
    <div style="background:#FEF3C7;padding:20px 32px;margin-top:2px;border-left:4px solid #F59E0B;">
      <h2 style="font-size:15px;font-weight:800;color:#92400E;margin:0 0 8px;">⚠️ 미결제 케이스 (${unpaidCases.length}건)</h2>
      <p style="font-size:13px;color:#92400E;margin:0;">${unpaidCases.map(c => `${c.deceased_name}님`).join(', ')} — 확인이 필요합니다.</p>
    </div>
    ` : ''}

    <!-- 바로가기 -->
    <div style="background:#fff;padding:20px 32px;margin-top:2px;border-radius:0 0 16px 16px;">
      <a href="https://afterm.co.kr/admin" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">어드민 바로가기 →</a>
    </div>

    <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:16px;">김비서 · Afterm 비서 AI Agent</p>
  </div>
</body>
</html>`

    await sendEmail({
      subject: `[김비서] ${todayStr} 업무 브리핑 — 신규 ${newCases?.length || 0}건, 진행중 ${activeCases?.length || 0}건`,
      html,
    })

    return NextResponse.json({ ok: true, newCases: newCases?.length, activeCases: activeCases?.length })
  } catch (e: any) {
    console.error('[김비서 모닝브리핑]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function sendEmail({ subject, html }: { subject: string; html: string }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })
  await transporter.sendMail({
    from: `"김비서 🤖" <${process.env.GMAIL_USER}>`,
    to: OWNER_EMAIL,
    subject,
    html,
  })
}
