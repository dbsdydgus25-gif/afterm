import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = process.env.GMAIL_USER;
        const pass = process.env.GMAIL_APP_PASSWORD;

        if (!user || !pass) {
            console.warn('GMAIL_USER or GMAIL_APP_PASSWORD is missing.');
            return NextResponse.json({ success: true, message: 'Simulated success (Missing Credentials)' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass,
            },
        });

        // Send email to admin (GMAIL_USER) to notify about beta tester application
        const mailOptions = {
            from: `"AFTERM System" <${user}>`,
            to: user, // Send to the admin/configured gmail
            subject: `[AFTERM] 사용자로부터 AI 에이전트 GMAIL 베타 테스터 신청이 도착했습니다.`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563eb;">Gmail 연동 베타 테스터 신청 알림</h2>
          <p>새로운 사용자가 지원했습니다.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; font-size: 16px;"><strong>신청자 이메일:</strong> ${email}</p>
          </div>
          <p style="margin-top: 20px; color: #4b5563;">
            구글 클라우드 콘솔 (OAuth 동의 화면)에서 위 이메일을 테스트 사용자로 등록해 주세요.
          </p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Beta apply email API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
