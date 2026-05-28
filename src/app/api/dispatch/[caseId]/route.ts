import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServiceById } from '@/lib/services-catalog'
import nodemailer from 'nodemailer'

// POST /api/dispatch/[caseId] — 해지 요청 이메일 일괄 발송
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 신청건 + 서비스 목록 조회
    const { data: caseData } = await adminClient
      .from('cases')
      .select(`*, case_services(*), delegations(*), case_documents(*)`)
      .eq('id', caseId)
      .single()

    if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    if (caseData.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const services = caseData.case_services?.filter((s: any) => s.status === 'pending') || []

    if (services.length === 0) {
      return NextResponse.json({ message: '발송할 서비스가 없습니다' })
    }

    // 이메일 트랜스포터 설정 (Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const results = []

    for (const service of services) {
      try {
        // 해지 요청 이메일 본문 생성
        const emailBody = generateRequestEmail({
          serviceName: service.service_name,
          deceased: {
            name: caseData.deceased_name,
            birth: caseData.deceased_birth,
            death: caseData.deceased_death,
            phone: caseData.deceased_phone,
          },
          delegator: {
            name: caseData.delegations?.[0]?.delegator_name || '',
            relation: caseData.delegations?.[0]?.delegator_relation || '',
          },
          accountId: service.account_id,
          accountUnknown: service.account_unknown,
        })

        // 이메일 발송
        await transporter.sendMail({
          from: `"에프텀 AFTERM" <${process.env.GMAIL_USER}>`,
          to: service.contact_info,
          subject: `[고인 구독 해지 요청] ${caseData.deceased_name} 님 - ${service.service_name}`,
          html: emailBody,
          replyTo: process.env.GMAIL_USER,
        })

        // 발송 이력 기록
        await adminClient.from('dispatch_logs').insert({
          case_service_id: service.id,
          dispatch_type: 'email',
          recipient: service.contact_info,
          status: 'success',
          response_body: '이메일 발송 성공',
        })

        // 서비스 상태 업데이트
        await adminClient.from('case_services').update({
          status: 'dispatched',
          dispatched_at: new Date().toISOString(),
        }).eq('id', service.id)

        results.push({ serviceId: service.id, status: 'success' })
      } catch (err: any) {
        // 발송 실패 기록
        await adminClient.from('dispatch_logs').insert({
          case_service_id: service.id,
          dispatch_type: 'email',
          recipient: service.contact_info,
          status: 'failed',
          error_message: err.message,
        })

        results.push({ serviceId: service.id, status: 'failed', error: err.message })
      }
    }

    // 케이스 상태를 processing으로 업데이트
    await adminClient.from('cases').update({ status: 'processing' }).eq('id', caseId)

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 해지 요청 이메일 HTML 본문 생성
function generateRequestEmail(data: {
  serviceName: string
  deceased: { name: string; birth: string; death: string; phone?: string }
  delegator: { name: string; relation: string }
  accountId?: string
  accountUnknown: boolean
}): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #1a1a2e; line-height: 1.6; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
  .header { border-bottom: 2px solid #3B6FE8; padding-bottom: 20px; margin-bottom: 28px; }
  .logo { font-size: 22px; font-weight: 900; color: #1a1a2e; }
  .logo span { color: #3B6FE8; }
  h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; }
  .info-box { background: #f7f8fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .info-row { display: flex; gap: 12px; margin-bottom: 8px; }
  .info-label { font-weight: 700; min-width: 100px; color: #4a5568; }
  .highlight { background: #eef3fd; border-left: 3px solid #3B6FE8; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #9aa3b2; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">after<span>m</span></div>
    <div style="font-size:13px;color:#9aa3b2;margin-top:4px;">디지털 유산 행정 대행 서비스</div>
  </div>

  <h1>고인 구독 서비스 해지 요청</h1>
  <p style="color:#4a5568;">안녕하세요. 에프텀(Afterm)은 유가족을 대신하여 고인의 구독 서비스 해지를 대행하는 서비스입니다.</p>
  <p>아래 내용에 따라 해지 처리를 부탁드립니다.</p>

  <div class="info-box">
    <h3 style="margin:0 0 16px;font-size:15px;">📋 고인 정보</h3>
    <div class="info-row"><span class="info-label">성명</span><span>${data.deceased.name}</span></div>
    <div class="info-row"><span class="info-label">생년월일</span><span>${data.deceased.birth}</span></div>
    <div class="info-row"><span class="info-label">사망일</span><span>${data.deceased.death}</span></div>
    ${data.deceased.phone ? `<div class="info-row"><span class="info-label">전화번호</span><span>${data.deceased.phone}</span></div>` : ''}
    <div class="info-row"><span class="info-label">계정 아이디</span><span>${data.accountUnknown ? '확인 불가 (이름/생년월일/연락처로 조회 요청)' : (data.accountId || '정보 없음')}</span></div>
  </div>

  <div class="info-box">
    <h3 style="margin:0 0 16px;font-size:15px;">👤 신청인 (유족) 정보</h3>
    <div class="info-row"><span class="info-label">성명</span><span>${data.delegator.name}</span></div>
    <div class="info-row"><span class="info-label">관계</span><span>${data.delegator.relation}</span></div>
  </div>

  <div class="highlight">
    <strong>요청 사항:</strong> ${data.serviceName} 서비스에서 위 고인의 계정 및 구독을 해지해 주시기 바랍니다.
    사망진단서, 가족관계증명서, 위임장 사본은 추가 요청 시 제공 가능합니다.
  </div>

  <p>처리 완료 후 에프텀 이메일(${process.env.GMAIL_USER})로 결과를 회신해 주시면 감사하겠습니다.</p>

  <div class="footer">
    주식회사 에프텀 AFTERM | 디지털 유산 행정 대행 서비스<br/>
    이메일: ${process.env.GMAIL_USER}<br/>
    본 요청은 유가족의 합법적 위임에 의해 발송되었습니다.
  </div>
</div>
</body>
</html>
  `
}
