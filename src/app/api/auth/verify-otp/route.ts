import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { phone, token } = await request.json();

        if (!phone || !token) {
            return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const metadata = user.user_metadata || {};
        const savedCode = metadata.phone_verification_code;
        const savedExpires = metadata.phone_verification_expires;
        const savedPhone = metadata.temp_phone;

        // 1. Check Code
        if (!savedCode || savedCode !== token) {
            return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 });
        }

        // 2. Check Expiry
        if (new Date(savedExpires) < new Date()) {
            return NextResponse.json({ error: '인증번호가 만료되었습니다.' }, { status: 400 });
        }

        // 3. Check Phone match
        if (savedPhone !== phone) {
            return NextResponse.json({ error: '인증 요청한 전화번호와 다릅니다.' }, { status: 400 });
        }

        // 4. Success -> Update Profile & Clear Metadata
        // Clear temp data
        await supabase.auth.updateUser({
            data: {
                phone_verification_code: null,
                phone_verification_expires: null,
                temp_phone: null,
                phone_verified: true // Mark as verified in metadata too for faster checks
            }
        });

        // Update Public Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                phone: phone,
                phone_verified: true
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
