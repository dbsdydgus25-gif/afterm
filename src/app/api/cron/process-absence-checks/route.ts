import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { sendMessage } from "@/lib/solapi/client";

// Admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

/**
 * Cron job to process absence verification stages
 * Runs every hour to:
 * 1. Move stage 1 (7+ days) → stage 2
 * 2. Move stage 2 (24+ hours) → unlock message
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("=== ABSENCE VERIFICATION CRON JOB STARTED ===");

        const supabase = supabaseAdmin;

        // Email transporter setup
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // === STAGE 1 → STAGE 2 (After 1 minute - TESTING) ===
        // const sevenDaysAgo = new Date();
        // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const stage1Threshold = new Date();
        stage1Threshold.setMinutes(stage1Threshold.getMinutes() - 1); // 1 Minute for testing

        const { data: stage1Messages } = await supabase
            .from('messages')
            .select('id, user_id, recipient_email, recipient_phone, content')
            .eq('absence_check_stage', 1)
            .lt('stage1_sent_at', stage1Threshold.toISOString());

        console.log(`Found ${stage1Messages?.length || 0} messages to move from stage 1 to stage 2`);

        let stage1Count = 0;
        for (const message of stage1Messages || []) {
            try {
                const now = new Date().toISOString();

                // Update to stage 2
                await supabase
                    .from('messages')
                    .update({
                        absence_check_stage: 2,
                        stage2_sent_at: now
                    })
                    .eq('id', message.id);

                // Get author email directly from Auth
                const { data: { user: author }, error: userError } = await supabase.auth.admin.getUserById(message.user_id);

                if (userError || !author || !author.email) {
                    console.error(`Author email not found for message ${message.id}`);
                    continue;
                }

                // Generate confirmation token
                const token = Buffer.from(JSON.stringify({
                    messageId: message.id,
                    userId: message.user_id,
                    type: 'survival_check',
                    timestamp: Date.now()
                })).toString('base64');

                // const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr';
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; // Fallback for local testing if needed, or PROD
                const confirmLink = `${siteUrl}/api/message/confirm-alive?token=${token}`;

                // Send Stage 2 final confirmation email
                await transporter.sendMail({
                    from: `"AFTERM" <${process.env.GMAIL_USER}>`,
                    to: author.email,
                    subject: "🚨 AFTERM 최종 생존 확인 (긴급)",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #dc2626;">🚨 최종 생존 확인</h2>
                            <p>안녕하세요,</p>
                            <p>메시지에 대한 마지막 생존 확인입니다.</p>
                            <p style="color: #dc2626; font-weight: bold;">
                                곧 메시지가 공개됩니다. 생존하셨다면 즉시 확인해주세요.
                            </p>
                            
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="${confirmLink}" 
                                   style="background: #dc2626; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                    긴급: 생존 확인하기
                                </a>
                            </div>
                        </div>
                    `
                });

                console.log(`Moved message ${message.id} to stage 2, sent final email to ${author.email}`);
                stage1Count++;

            } catch (error) {
                console.error(`Failed to process stage 1 message ${message.id}:`, error);
            }
        }

        // === STAGE 2 → UNLOCK MESSAGE (After 1 minute - TESTING) ===
        // const twentyFourHoursAgo = new Date();
        // twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        const stage2Threshold = new Date();
        stage2Threshold.setMinutes(stage2Threshold.getMinutes() - 1); // 1 Minute for testing

        const { data: stage2Messages } = await supabase
            .from('messages')
            .select('id, recipient_email, recipient_phone, content')
            .eq('absence_check_stage', 2)
            .lt('stage2_sent_at', stage2Threshold.toISOString());

        console.log(`Found ${stage2Messages?.length || 0} messages to unlock after stage 2`);

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
                    // Import inside loop or ensure imported at top. 
                    // Since I can't easily add import at top with this ReplaceBlock, 
                    // I will trust the import exists or add it in a separate call if needed. 
                    // Wait, I haven't added the import yet to this file. 
                    // I will add the import in a separate tool call.
                    // For now, I'll use the function assuming it's imported.
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

        console.log(`=== CRON COMPLETED: ${stage1Count} moved to stage 2, ${stage2Count} unlocked ===`);

        return NextResponse.json({
            success: true,
            stage1ToStage2: stage1Count,
            stage2Unlocked: stage2Count
        });

    } catch (error: any) {
        console.error("Absence verification cron error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
