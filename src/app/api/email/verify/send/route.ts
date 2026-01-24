import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Use Admin Client to bypass RLS for verification codes (needed for signup)
        const supabaseAdmin = createAdminClient();

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const identifier = `email:${email}`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // Delete previous codes
        await supabaseAdmin.from('verification_codes').delete().eq('phone', identifier);

        // Insert new code
        const { error: dbError } = await supabaseAdmin.from('verification_codes').insert({
            phone: identifier,
            code: code,
            expires_at: expiresAt
        });

        if (dbError) {
            console.error('DB Error:', dbError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Send Email
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailPass) {
            return NextResponse.json({ success: false, error: 'Server misconfiguration (Missing Gmail Creds)' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        const mailOptions = {
            from: `"AFTERM Security" <${gmailUser}>`,
            to: email,
            subject: `[AFTERM] 이메일 인증번호`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563eb;">이메일 인증</h2>
          <p>휴대폰 번호 변경을 위해 본인 확인이 필요합니다.</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${code}</span>
          </div>
          <p>위 인증번호를 입력창에 입력해주세요. (10분 유효)</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Email verification error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
