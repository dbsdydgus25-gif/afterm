import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/solapi/client";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, type } = body;
        const id = body.id; // Extract id optionally here

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');

        // Use Admin Client for DB operations to bypass RLS
        const supabaseAdmin = createAdminClient();
        let user = null;

        // Check Login Status if needed (for update/onboarding)
        // For 'find' type, user is NOT logged in, so skipping strict auth check here
        // For 'signup', user might be logged in (onboarding) or not
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        user = authData.user;

        // Validate Phone based on Type
        if (type === 'signup') {
            // MUST be unique across ALL users
            const { data: existingUser } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('phone', cleanPhone)
                .maybeSingle();

            if (existingUser) {
                return NextResponse.json({ error: "이미 가입된 휴대폰 번호입니다." }, { status: 400 });
            }
        } else if (type === 'find') {
            // MUST exist
            const { data: existingUser } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('phone', cleanPhone)
                .maybeSingle();

            if (!existingUser) {
                return NextResponse.json({ error: "가입되지 않은 휴대폰 번호입니다." }, { status: 400 });
            }
        } else if (type === 'recipient') {
            // Check against MESSAGES table
            // 'id' (messageId) is already extracted from body

            if (!id) return NextResponse.json({ error: "Message ID is required" }, { status: 400 });

            // Need to fetch message securely (Service Role)
            const { data: message } = await supabaseAdmin
                .from('messages')
                .select('recipient_phone')
                .eq('id', id)
                .single();

            if (!message) {
                return NextResponse.json({ error: "Message not found" }, { status: 404 });
            }

            // Normalize
            const dbPhone = message.recipient_phone.replace(/-/g, '');
            if (dbPhone !== cleanPhone) {
                return NextResponse.json({ error: "지정된 수신인 휴대폰 번호와 일치하지 않습니다." }, { status: 403 });
            }

            // If match, allow sending code
        } else {
            // Default (Update / Onboarding / Et cetra)
            // Check if phone exists for ANY OTHER user
            // If user is logged in, exclude self. If not (rare case for default), just check existence?
            // Actually, onboarding uses 'signup' type now in client code? No, we just added it.
            // But let's keep 'update' logic for settings page

            if (user) {
                const { data: existingUser } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('phone', cleanPhone)
                    .neq('id', user.id)
                    .maybeSingle();

                if (existingUser) {
                    return NextResponse.json({ error: "이미 가입된 휴대폰 번호입니다." }, { status: 400 });
                }
            } else {
                // If not logged in and not specified type, assume signup check? 
                // Or error? Let's assume strict check
                // For safety, require login for update
                // But for now, let's treat it as 'signup' equivalent if no user
                const { data: existingUser } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('phone', cleanPhone)
                    .maybeSingle();

                if (existingUser) {
                    return NextResponse.json({ error: "이미 가입된 휴대폰 번호입니다." }, { status: 400 });
                }
            }
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
