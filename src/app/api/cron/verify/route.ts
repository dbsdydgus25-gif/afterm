import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { VerificationConfig, getTargetTime } from '@/lib/verificationConfig';
import nodemailer from 'nodemailer';
import { getErrorMessage } from "@/lib/error";

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
            .select('id, stage2_sent_at, user_id, recipient_phone')
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

                // Send SMS notification to recipient
                await sendUnlockNotification(msg.recipient_phone, msg.id);
                results.stage3_unlocked++;
            }
        }

        console.log(`[Cron] Completed. Unlocked ${results.stage3_unlocked} messages`);
        return NextResponse.json({ success: true, processed: results });

    } catch (error: unknown) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
    }
}

async function sendUnlockNotification(recipientPhone: string, messageId: string) {
    if (!recipientPhone) {
        console.log("[Cron] No recipient phone provided, skipping SMS");
        return;
    }

    try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr';
        const unlockUrl = `${siteUrl}/view/${messageId}/auth`;

        // Send SMS using Solapi
        const solapiResponse = await fetch('https://api.solapi.com/messages/v4/send', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.SOLAPI_API_KEY}:${process.env.SOLAPI_API_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    to: recipientPhone.replace(/-/g, ''),
                    from: process.env.SOLAPI_SENDER_NUMBER,
                    text: `[AFTERM] 메시지 열람이 허용되었습니다.\n\n48시간 동안 작성자의 응답이 없어 요청하신 메시지를 이제 열람하실 수 있습니다.\n\n▶ 메시지 보러가기: ${unlockUrl}`
                }
            })
        });

        if (!solapiResponse.ok) {
            const errorData = await solapiResponse.json();
            console.error("[Cron] Solapi SMS error:", errorData);
            return;
        }

        console.log(`[Cron] Unlock SMS sent to ${recipientPhone}`);

    } catch (e) {
        console.error(`[Cron] Failed to send unlock SMS to ${recipientPhone}:`, e);
    }
}
