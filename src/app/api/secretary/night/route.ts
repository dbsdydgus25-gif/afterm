// 김비서 — 매일 밤 11시 야간 업무 정리
// Vercel Cron: 0 14 * * * (UTC) = KST 23:00

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

const OWNER_EMAIL = 'afterm001@gmail.com'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 오늘 신규 신청
    const { data: todayCases } = await adminClient
      .from('cases')
      .select('id, deceased_name, status, payment_status, paid_amount, created_at, case_services(service_name), delegations(delegator_name, delegator_phone)')
      .gte('created_at', today.toISOString())
      .neq('status', 'draft')
      .order('created_at', { ascending: false })

    // 오늘 결제 완료
    const { data: todayPayments } = await adminClient
      .from('cases')
      .select('id, deceased_name, paid_amount, paid_at')
      .eq('payment_status', 'paid')
      .gte('paid_at', today.toISOString())

    // 오늘 환불
    const { data: todayRefunds } = await adminClient
      .from('cases')
      .select('id, deceased_name, paid_amount, refunded_at')
      .eq('payment_status', 'refunded')
      .gte('refunded_at', today.toISOString())

    const todayRevenue = todayPayments?.reduce((sum, c) => sum + (c.paid_amount || 0), 0) || 0
    const todayRefundAmount = todayRefunds?.reduce((sum, c) => sum + (c.paid_amount || 0), 0) || 0
    const netRevenue = todayRevenue - todayRefundAmount

    const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

    const casesHtml = (todayCases && todayCases.length > 0)
      ? todayCases.map(c => {
          const services = (c.case_services as any[]).map(s => s.service_name).join(', ')
          const delegation = (c.delegations as any[])[0]
          const time = new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          return `
          <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:800;color:#111827;font-size:15px;">${c.deceased_name}님</span>
              <span style="font-size:12px;color:#9CA3AF;">${time} 접수</span>
            </div>
            <p style="font-size:13px;color:#6B7280;margin:4px 0;">신청인: ${delegation?.delegator_name || '-'} (${delegation?.delegator_phone || '-'})</p>
            <p style="font-size:13px;color:#374151;margin:4px 0;">서비스: ${services}</p>
            <p style="font-size:13px;margin:4px 0;">
              ${c.payment_status === 'paid'
                ? `<span style="background:#DBEAFE;color:#1D4ED8;padding:2px 8px;border-radius:100px;font-size:12px;font-weight:700;">💳 결제완료 ${c.paid_amount?.toLocaleString()}원</span>`
                : `<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:100px;font-size:12px;font-weight:700;">⏳ 미결제</span>`
              }
            </p>
          </div>`
        }).join('')
      : `<p style="color:#9CA3AF;text-align:center;padding:20px;">오늘 신규 신청 없음</p>`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#F4F6F9;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#1E3A8A,#1E40AF);border-radius:16px 16px 0 0;padding:28px 32px;">
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 4px;">🌙 ${todayStr} 야간 보고</p>
      <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0;">오늘 하루 업무 정리입니다</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:8px 0 0;">수고 많으셨습니다, 대표님.</p>
    </div>

    <!-- 오늘 매출 요약 -->
    <div style="background:#fff;padding:24px 32px;margin-top:2px;display:flex;gap:0;">
      <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 16px;">💰 오늘 매출 요약</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div style="background:#EFF6FF;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:12px;color:#2563EB;margin:0 0 6px;font-weight:600;">총 결제</p>
          <p style="font-size:18px;font-weight:800;color:#1D4ED8;margin:0;">${todayRevenue.toLocaleString()}원</p>
        </div>
        <div style="background:#FFF5F5;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:12px;color:#DC2626;margin:0 0 6px;font-weight:600;">환불</p>
          <p style="font-size:18px;font-weight:800;color:#DC2626;margin:0;">${todayRefundAmount.toLocaleString()}원</p>
        </div>
        <div style="background:#F0FDF4;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:12px;color:#16A34A;margin:0 0 6px;font-weight:600;">순 매출</p>
          <p style="font-size:18px;font-weight:800;color:#15803D;margin:0;">${netRevenue.toLocaleString()}원</p>
        </div>
      </div>
    </div>

    <!-- 오늘 신규 신청 -->
    <div style="background:#fff;padding:24px 32px;margin-top:2px;">
      <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 16px;">
        📥 오늘 신규 신청 (${todayCases?.length || 0}건)
      </h2>
      ${casesHtml}
    </div>

    <!-- 내일 준비사항 (PROGRESS.md 기반) -->
    <div style="background:#F0F7FF;padding:24px 32px;margin-top:2px;border-radius:0 0 16px 16px;border-left:4px solid #2563EB;">
      <h2 style="font-size:15px;font-weight:800;color:#1D4ED8;margin:0 0 12px;">📌 내일 주요 업무</h2>
      <div style="font-size:14px;color:#1E40AF;line-height:1.8;">
        내일 아침 8시 모닝 브리핑에서 상세 체크리스트를 확인하세요.
      </div>
      <a href="https://afterm.co.kr/admin" style="display:inline-block;margin-top:16px;background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;">어드민 확인하기 →</a>
    </div>

    <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:16px;">김비서 · Afterm 비서 AI Agent · 매일 밤 11시 자동 발송</p>
  </div>
</body>
</html>`

    await sendEmail({
      subject: `[김비서] ${todayStr} 야간 보고 — 신규 ${todayCases?.length || 0}건 / 순매출 ${netRevenue.toLocaleString()}원`,
      html,
    })

    return NextResponse.json({ ok: true, todayCases: todayCases?.length, revenue: netRevenue })
  } catch (e: any) {
    console.error('[김비서 야간보고]', e)
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
