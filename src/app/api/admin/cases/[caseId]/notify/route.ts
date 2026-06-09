import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

// POST /api/admin/cases/[caseId]/notify
// 새 케이스 접수 또는 서류 업로드 시 어드민에게 이메일 알림을 발송합니다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params
  const body = await req.json().catch(() => ({}))
  const { type = 'new_case' } = body // 'new_case' | 'doc_uploaded' | 'package_ready'

  try {
    const adminClient = createAdminClient()

    const { data: caseData } = await adminClient
      .from('cases')
      .select(`*, case_services(*), delegations(*), case_documents(*)`)
      .eq('id', caseId)
      .single()

    if (!caseData) return NextResponse.json({ error: '케이스 없음' }, { status: 404 })

    const delegatorName = caseData.delegations?.[0]?.delegator_name || '신청인'
    const services = caseData.case_services || []
    const docs = caseData.case_documents || []
    const caseNo = `CASE-${caseId.slice(0, 8).toUpperCase()}`
    const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr'}/admin/cases/${caseId}`

    // 알림 유형별 제목/내용 설정
    const templates = {
      new_case: {
        subject: `[에프텀] 🆕 새 케이스 접수 — ${caseData.deceased_name}님 (${delegatorName} 신청)`,
        title: '새 케이스가 접수되었습니다',
        color: '#2563EB',
        icon: '📋',
        body: `
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">케이스 번호</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${caseNo}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">신청인</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${delegatorName}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">고인 성명</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${caseData.deceased_name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">신청 서비스</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${services.map((s: any) => s.service_name).join(', ')}</td></tr>
          <tr><td style="padding:8px 0"><span style="color:#9ca3af;font-size:13px">접수 시각</span></td><td style="padding:8px 0;font-weight:700;font-size:13px">${new Date(caseData.created_at).toLocaleString('ko-KR')}</td></tr>
        `,
      },
      doc_uploaded: {
        subject: `[에프텀] 📄 서류 업로드 — ${caseData.deceased_name}님 케이스 (${docs.length}/3종)`,
        title: '서류가 업로드되었습니다',
        color: '#7C3AED',
        icon: '📄',
        body: `
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">케이스 번호</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${caseNo}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">고인 성명</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${caseData.deceased_name}</td></tr>
          <tr><td style="padding:8px 0"><span style="color:#9ca3af;font-size:13px">서류 현황</span></td><td style="padding:8px 0;font-weight:700;font-size:13px">${docs.length}종 제출 완료 / 전체 3종</td></tr>
        `,
      },
      package_ready: {
        subject: `[에프텀] 📦 발송 패키지 준비 완료 — ${caseData.deceased_name}님`,
        title: '발송 패키지가 준비되었습니다',
        color: '#059669',
        icon: '📦',
        body: `
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">케이스 번호</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${caseNo}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#9ca3af;font-size:13px">고인 성명</span></td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:13px">${caseData.deceased_name}</td></tr>
          <tr><td style="padding:8px 0"><span style="color:#9ca3af;font-size:13px">서비스 수</span></td><td style="padding:8px 0;font-weight:700;font-size:13px">${services.length}개 신청서 초안 완성</td></tr>
        `,
      },
    }

    const tpl = templates[type as keyof typeof templates] || templates.new_case

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Apple SD Gothic Neo',Pretendard,sans-serif">
  <table width="100%" style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <tr><td style="background:${tpl.color};padding:28px 32px">
      <div style="font-size:28px;margin-bottom:8px">${tpl.icon}</div>
      <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.02em">${tpl.title}</div>
      <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">에프텀(Afterm) 어드민 알림</div>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <table width="100%" style="border-collapse:collapse">
        ${tpl.body}
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 28px">
      <a href="${adminUrl}" style="display:inline-block;background:${tpl.color};color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px">
        어드민에서 확인하기 →
      </a>
    </td></tr>
    <tr><td style="background:#f8f9fb;padding:16px 32px;color:#9ca3af;font-size:12px;text-align:center">
      © Afterm | afterm.co.kr
    </td></tr>
  </table>
</body>
</html>`

    // Gmail SMTP 발송
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"에프텀 시스템" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAILS || 'afterm001@gmail.com',
      subject: tpl.subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[notify] 이메일 발송 오류:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
