import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

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

        // === STAGE 1 → STAGE 2 (After 7 days) ===
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: stage1Messages } = await supabase
            .from('messages')
            .select('id, user_id, recipient_email, title')
            .eq('absence_check_stage', 1)
            .lt('stage1_sent_at', sevenDaysAgo.toISOString());

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

                // Get author email
                const { data: author } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', message.user_id)
                    .single();

                if (!author?.email) continue;

                // Generate confirmation token
                const token = Buffer.from(JSON.stringify({
                    messageId: message.id,
                    userId: message.user_id,
                    type: 'survival_check',
                    timestamp: Date.now()
                })).toString('base64');

                const confirmLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/message/confirm-alive?token=${token}`;

                // Send Stage 2 final confirmation email
                await transporter.sendMail({
                    from: `"AFTERM" <${process.env.GMAIL_USER}>`,
                    to: author.email,
                    subject: "🚨 AFTERM 최종 생존 확인 (24시간 내 확인 필요)",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #dc2626;">🚨 최종 생존 확인</h2>
                            <p>안녕하세요,</p>
                            <p><strong>${message.title || '제목 없는 메시지'}</strong>에 대한 마지막 생존 확인입니다.</p>
                            <p style="color: #dc2626; font-weight: bold;">
                                24시간 이내에 이 메일을 확인하거나 아래 버튼을 클릭하지 않으면 메시지가 자동으로 공개됩니다.
                            </p>
                            
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="${confirmLink}" 
                                   style="background: #dc2626; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                    긴급: 생존 확인하기
                                </a>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px;">
                                이메일은 최종 경고입니다. 24시간 후 메시지가 공개됩니다.
                            </p>
                        </div>
                    `
                });

                console.log(`Moved message ${message.id} to stage 2, sent final email to ${author.email}`);
                stage1Count++;

            } catch (error) {
                console.error(`Failed to process stage 1 message ${message.id}:`, error);
            }
        }

        // === STAGE 2 → UNLOCK MESSAGE (After 24 hours) ===
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: stage2Messages } = await supabase
            .from('messages')
            .select('id, recipient_email, title')
            .eq('absence_check_stage', 2)
            .lt('stage2_sent_at', twentyFourHoursAgo.toISOString());

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
                if (message.recipient_email) {
                    await transporter.sendMail({
                        from: `"AFTERM" <${process.env.GMAIL_USER}>`,
                        to: message.recipient_email,
                        subject: "메시지가 공개되었습니다",
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2563eb;">메시지 공개 알림</h2>
                                <p>안녕하세요,</p>
                                <p><strong>${message.title || '제목 없는 메시지'}</strong>의 작성자 부재가 확인되어 메시지가 공개되었습니다.</p>
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
