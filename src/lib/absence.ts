import { createClient } from "@supabase/supabase-js";
import nodemailer from 'nodemailer';
import { sendMessage } from "@/lib/solapi/client";

// Admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function processAbsenceChecks(targetMessageId?: string) {
    console.log("=== ABSENCE VERIFICATION PROCESS STARTED (Shared) ===");

    const supabase = supabaseAdmin;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr';

    // Email transporter setup
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    // === STAGE 2 → UNLOCK MESSAGE (After 48 Hours) ===
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    let query = supabase
        .from('messages')
        .select('id, recipient_email, recipient_phone, content')
        .eq('absence_check_stage', 2)
        .lt('stage2_sent_at', fortyEightHoursAgo.toISOString());

    // Filter by Specific Message ID if provided (For limiting Manual Cron)
    if (targetMessageId) {
        query = query.eq('id', targetMessageId);
    }

    const { data: stage2Messages } = await query;

    console.log(`[ABSENCE CHECK] Found ${stage2Messages?.length || 0} messages pending unlock (48h check)`);

    const results = [];

    for (const message of stage2Messages || []) {
        const result = {
            id: message.id,
            unlocked: false,
            emailSent: false,
            emailError: null as string | null,
            smsSent: false,
            smsError: null as string | null
        };

        try {
            // Unlock message - author is absent
            await supabase
                .from('messages')
                .update({
                    status: 'UNLOCKED',      // Critical for Dashboard
                    absence_check_stage: 3,
                    absence_confirmed: true  // Author absent
                })
                .eq('id', message.id);

            result.unlocked = true;

            // Send notification to recipient
            // 1. Email (Legacy)
            if (message.recipient_email) {
                try {
                    await transporter.sendMail({
                        from: `"AFTERM" <${process.env.GMAIL_USER}>`,
                        to: message.recipient_email,
                        subject: "메시지가 공개되었습니다",
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2563eb;">메시지 공개 알림</h2>
                                <p>안녕하세요,</p>
                                <p>작성자의 부재가 확인되어 메시지가 공개되었습니다.</p>
                                <p>이제 메시지를 열람하실 수 있습니다.</p>
                                
                                <div style="margin: 30px 0; text-align: center;">
                                    <a href="${siteUrl}/view/${message.id}" 
                                       style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                        메시지 확인하기
                                    </a>
                                </div>
                            </div>
                        `
                    });
                    result.emailSent = true;
                } catch (e: any) {
                    console.error(`Email failed for ${message.id}:`, e);
                    result.emailError = e.message;
                }
            }

            // 2. SMS (Primary)
            if (message.recipient_phone) {
                try {
                    await sendMessage({
                        to: message.recipient_phone,
                        text: `[AFTERM] 작성자의 부재가 확인되어 메시지가 공개되었습니다.\n확인하기: ${siteUrl}/view/${message.id}`,
                        type: 'LMS',
                        subject: 'AFTERM 알림'
                    });
                    console.log(`Unlock SMS sent to ${message.recipient_phone}`);
                    result.smsSent = true;
                } catch (smsError: any) {
                    console.error("Failed to send Unlock SMS:", smsError);
                    result.smsError = smsError.message || JSON.stringify(smsError);
                }
            }

            console.log(`Unlocked message ${message.id} after stage 2 timeout`);

        } catch (error: any) {
            console.error(`Failed to unlock message ${message.id}:`, error);
        }
        results.push(result);
    }

    const stage2Unlocked = results.filter(r => r.unlocked).length;
    console.log(`=== PROCESS COMPLETED: ${stage2Unlocked} unlocked ===`);

    return {
        success: true,
        stage2Unlocked,
        details: results
    };
}
