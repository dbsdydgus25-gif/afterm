'use server';

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Admin Client for secure access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function notifyVaultOwner(vaultId: string) {
    if (!vaultId) return { success: false, error: "Vault ID missing" };

    try {
        console.log(`[NotifyVaultView] Starting notification for vault: ${vaultId}`);

        // 1. Fetch Vault Item to get user_id
        const { data: vaultItem, error: vaultError } = await supabaseAdmin
            .from('vault_items')
            .select('user_id, platform_name')
            .eq('id', vaultId)
            .single();

        if (vaultError || !vaultItem) {
            console.error("[NotifyVaultView] Vault find error:", vaultError);
            return { success: false, error: "Vault not found" };
        }

        // 2. Fetch User Email (Owner)
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(vaultItem.user_id);

        if (userError || !user || !user.email) {
            console.error("[NotifyVaultView] User fetch error:", userError);
            return { success: false, error: "User not found" };
        }

        const ownerEmail = user.email;
        const ownerName = user.user_metadata?.full_name || '사용자';

        // 3. Check Email Configuration
        const gmailUser = process.env.GMAIL_USER || 'afterm001@gmail.com';
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (!gmailPass) {
            console.error("[NotifyVaultView] Missing GMAIL_APP_PASSWORD");
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
            to: ownerEmail,
            subject: `[AFTERM] 디지털 유산 열람 시도 알림`,
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                    <div style="background-color: #000; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">AFTERM</h1>
                    </div>
                    
                    <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #111; margin-top: 0;">⚠️ 디지털 유산 열람 시도</h2>
                        <p style="font-size: 16px;">
                            안녕하세요, <strong>${ownerName}</strong>님.
                        </p>
                        <p>
                            수신인이 귀하의 디지털 유산 정보(ID: <span style="font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">${vaultId.slice(0, 8)}...</span>)의 열람을 시도하고 있습니다.
                        </p>
                         <p>
                            대상 플랫폼: <strong>${vaultItem.platform_name || 'N/A'}</strong>
                        </p>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-weight: bold;">
                                ✓ 수신인이 "확인" 버튼을 눌렀기 때문에 이 메일이 발송되었습니다.<br/>
                                ✓ 만약 귀하에게 문제가 없다면, 즉시 보안 조치를 취하시거나 서비스에 접속하여 확인해주세요.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://www.afterm.co.kr" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                AFTERM 서비스로 이동
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                            * 이 알림은 수신인이 열람 절차를 시작했을 때 발송됩니다.<br/>
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
        console.log(`[NotifyVaultView] Email sent to ${ownerEmail}`);

        return { success: true };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error("[NotifyVaultView] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
