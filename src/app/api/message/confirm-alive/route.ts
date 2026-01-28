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
 * Confirm author is alive
 * Author clicks survival check button → Cancel absence verification
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        // Decode token
        let decoded;
        try {
            decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        const { messageId, userId } = decoded;

        const supabase = supabaseAdmin;

        // Get message details
        const { data: message, error: msgError } = await supabase
            .from('messages')
            .select('id, user_id, recipient_email, content, absence_check_stage')
            .eq('id', messageId)
            .eq('user_id', userId)
            .single();

        if (msgError || !message) {
            return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
        }

        // Check if absence check is active
        if (message.absence_check_stage === 0 || message.absence_check_stage === 3) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/already-confirmed`);
        }

        // Mark as confirmed alive - message stays locked
        const { error: updateError } = await supabase
            .from('messages')
            .update({
                absence_check_stage: 3,
                absence_confirmed: false  // Author is alive
                // unlocked stays false - message remains locked
            })
            .eq('id', messageId);

        if (updateError) {
            console.error("Failed to confirm alive:", updateError);
            return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });
        }

        // Send notification to recipient
        if (message.recipient_email) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });


            await transporter.sendMail({
                from: `"AFTERM" <${process.env.GMAIL_USER}>`,
                to: message.recipient_email,
                subject: "메시지 열람 불가 안내",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">작성자 생존 확인됨</h2>
                        <p>안녕하세요,</p>
                        <p>작성자가 직접 메일을 확인했습니다.</p>
                        <p style="color: #dc2626; font-weight: bold;">
                            작성자의 부재가 아니므로 메시지는 열람할 수 없습니다.
                        </p>
                    </div>
                `
            });
        }

        console.log(`Author ${userId} confirmed alive for message ${messageId}`);

        // Redirect to main page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/`);

    } catch (error: any) {
        console.error("Confirm alive error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
