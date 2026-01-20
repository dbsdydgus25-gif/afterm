import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.warn('GMAIL_USER or GMAIL_APP_PASSWORD is missing. Skipping real email send.');
      return NextResponse.json({ success: true, message: 'Simulated success (Missing Credentials)' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"AFTERM" <${user}>`,
      to: email,
      subject: `${name}님, AFTERM에 오신 것을 환영합니다.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #2563eb;">반갑습니다, ${name}님!</h1>
          <p>소중한 사람들을 위한 마지막 준비, <strong>AFTERM</strong>과 함께 해주셔서 감사합니다.</p>
          <p>
            AFTERM은 당신이 남긴 소중한 메시지와 기억들을 안전하게 보관하고,<br/>
            지정된 시점에 사랑하는 사람들에게 가장 따뜻한 방식으로 전달합니다.
          </p>
          
          <h3 style="color: #4b5563; margin-top: 30px;">지금 바로 시작해보세요:</h3>
          <ul style="line-height: 1.6;">
            <li>💌 <strong>메시지 작성하기</strong>: 전하고 싶은 이야기를 텍스트, 사진으로 남겨보세요.</li>
            <li>👥 <strong>수신인 지정</strong>: 메시지를 받을 소중한 분을 미리 지정하세요.</li>
            <li>🕊️ <strong>추모관 생성</strong> (Pro): 나만의 온라인 추모 공간을 미리 디자인해보세요.</li>
          </ul>

          <div style="margin-top: 40px; padding: 20px; background-color: #f3f4f6; border-radius: 10px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              당신의 이야기는 계속 기억됩니다.<br/>
              - AFTERM 팀 드림
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
