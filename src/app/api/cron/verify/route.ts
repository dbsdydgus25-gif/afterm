import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { VerificationConfig, getTargetTime } from '@/lib/verificationConfig';
import nodemailer from 'nodemailer';

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Email Transporter (Reuse)
const gmailUser = process.env.GMAIL_USER || 'afterm001@gmail.com';
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
});

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET() {
    try {
        const now = new Date();
        const results = { stage3_unlocked: 0, errors: [] as string[] };

        // --- Stage 2 -> Stage 3 (48 Hours Passed, Unlock Message) ---
        const { data: stage2Messages, error: err2 } = await supabaseAdmin
            .from('messages')
            .select('id, stage2_sent_at, user_id, recipient_email')
            .eq('absence_check_stage', 2)
            .is('stage3_sent_at', null); // Not yet processed

        if (err2) {
            console.error("Failed to fetch stage 2 messages:", err2);
            throw err2;
        }

        console.log(`[Cron] Found ${stage2Messages?.length || 0} messages in stage 2`);

        for (const msg of stage2Messages || []) {
            const stage2Time = new Date(msg.stage2_sent_at);
            const hoursPassed = (now.getTime() - stage2Time.getTime()) / (1000 * 60 * 60);

            // 48 hours = 48 hours
            if (hoursPassed >= 48) {
                console.log(`[Cron] Processing message ${msg.id}: ${hoursPassed.toFixed(1)} hours passed`);

                // Update to Stage 3 (Unlocked)
                const { error: updateError } = await supabaseAdmin
                    .from('messages')
                    .update({
                        absence_check_stage: 3,
                        stage3_sent_at: now.toISOString(),
                        is_unlocked: true,
                        updated_at: now.toISOString()
                    })
                    .eq('id', msg.id);

                if (updateError) {
                    console.error(`Failed to unlock message ${msg.id}:`, updateError);
                    results.errors.push(`Message ${msg.id}: ${updateError.message}`);
                    continue;
                }

                // Send notification to recipient
                await sendUnlockNotification(msg.recipient_email, msg.id);
                results.stage3_unlocked++;
            }
        }

        console.log(`[Cron] Completed. Unlocked ${results.stage3_unlocked} messages`);
        return NextResponse.json({ success: true, processed: results });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

async function sendUnlockNotification(recipientEmail: string, messageId: string) {
    if (!recipientEmail || !gmailPass) {
        console.log("[Cron] Skipping email: missing recipient or gmail config");
        return;
    }

    try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr';
        const messageUrl = `${siteUrl}/vault`;

        await transporter.sendMail({
            from: `"AFTERM" <${gmailUser}>`,
            to: recipientEmail,
            subject: "🔓 AFTERM 메시지 열람 가능",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">🔓 메시지 열람이 허용되었습니다</h2>
                    <p>안녕하세요,</p>
                    <p>48시간 동안 작성자의 응답이 없어, 요청하신 메시지를 이제 열람하실 수 있습니다.</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${messageUrl}" 
                           style="background: #22c55e; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            메시지 보러가기
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        이 메시지는 자동으로 발송되었습니다.
                    </p>
                </div>
            `
        });
        console.log(`[Cron] Unlock notification sent to ${recipientEmail}`);

    } catch (e) {
        console.error(`[Cron] Failed to send unlock email to ${recipientEmail}:`, e);
    }
}
