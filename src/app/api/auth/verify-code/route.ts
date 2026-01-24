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

        // Check if code matches and is valid
        const { data, error } = await supabaseAdmin
            .from('verification_codes')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) {
            return NextResponse.json({ success: false, error: "인증번호가 올바르지 않거나 만료되었습니다." }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Verify Code Error:", error);
        return NextResponse.json({ error: "인증 확인 중 오류가 발생했습니다." }, { status: 500 });
    }
}
