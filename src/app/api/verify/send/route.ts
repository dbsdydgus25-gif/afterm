import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/solapi/client";

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');

        // 1. Check Login Status (Still required for Onboarding SMS)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use Admin Client for DB operations to bypass RLS
        const supabaseAdmin = createAdminClient();

        // Check if phone exists for ANY OTHER user (Duplicate Check)
        const { data: existingUser } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('phone', cleanPhone)
            .neq('id', user.id) // Exclude myself (re-verification is allowed)
            .maybeSingle();

        if (existingUser) {
            return NextResponse.json({ error: "이미 가입된 휴대폰 번호입니다." }, { status: 400 });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Expires in 3 minutes
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

        // 2. Delete previous codes for this phone
        await supabaseAdmin.from('verification_codes').delete().eq('phone', cleanPhone);

        // 3. Insert new code
        const { error: dbError } = await supabaseAdmin.from('verification_codes').insert({
            phone: cleanPhone,
            code: code,
            expires_at: expiresAt
        });

        if (dbError) {
            console.error("DB Error:", dbError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // 4. Send SMS
        const messageText = `[AFTERM] 인증번호 [${code}]를 입력해주세요.`;
        const result = await sendMessage({
            to: cleanPhone,
            text: messageText,
            type: 'SMS'
        });

        if (!result.success) {
            console.error("SMS Error:", result.error);
            // Return specific error from Solapi (e.g. "Sender number unauthorized")
            return NextResponse.json({ error: result.error || "SMS sending failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true, expires_in: 180 });

    } catch (error: any) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
