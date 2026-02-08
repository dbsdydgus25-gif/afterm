
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/nodemailer';

export async function POST(req: Request) {
  try {
    const { email, spaceTitle, token, inviterName } = await req.json();

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://afterm.co.kr'}/invite/${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-bottom: 24px; text-align: center; line-height: 1.4;">
          ${inviterName}님이<br>디지털 추모 공간에 초대했습니다.
        </h1>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 32px; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">추모 공간 이름</p>
          <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0;">${spaceTitle}</p>
        </div>

        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
          아래 버튼을 눌러 공간에 참여하고,<br>소중한 추억을 함께 나누어 보세요.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${inviteLink}" style="background-color: #000000; color: #ffffff; padding: 16px 32px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            참여하러 가기
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
          이 초대장은 7일간 유효합니다.<br>
          버튼이 작동하지 않으면 아래 링크를 복사해서 주소창에 붙여넣으세요.<br>
          <a href="${inviteLink}" style="color: #64748b; text-decoration: underline; word-break: break-all;">${inviteLink}</a>
        </p>
      </div>
    `;

    await sendEmail(email, `[AFTERM] ${inviterName}님이 디지털 추모 공간에 초대했습니다.`, html);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Invite email error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send email',
      details: JSON.stringify(error)
    }, { status: 500 });
  }
}
