import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { phone, otp } = await request.json();

        // 1. Verify OTP again (Secure check)
        const { data: codes } = await supabaseAdmin
            .from('verification_codes')
            .select('*')
            .eq('phone', phone)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!codes || codes.length === 0) {
            return NextResponse.json({ error: '인증 정보가 없습니다.' }, { status: 400 });
        }
        const record = codes[0];

        if (record.code !== otp) {
            return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 });
        }

        // 2. Find User by Phone in Profiles
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('email') // We assume profile HAS email. If profiles table doesn't have email column, we need to join auth.users?
            // Wait, my profiles table DOES have email.
            .eq('phone', phone)
            .single();

        if (profileError || !userProfile) {
            return NextResponse.json({ error: '해당 전화번호로 가입된 계정이 없습니다.' }, { status: 404 });
        }

        // 3. Mask Email
        const email = userProfile.email;
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local.substring(0, 2) + '*'.repeat(local.length - 2)
            : local;

        const maskedEmail = `${maskedLocal}@${domain}`;

        // 4. Cleanup (Consume OTP)
        await supabaseAdmin.from('verification_codes').delete().eq('phone', phone);

        return NextResponse.json({ email: maskedEmail });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
