'use server';

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Admin Client for secure access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function notifySenderOfView(messageId: string) {
    if (!messageId) return { success: false, error: "Message ID missing" };

    try {
        console.log(`[NotifyView] Starting notification for message: ${messageId}`);

        // 1. Fetch Message to get user_id & recipient info
        const { data: message, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('user_id, content')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            console.error("[NotifyView] Message find error:", msgError);
            return { success: false, error: "Message not found" };
        }

        // 2. Fetch User Email (Sender)
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(message.user_id);

        if (userError || !user || !user.email) {
            console.error("[NotifyView] User fetch error:", userError);
            return { success: false, error: "User not found" };
        }

        const senderEmail = user.email;
        const senderName = user.user_metadata?.full_name || '사용자';

        // 3. Check Email Configuration
        const gmailUser = process.env.GMAIL_USER || 'afterm001@gmail.com'; // Default or Env
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (!gmailPass) {
            console.error("[NotifyView] Missing GMAIL_APP_PASSWORD");
            return { success: false, error: "Server email config missing" };
        }

        // 4. Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        const mailOptions = {
            from: `"AFTERM Security" <${gmailUser}>`,
            to: senderEmail,
            subject: `[AFTERM] 누군가 당신의 메시지를 확인하고 있습니다.`,
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                    <div style="background-color: #000; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">AFTERM</h1>
                    </div>
                    
                    <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #111; margin-top: 0;">알림: 메시지 열람 감지</h2>
                        <p style="font-size: 16px;">
                            안녕하세요, <strong>${senderName}</strong>님.
                        </p>
                        <p>
                            방금 누군가가 당신이 남긴 메시지(ID: <span style="font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">${messageId.slice(0, 8)}...</span>)에 접근했습니다.
                        </p>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-weight: bold;">
                                본인이 아닌 경우, 또는 아직 생존해 계시다면 아래 버튼을 눌러 상태를 업데이트해주세요.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://www.afterm.co.kr" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                열람 중단 (서비스로 이동)
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                            * 이 알림은 수신인 페이지에 접근이 발생할 때마다 발송됩니다.<br/>
                            * 본 알림은 자동 발송 시스템에 의해 전송되었습니다.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
                        &copy; 2026 AFTERM. All rights reserved.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[NotifyView] Email sent to ${senderEmail}`);

        return { success: true };

    } catch (err: any) {
        console.error("[NotifyView] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
