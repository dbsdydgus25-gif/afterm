import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');
        const supabaseAdmin = createAdminClient();

        // 1. Verify Code
        const { data: verificationData, error: verificationError } = await supabaseAdmin
            .from('verification_codes')
            .select('*')
            .eq('phone', cleanPhone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (verificationError || !verificationData) {
            return NextResponse.json({ success: false, error: "인증번호가 올바르지 않거나 만료되었습니다." }, { status: 400 });
        }

        // 2. Find User ID from Profiles
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('phone', cleanPhone)
            .single();

        if (profileError || !profileData) {
            return NextResponse.json({ success: false, error: "가입된 정보를 찾을 수 없습니다." }, { status: 404 });
        }

        // 3. Get Email from Auth Users
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

        if (userError || !userData.user) {
            return NextResponse.json({ success: false, error: "사용자 정보를 불러올 수 없습니다." }, { status: 404 });
        }

        const email = userData.user.email;
        if (!email) {
            return NextResponse.json({ success: false, error: "이메일 정보가 없습니다." }, { status: 404 });
        }

        // 4. Cleanup Code
        await supabaseAdmin.from('verification_codes').delete().eq('id', verificationData.id);

        // 5. Masking Email (Simple masking: ab***@domain.com)
        const [local, domain] = email.split('@');
        let maskedLocal = local;
        if (local.length > 2) {
            maskedLocal = local.substring(0, 2) + '*'.repeat(local.length - 2);
        } else {
            maskedLocal = local.substring(0, 1) + '*';
        }

        return NextResponse.json({ success: true, email: `${maskedLocal}@${domain}` });

    } catch (error: any) {
        console.error("Find ID Error:", error);
        return NextResponse.json({ error: "아이디 찾기 중 오류가 발생했습니다." }, { status: 500 });
    }
}
