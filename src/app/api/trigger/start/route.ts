import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

/**
 * Start absence verification process (Stage 1)
 * Recipient requests absence check → Send survival confirmation email to author
 */
export async function POST(request: Request) {
    try {
        const { messageId } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: "Message ID required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Get message details
        const { data: message, error: msgError } = await supabase
            .from('messages')
            .select('id, user_id, recipient_email, title, absence_check_stage')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Check if already in progress
        if (message.absence_check_stage > 0) {
            return NextResponse.json({
                error: "Absence check already in progress",
                stage: message.absence_check_stage
            }, { status: 400 });
        }

        // Get author details
        const { data: author } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', message.user_id)
            .single();

        if (!author?.email) {
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
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Send Stage 1 survival confirmation email to author
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: author.email,
            subject: "⚠️ AFTERM 생존 확인 요청 (7일 내 확인 필요)",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">⚠️ 생존 확인 요청</h2>
                    <p>안녕하세요,</p>
                    <p><strong>${message.title || '제목 없는 메시지'}</strong>의 수신인이 부재 확인을 요청했습니다.</p>
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
