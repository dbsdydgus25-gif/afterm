import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

function makeHtml(subject: string, title: string, bodyHtml: string, color = '#2563EB') {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif">
<table width="100%" style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <tr><td style="background:${color};padding:28px 32px">
    <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.02em">${title}</div>
    <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">에프텀(Afterm)</div>
  </td></tr>
  <tr><td style="padding:24px 32px 28px">
    ${bodyHtml}
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:16px 32px;color:#9ca3af;font-size:12px;text-align:center">
    문의: afterm001@gmail.com | © Afterm
  </td></tr>
</table>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { caseId, type, toEmail, requesterName, deceasedName: rawDeceasedName, services, amount, refundReason } = await req.json()

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ success: false, reason: 'gmail_not_set' })
    }

    // 이메일 주소가 없으면 DB에서 조회
    let email = toEmail
    let deceasedName = rawDeceasedName
    if ((!email || !deceasedName) && caseId) {
      const adminClient = createAdminClient()
      const { data: caseData } = await adminClient
        .from('cases')
        .select('deceased_name, user_id')
        .eq('id', caseId)
        .single()
      if (caseData) {
        if (!deceasedName) deceasedName = caseData.deceased_name
        if (!email && caseData.user_id) {
          const { data: { user } } = await adminClient.auth.admin.getUserById(caseData.user_id)
          email = user?.email
        }
      }
    }

    if (!email) return NextResponse.json({ success: false, reason: 'no_email' })

    const caseNo = caseId ? `#${caseId.slice(0, 8).toUpperCase()}` : ''

    const templates: Record<string, { subject: string; title: string; color: string; body: string }> = {
      submitted: {
        subject: `[에프텀] 신청이 접수되었습니다 ${caseNo}`,
        title: '✅ 신청이 접수되었습니다',
        color: '#2563EB',
        body: `<p style="color:#374151;font-size:15px;line-height:1.8">
          <b>${requesterName || '고객'}님</b>, 신청이 정상 접수되었습니다.<br><br>
          고인: <b>${deceasedName || '-'}</b><br>
          신청 서비스: <b>${services || '-'}</b><br>
          접수번호: <b>${caseNo}</b><br><br>
          담당자 검토 후 영업일 기준 1~2일 내 연락드립니다.<br>
          진행 현황은 에프텀 앱에서 확인하실 수 있습니다.
        </p>`,
      },
      payment: {
        subject: `[에프텀] 결제가 완료되었습니다 ${caseNo}`,
        title: '💳 결제 완료',
        color: '#2563EB',
        body: `<p style="color:#374151;font-size:15px;line-height:1.8">
          <b>${requesterName || '고객'}님</b>, 결제가 완료되었습니다.<br><br>
          결제 금액: <b>${amount ? amount + '원' : '-'}</b><br>
          신청 서비스: <b>${services || '-'}</b><br>
          접수번호: <b>${caseNo}</b><br><br>
          서류 검토 후 처리를 시작합니다. 평균 1주일 이내 완료됩니다.
        </p>`,
      },
      processing: {
        subject: `[에프텀] 서비스 처리가 시작되었습니다 ${caseNo}`,
        title: '⚙️ 처리 시작',
        color: '#7C3AED',
        body: `<p style="color:#374151;font-size:15px;line-height:1.8">
          <b>${requesterName || '고객'}님</b>,<br>
          <b>${deceasedName || '-'}</b>님 관련 서비스 처리가 시작되었습니다.<br><br>
          각 플랫폼에 신청서를 제출하였습니다.<br>
          플랫폼 처리 결과를 기다리고 있습니다.
        </p>`,
      },
      completed: {
        subject: `[에프텀] 서비스가 완료되었습니다 ${caseNo}`,
        title: '🎉 처리 완료',
        color: '#059669',
        body: `<p style="color:#374151;font-size:15px;line-height:1.8">
          <b>${requesterName || '고객'}님</b>,<br>
          <b>${deceasedName || '-'}</b>님 관련 모든 서비스 처리가 완료되었습니다.<br><br>
          자세한 내용은 에프텀 앱에서 확인해 주세요.
        </p>`,
      },
      refund: {
        subject: `[에프텀] 환불이 완료되었습니다 ${caseNo}`,
        title: '💰 환불 완료',
        color: '#DC2626',
        body: `<p style="color:#374151;font-size:15px;line-height:1.8">
          <b>${requesterName || '고객'}님</b>, 환불 처리가 완료되었습니다.<br><br>
          환불 금액: <b>${amount ? amount + '원' : '-'}</b><br>
          환불 사유: <b>${refundReason || '관리자 처리'}</b><br><br>
          영업일 기준 3~5일 내 카드사에서 취소됩니다.<br>
          문의: afterm001@gmail.com
        </p>`,
      },
    }

    const tpl = templates[type] || templates.submitted
    const html = makeHtml(tpl.subject, tpl.title, tpl.body, tpl.color)

    await transporter.sendMail({
      from: `"에프텀" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: tpl.subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[이메일 알림] 오류:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
