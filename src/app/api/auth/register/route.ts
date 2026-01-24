import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const { email, password, code } = await request.json();

        if (!email || !password || !code) {
            return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
        }

        const supabase = await createClient();
        const identifier = `email:${email}`;

        // 1. Verify Email Code first
        const { data: verificationData, error: verificationError } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('phone', identifier) // Using 'phone' column for email identifier
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (verificationError || !verificationData) {
            return NextResponse.json({ error: "이메일 인증번호가 올바르지 않거나 만료되었습니다." }, { status: 400 });
        }

        // 2. Admin Client for User Creation
        const supabaseAdmin = createAdminClient();

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        // Note: listUsers is paginated, for production with many users this check might need optimization or simply rely on createUser error
        // But createUser throws error if email exists, which is fine.

        // 3. Create User (Confirmed)
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto confirm since they verified OTP
        });

        if (createError) {
            console.error("User creation error:", createError);
            return NextResponse.json({ error: createError.message === "User already registered" ? "이미 가입된 이메일입니다." : createError.message }, { status: 400 });
        }

        // 4. Cleanup Verification Code
        await supabase.from('verification_codes').delete().eq('id', verificationData.id);

        return NextResponse.json({ success: true, userId: userData.user.id });

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "회원가입 중 오류가 발생했습니다." }, { status: 500 });
    }
}
