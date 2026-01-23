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
        const results = { phase1: 0, phase2: 0, final: 0, errors: [] as string[] };

        // --- Phase 1: Report Received -> Verifying 1 (Send 1st Email) ---
        const { data: step1Targets, error: err1 } = await supabaseAdmin
            .from('messages')
            .select('id, report_received_at, user_id')
            .eq('verification_status', 'report_received');

        if (err1) throw err1;

        for (const msg of step1Targets || []) {
            const reportTime = new Date(msg.report_received_at);
            const targetTime = getTargetTime(reportTime, VerificationConfig.DELAY_PHASE_1_HOURS);

            if (now >= targetTime) {
                // Time passed! Move to next step
                await updateStatus(msg.id, 'verifying_1', msg.user_id, 1);
                results.phase1++;
            }
        }

        // --- Phase 2: Verifying 1 -> Verifying 2 (Send 2nd Email) ---
        const { data: step2Targets, error: err2 } = await supabaseAdmin
            .from('messages')
            .select('id, last_verification_sent_at, user_id')
            .eq('verification_status', 'verifying_1');

        if (err2) throw err2;

        for (const msg of step2Targets || []) {
            const lastSentTime = new Date(msg.last_verification_sent_at);
            const targetTime = getTargetTime(lastSentTime, VerificationConfig.DELAY_PHASE_2_HOURS);

            if (now >= targetTime) {
                await updateStatus(msg.id, 'verifying_2', msg.user_id, 2);
                results.phase2++;
            }
        }

        // --- Phase 3: Verifying 2 -> Unlocked (Allow Access) ---
        const { data: step3Targets, error: err3 } = await supabaseAdmin
            .from('messages')
            .select('id, last_verification_sent_at, user_id')
            .eq('verification_status', 'verifying_2');

        if (err3) throw err3;

        for (const msg of step3Targets || []) {
            const lastSentTime = new Date(msg.last_verification_sent_at);
            const targetTime = getTargetTime(lastSentTime, VerificationConfig.DELAY_FINAL_HOURS);

            if (now >= targetTime) {
                // Final Step: Unlock!
                await supabaseAdmin
                    .from('messages')
                    .update({
                        verification_status: 'unlocked',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', msg.id);

                // Notify sender (final notice)
                await sendVerificationEmail(msg.user_id, 3);
                results.final++;
            }
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

async function updateStatus(messageId: string, newStatus: string, userId: string, step: number) {
    // 1. Send Email
    await sendVerificationEmail(userId, step);

    // 2. Update DB
    await supabaseAdmin
        .from('messages')
        .update({
            verification_status: newStatus,
            last_verification_sent_at: new Date().toISOString(),
            verify_attempt_count: step
        })
        .eq('id', messageId);
}

async function sendVerificationEmail(userId: string, step: number) {
    try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!user || !user.email) return;

        let subject = "";
        let content = "";

        if (step === 1) {
            subject = "[AFTERM] 생존 확인 (1차 요청)";
            content = "누군가 당신의 메시지를 열람하려 합니다. 아직 생존해 계시다면 '생존 확인' 버튼을 눌러주세요. 응답이 없으면 1주일 후 메시지가 공개될 수 있습니다.";
        } else if (step === 2) {
            subject = "[AFTERM] 생존 확인 (최종 요청)";
            content = "마지막 확인입니다. 즉시 응답하지 않으면 곧 메시지 열람이 허용됩니다.";
        } else if (step === 3) {
            subject = "[AFTERM] 메시지 열람 허용 알림";
            content = "지정된 기간 동안 응답이 없어 메시지 열람이 허용되었습니다.";
        }

        await transporter.sendMail({
            from: `"AFTERM Security" <${gmailUser}>`,
            to: user.email,
            subject: subject,
            text: content, // Simple text for now
        });
        console.log(`Email sent to ${user.email} (Step ${step})`);

    } catch (e) {
        console.error(`Failed to send email to user ${userId}:`, e);
    }
}
