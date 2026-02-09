import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

        // 4. Send SMS notification if recipient phone exists
        let smsSent = false;
        if (message.recipient_phone) {
            try {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.afterm.co.kr';
                const unlockUrl = `${siteUrl}/vault`;

                const solapiResponse = await fetch('https://api.solapi.com/messages/v4/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${process.env.SOLAPI_API_KEY}:${process.env.SOLAPI_API_SECRET}`).toString('base64')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: {
                            to: message.recipient_phone.replace(/-/g, ''),
                            from: process.env.SOLAPI_SENDER_NUMBER,
                            text: `[AFTERM] 메시지 열람이 허용되었습니다.\n\n48시간 동안 작성자의 응답이 없어 요청하신 메시지를 이제 열람하실 수 있습니다.\n\n▶ 메시지 보러가기: ${unlockUrl}`
                        }
                    })
                });

                if (solapiResponse.ok) {
                    const responseData = await solapiResponse.json();
                    console.log(`[Test] SMS sent successfully:`, responseData);
                    smsSent = true;
                } else {
                    const errorData = await solapiResponse.json();
                    console.error("[Test] Solapi API error:", {
                        status: solapiResponse.status,
                        statusText: solapiResponse.statusText,
                        error: errorData
                    });
                }
            } catch (smsError: any) {
                console.error("[Test] SMS exception:", {
                    message: smsError.message,
                    stack: smsError.stack
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Message unlocked successfully",
            result: {
                unlocked: true,
                sms_sent: smsSent,
                recipient_phone: message.recipient_phone || null
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
