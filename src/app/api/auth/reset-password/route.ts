import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
    try {
        const { email, phone, code, newPassword } = await request.json();

        if (!email || !phone || !code || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');
        const supabaseAdmin = createAdminClient();

        // 1. Verify Code again (Security)
        const { data: verificationData, error: verificationError } = await supabaseAdmin
            .from('verification_codes')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (verificationError || !verificationData) {
            return NextResponse.json({ success: false, error: "인증번호가 만료되었거나 올바르지 않습니다." }, { status: 400 });
        }

        // 2. Find Profile by Phone
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('phone', cleanPhone)
            .single();

        if (profileError || !profile) {
            // Should not happen if verify/send checked existence
            return NextResponse.json({ success: false, error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
        }

        // 3. Verify Email matches User ID
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

        if (userError || !userData.user) {
            return NextResponse.json({ success: false, error: "사용자 계정을 찾을 수 없습니다." }, { status: 404 });
        }

        if (userData.user.email?.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json({ success: false, error: "입력하신 이메일과 휴대폰 번호의 명의자가 일치하지 않습니다." }, { status: 400 });
        }

        // 4. Update Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
            password: newPassword
        });

        if (updateError) {
            console.error("Password Update Error:", updateError);
            return NextResponse.json({ success: false, error: "비밀번호 변경 실패: " + updateError.message }, { status: 500 });
        }

        // 5. Consume Code (Delete)
        await supabaseAdmin.from('verification_codes').delete().eq('id', verificationData.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ error: "비밀번호 재설정 중 오류가 발생했습니다." }, { status: 500 });
    }
}
