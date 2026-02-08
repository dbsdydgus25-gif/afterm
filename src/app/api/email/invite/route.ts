
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/nodemailer';

export async function POST(req: Request) {
    try {
        const { email, spaceTitle, token, inviterName } = await req.json();

        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://afterm.co.kr'}/invite/${token}`;

        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h1 style="color: #1e293b; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
          ${inviterName}님께서 추모 공간에 초대하셨습니다.
        </h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          '${spaceTitle}' 공간에서 함께 소중한 추억을 나눠보세요.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            초대 수락하기
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px; text-align: center;">
          이 초대장은 7일간 유효합니다.
        </p>
      </div>
    `;

        await sendEmail(email, `[AFTERM] '${spaceTitle}' 공간에 초대받으셨습니다.`, html);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Invite email error:", error);
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }
}
