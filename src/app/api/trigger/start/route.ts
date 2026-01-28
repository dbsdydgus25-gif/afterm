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
 * Start absence verification process (Stage 1)
 * Recipient requests absence check → Send survival confirmation email to author
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messageId } = body;

        // 1. Log request details
        console.log(`[Trigger/Start] Request for messageId: ${messageId}`);

        if (!messageId) {
            return NextResponse.json({ error: "Message ID required" }, { status: 400 });
        }

        // 2. Check Env Vars
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Trigger/Start] Missing Supabase Env Vars");
            return NextResponse.json({
                error: "Server Configuration Error",
                details: "Supabase credentials missing on server"
            }, { status: 500 });
        }

        const supabase = supabaseAdmin;

        // 3. Get message details with detailed error handling
        const { data: message, error: msgError } = await supabase
            .from('messages')
            .select('id, user_id, recipient_email, recipient_name, content, absence_check_stage')
            .eq('id', messageId)
            .single();

        if (msgError) {
            console.error("[Trigger/Start] Supabase Error:", msgError);
            return NextResponse.json({
                error: "Database Error",
                details: msgError.message,
                code: msgError.code
            }, { status: 404 }); // Returning 404 but with details
        }

        if (!message) {
            console.error("[Trigger/Start] Message found is null");
            return NextResponse.json({ error: "Message not found (Null result)" }, { status: 404 });
        }

        // Check if already in progress
        if (message.absence_check_stage > 0) {
            return NextResponse.json({
                error: "Absence check already in progress",
                stage: message.absence_check_stage
            }, { status: 400 });
        }

        // Get author details
        // Get author details directly from Auth (safer than profiles)
        const { data: { user: author }, error: userError } = await supabase.auth.admin.getUserById(message.user_id);

        if (userError || !author || !author.email) {
            console.error("Failed to fetch author:", userError);
            return NextResponse.json({ error: "Author email not found" }, { status: 404 });
        }

        const now = new Date().toISOString();

        // Update message to stage 1
        const { error: updateError } = await supabase
            .from('messages')
            .update({
                absence_check_stage: 1,
                absence_check_requested_at: now,
                stage1_sent_at: now
            })
            .eq('id', messageId);

        if (updateError) {
            console.error("Failed to update message:", updateError);
            return NextResponse.json({ error: "Failed to start absence check" }, { status: 500 });
        }

        // Generate confirmation token for survival check
        const token = Buffer.from(JSON.stringify({
            messageId,
            userId: message.user_id,
            type: 'survival_check',
            timestamp: Date.now()
        })).toString('base64');

        const confirmLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/message/confirm-alive?token=${token}`;

        // Setup email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Send Stage 1 survival confirmation email to author
        await transporter.sendMail({
            from: `"AFTERM" <${process.env.GMAIL_USER}>`,
            to: author.email,
            subject: "⚠️ AFTERM 생존 확인 요청 (7일 내 확인 필요)",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">⚠️ 생존 확인 요청</h2>
                    <p>안녕하세요,</p>
                    <p><strong>${message.recipient_name || '수신인'}</strong>님이 <strong>${message.content ? (message.content.length > 20 ? message.content.substring(0, 20) + '...' : message.content) : '내용 없음'}</strong> 메시지에 대해 부재 확인을 요청했습니다.</p>
                    <p>7일 이내에 이 메일을 확인하거나 아래 버튼을 클릭해주세요.</p>
                    
                   <div style="margin: 30px 0; text-align: center;">
                        <a href="${confirmLink}" 
                           style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            생존 확인하기
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        확인하지 않으면 2단계 최종 확인이 진행됩니다.
                    </p>
                </div>
            `
        });

        console.log(`Absence check started for message ${messageId}, stage 1 email sent to ${author.email}`);

        return NextResponse.json({
            success: true,
            stage: 1,
            message: "1단계 생존 확인 메일이 발송되었습니다."
        });

    } catch (error: any) {
        console.error("Absence check start error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
