import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { phone, otp } = await request.json(); // Validates the code
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // AUTHENTICATED FLOW
            const metadata = user.user_metadata || {};
            const savedOtp = metadata.phone_verification_code;
            const expiresAt = metadata.phone_verification_expires;
            const tempPhone = metadata.temp_phone;

            if (!savedOtp || !expiresAt || !tempPhone) {
                return NextResponse.json({ error: '인증번호가 요청되지 않았습니다.' }, { status: 400 });
            }

            if (new Date() > new Date(expiresAt)) {
                return NextResponse.json({ error: '인증번호가 만료되었습니다.' }, { status: 400 });
            }

            if (savedOtp !== otp) {
                return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 });
            }

            if (tempPhone !== phone) {
                return NextResponse.json({ error: '전화번호가 일치하지 않습니다.' }, { status: 400 });
            }

            // Mark verified in Profile
            // We need to use Admin to update 'profiles' if RLS blocks, but usually user can update own profile.
            // But let's use Admin ensures it works.
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    phone,
                    phone_verified: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error("Profile update error:", updateError);
                throw updateError;
            }

            // Clear metadata
            await supabase.auth.updateUser({
                data: {
                    phone_verification_code: null,
                    phone_verification_expires: null,
                    temp_phone: null
                }
            });

            return NextResponse.json({ success: true });

        } else {
            // UNAUTHENTICATED FLOW (Check table)
            const { data: codes, error: fetchError } = await supabaseAdmin
                .from('verification_codes')
                .select('*')
                .eq('phone', phone)
                .order('created_at', { ascending: false })
                .limit(1);

            if (fetchError || !codes || codes.length === 0) {
                return NextResponse.json({ error: '인증번호를 찾을 수 없습니다.' }, { status: 400 });
            }

            const record = codes[0];

            if (new Date() > new Date(record.expires_at)) {
                return NextResponse.json({ error: '인증번호가 만료되었습니다.' }, { status: 400 });
            }

            if (record.code !== otp) {
                return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 });
            }

            // Valid! 
            // Return success. Logic for consuming this (finding ID) happens in the next API call properly,
            // or we return a token here. For MVP, we trust the immediate next call which also verifies this OTP logic or just checks 'phone'.
            // Actually, we must NOT delete the code yet if 'Find ID' needs to re-verify it.
            // Or 'Find ID' endpoint will delete it.

            return NextResponse.json({ success: true, message: "Verified" });
        }

    } catch (error: any) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
