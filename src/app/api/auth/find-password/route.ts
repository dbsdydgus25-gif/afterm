import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, phone, otp } = await request.json();

        // 1. Verify OTP
        const { data: codes } = await supabaseAdmin
            .from('verification_codes')
            .select('*')
            .eq('phone', phone)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!codes || codes.length === 0 || codes[0].code !== otp) {
            return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 });
        }

        // 2. Check if Email & Phone match in Profiles
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .eq('phone', phone)
            .single();

        if (!profile) {
            return NextResponse.json({ error: '입력하신 이메일과 전화번호가 일치하는 계정이 없습니다.' }, { status: 404 });
        }

        // 3. Send Password Reset Email (Using Supabase Auth Admin)
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://afterm.co.kr'}/auth/reset-password`
        });

        if (resetError) {
            throw resetError;
        }

        // 4. Cleanup OTP
        await supabaseAdmin.from('verification_codes').delete().eq('phone', phone);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
