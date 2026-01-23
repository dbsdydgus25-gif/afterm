import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SolapiMessageService } from 'solapi';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        // 1. Validation
        if (!phone || phone.length < 10) {
            return NextResponse.json({ error: '유효한 전화번호가 아닙니다.' }, { status: 400 });
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Store OTP in Database
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

        await supabase.auth.updateUser({
            data: {
                phone_verification_code: otp,
                phone_verification_expires: expiresAt,
                temp_phone: phone // Store the phone being verified
            }
        });

        // 4. Send SMS via Solapi
        if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_API_SECRET || !process.env.SOLAPI_SENDER_NUMBER) {
            console.error("Solapi env missing");
            // Mock for dev
            console.log(`[MOCK SMS] To: ${phone}, Code: ${otp}`);
            return NextResponse.json({ success: true, mode: 'mock' });
        }

        const messageService = new SolapiMessageService(
            process.env.SOLAPI_API_KEY,
            process.env.SOLAPI_API_SECRET
        );

        await messageService.send({
            to: phone,
            from: process.env.SOLAPI_SENDER_NUMBER,
            text: `[에프텀] 본인인증 번호는 [${otp}] 입니다. 5분 내에 입력해주세요.`,
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
