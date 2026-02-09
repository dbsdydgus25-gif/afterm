import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/solapi/client';

// Admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * TEST ONLY: Manually trigger 48-hour check
 * This simulates 48 hours passing and directly unlocks the message
 */
export async function POST(request: Request) {
    try {
        const { messageId } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: "messageId required" }, { status: 400 });
        }

        // 1. Get current message
        const { data: message, error: fetchError } = await supabaseAdmin
            .from('messages')
            .select('id, absence_check_stage, stage2_sent_at, recipient_phone')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            return NextResponse.json({
                error: "Message not found",
                details: fetchError?.message
            }, { status: 404 });
        }

        if (message.absence_check_stage !== 2) {
            return NextResponse.json({
                error: "Message must be in stage 2 (48h wait)",
                currentStage: message.absence_check_stage
            }, { status: 400 });
        }

        // 2. Set stage2_sent_at to 49 hours ago
        const fortyNineHoursAgo = new Date(Date.now() - (49 * 60 * 60 * 1000));

        const { error: updateError } = await supabaseAdmin
            .from('messages')
            .update({ stage2_sent_at: fortyNineHoursAgo.toISOString() })
            .eq('id', messageId);

        if (updateError) {
            return NextResponse.json({
                error: "Update failed",
                details: updateError.message
            }, { status: 500 });
        }

        // 3. Directly unlock the message (instead of calling cron)
        const { error: unlockError } = await supabaseAdmin
            .from('messages')
            .update({
                absence_check_stage: 3,
                stage3_sent_at: new Date().toISOString(),
                is_unlocked: true
            })
            .eq('id', messageId);

        if (unlockError) {
            return NextResponse.json({
                error: "Unlock failed",
                details: unlockError.message
            }, { status: 500 });
        }

        // 4. Send SMS notification using Solapi SDK
        let smsSent = false;
        let smsError = null;

        if (message.recipient_phone) {
            try {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.afterm.co.kr';
                const unlockUrl = `${siteUrl}/vault`;

                const result = await sendMessage({
                    to: message.recipient_phone,
                    text: `[AFTERM] 메시지 열람이 허용되었습니다.\n\n48시간 동안 작성자의 응답이 없어 요청하신 메시지를 이제 열람하실 수 있습니다.\n\n▶ 메시지 보러가기: ${unlockUrl}`,
                    type: 'LMS'  // Changed from SMS to LMS for longer messages
                });

                if (result.success) {
                    console.log(`[Test] SMS sent successfully to ${message.recipient_phone}`, result.data);
                    smsSent = true;
                } else {
                    console.error("[Test] SMS error:", result.error);
                    smsError = result.error;
                }
            } catch (error: any) {
                console.error("[Test] SMS exception:", {
                    message: error.message,
                    stack: error.stack
                });
                smsError = error.message;
            }
        }

        return NextResponse.json({
            success: true,
            message: "Message unlocked successfully",
            result: {
                unlocked: true,
                sms_sent: smsSent,
                recipient_phone: message.recipient_phone || null,
                sms_error: smsError
            },
            debug: {
                env_check: {
                    has_api_key: !!process.env.SOLAPI_API_KEY,
                    has_api_secret: !!process.env.SOLAPI_API_SECRET,
                    has_sender_number: !!process.env.SOLAPI_SENDER_NUMBER
                }
            }
        });

    } catch (error: any) {
        console.error("Test trigger error:", error);
        return NextResponse.json({
            error: "Internal error",
            details: error.message
        }, { status: 500 });
    }
}
