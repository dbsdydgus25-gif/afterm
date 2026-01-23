'use server';

import { createClient } from '@supabase/supabase-js';
// import { generateRandomCode } from '@/lib/utils'; // Removed
import { SolapiMessageService } from 'solapi'; // Corrected import

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solapi Config
const messageService = new SolapiMessageService(
    process.env.SOLAPI_API_KEY!,
    process.env.SOLAPI_API_SECRET!
);

export async function requestOTP(messageId: string, phone: string) {
    try {
        // 1. Verify Phone Match & Status
        const { data: message, error } = await supabaseAdmin
            .from('messages')
            .select('user_id, verification_status')
            .eq('id', messageId)
            .single();

        if (error || !message) return { success: false, error: "메시지를 찾을 수 없습니다." };

        // 2. Get Sender's Profile Phone
        const { data: senderProfile } = await supabaseAdmin
            .from('profiles')
            .select('phone')
            .eq('id', message.user_id)
            .single();

        if (!senderProfile || !senderProfile.phone) {
            return { success: false, error: "작성자가 연락처를 등록하지 않아 인증을 진행할 수 없습니다." };
        }

        // Normalize phones (remove dashes)
        const senderPhone = senderProfile.phone.replace(/-/g, '');
        const inputPhone = phone.replace(/-/g, '');

        // 3. Verify: Input Phone must match Sender's Phone
        if (senderPhone !== inputPhone) {
            return { success: false, error: "작성자 본인의 휴대폰 번호와 일치하지 않습니다." };
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit

        // 4. Save Code to DB
        await supabaseAdmin
            .from('messages')
            .update({ unlock_code: code })
            .eq('id', messageId);

        // 5. Send SMS to Sender's Phone (which is inputPhone)
        const from = process.env.SOLAPI_SENDER_NUMBER || '01000000000';
        await messageService.sendOne({
            to: inputPhone,
            from: from,
            text: `[AFTERM] 생존 확인 인증번호 [${code}]를 입력해주세요.` // Text slightly changed for context
        });

        return { success: true };

    } catch (e: any) {
        console.error("OTP Request Error:", e);
        return { success: false, error: e.message };
    }
}

export async function verifyOTP(messageId: string, phone: string, code: string) {
    try {
        const { data: message, error } = await supabaseAdmin
            .from('messages')
            .select('unlock_code, content, verification_status')
            .eq('id', messageId)
            .single();

        if (error || !message) return { success: false, error: "메시지 조회 실패" };

        if (message.unlock_code !== code) {
            return { success: false, error: "인증번호가 일치하지 않습니다." };
        }

        // Status check
        // Fast Track: OTP Verified -> Unlock Immediately
        // 사용자의 요청: 수신인 인증(OTP) 성공 시 1주일 대기 없이 즉시 열람
        if (message.verification_status !== 'unlocked') {
            await supabaseAdmin
                .from('messages')
                .update({
                    verification_status: 'unlocked',
                    updated_at: new Date().toISOString()
                })
                .eq('id', messageId);
        }

        // Success! Return content
        return { success: true, content: message.content };

    } catch (e: any) {
        console.error("OTP Verify Error:", e);
        return { success: false, error: e.message };
    }
}
