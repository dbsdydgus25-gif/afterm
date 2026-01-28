import { createClient } from "@supabase/supabase-js";
import nodemailer from 'nodemailer';
import { sendMessage } from "@/lib/solapi/client";

// Admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function processAbsenceChecks() {
    console.log("=== ABSENCE VERIFICATION PROCESS STARTED (Shared) ===");

    const supabase = supabaseAdmin;

    // Email transporter setup
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    // === STAGE 2 → UNLOCK MESSAGE (After 1 Minute - TEST MODE) ===
    // Production would be 48 hours. Changed to 1 min for testing as requested.
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const { data: stage2Messages } = await supabase
        .from('messages')
        .select('id, recipient_email, recipient_phone, content')
        .eq('absence_check_stage', 2)
        .lt('stage2_sent_at', oneMinuteAgo.toISOString());

    console.log(`[TEST MODE] Found ${stage2Messages?.length || 0} messages to unlock after stage 2 (1 min)`);

    let stage2Count = 0;
    for (const message of stage2Messages || []) {
        try {
            // Unlock message - author is absent
            await supabase
                .from('messages')
                .update({
                    unlocked: true,
                    absence_check_stage: 3,
                    absence_confirmed: true  // Author absent
                })
                .eq('id', message.id);

            // Send notification to recipient
            // 1. Email (Legacy)
            if (message.recipient_email) {
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
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/view/${message.id}" 
                                   style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                    메시지 확인하기
                                </a>
                            </div>
                        </div>
                    `
                });
            }

            // 2. SMS (Primary)
            if (message.recipient_phone) {
                try {
                    await sendMessage({
                        to: message.recipient_phone,
                        text: `[AFTERM] 작성자의 부재가 확인되어 메시지가 공개되었습니다.\n확인하기: ${process.env.NEXT_PUBLIC_SITE_URL}/view/${message.id}`,
                        type: 'SMS'
                    });
                    console.log(`Unlock SMS sent to ${message.recipient_phone}`);
                } catch (smsError) {
                    console.error("Failed to send Unlock SMS:", smsError);
                }
            }

            console.log(`Unlocked message ${message.id} after stage 2 timeout`);
            stage2Count++;

        } catch (error) {
            console.error(`Failed to unlock message ${message.id}:`, error);
        }
    }

    console.log(`=== PROCESS COMPLETED: ${stage2Count} unlocked ===`);

    return {
        success: true,
        stage2Unlocked: stage2Count
    };
}
