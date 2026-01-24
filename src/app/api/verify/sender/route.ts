import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/solapi/client";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messageId } = body;

        if (!messageId) return NextResponse.json({ error: "Message ID required" }, { status: 400 });

        const admin = createAdminClient();

        // 1. Fetch Message First
        const { data: message, error: msgError } = await admin
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            console.error("Message fetch error:", msgError);
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // 2. Fetch Sender Profile separately
        const { data: senderProfile, error: profileError } = await admin
            .from('profiles')
            .select('phone')
            .eq('id', message.user_id)
            .single();

        if (profileError || !senderProfile || !senderProfile.phone) {
            console.error("Sender profile error:", profileError);
            return NextResponse.json({ error: "작성자의 휴대폰 번호를 찾을 수 없습니다." }, { status: 404 });
        }

        const senderPhone = senderProfile.phone;

        // 2. Generate and Send Code to SENDER's phone
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const cleanPhone = senderPhone.replace(/-/g, '');
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

        // Save Code (Using sender's phone key)
        await admin.from('verification_codes').delete().eq('phone', cleanPhone);
        await admin.from('verification_codes').insert({
            phone: cleanPhone,
            code: code,
            expires_at: expiresAt
        });

        // Send SMS
        await sendMessage({
            to: cleanPhone,
            text: `[AFTERM] 수신인이 메시지 열람을 위해 인증을 시도 중입니다.\n인증번호: [${code}]`,
            type: 'SMS'
        });

        // Return masked phone number to UI
        const maskedPhone = senderPhone.replace(/(\d{3})-?(\d{2})\d{2}-?(\d{4})/, '$1-**$2-****');
        // Simple mask logic: 010-1234-5678 -> 010-**34-**** ??
        // Let's just return success. The UI might not need the phone number if it's "Author's Phone".

        return NextResponse.json({ success: true, message: "Code sent to author's phone" });

    } catch (e: any) {
        console.error("Verify Sender Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
