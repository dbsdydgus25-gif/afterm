'use server';

import { createClient } from '@supabase/supabase-js';
// import { generateRandomCode } from '@/lib/utils'; // Removed
import { MsgApiService } from 'solapi'; // Named import try

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solapi Config
const messageService = new MsgApiService({
    apiKey: process.env.SOLAPI_API_KEY!,
    apiSecret: process.env.SOLAPI_API_SECRET!,
});

export async function requestOTP(messageId: string, phone: string) {
    try {
        // 1. Verify Phone Match & Status
        const { data: message, error } = await supabaseAdmin
            .from('messages')
            .select('recipient_phone, verification_status')
            .eq('id', messageId)
            .single();

        if (error || !message) return { success: false, error: "메시지를 찾을 수 없습니다." };

        // Normalize phones (remove dashes)
        const dbPhone = message.recipient_phone.replace(/-/g, '');
        const inputPhone = phone.replace(/-/g, '');

        if (dbPhone !== inputPhone) {
            return { success: false, error: "등록된 수신인 번호와 일치하지 않습니다." };
        }

        // Check if unlocked (or testing mode?)
        // if (message.verification_status !== 'unlocked') {
        //    return { success: false, error: "아직 열람 권한이 부여되지 않았습니다." };
        // }
        // For smoother UX, let them request OTP, but verify checks status again OR tests allow it.

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit

        // 2. Save Code to DB (Ideally a separate 'verifications' table, but using 'messages.unlock_code' for MVP)
        await supabaseAdmin
            .from('messages')
            .update({ unlock_code: code })
            .eq('id', messageId);

        // 3. Send SMS
        const from = process.env.SOLAPI_SENDER_NUMBER || '01000000000'; // Must be valid sender ID
        await messageService.sendOne({
            to: inputPhone,
            from: from,
            text: `[AFTERM] 인증번호 [${code}]를 입력해주세요.`
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
        if (message.verification_status !== 'unlocked') {
            // In real world, we block here. But for test, if code matches, maybe we allow?
            // Let's strictly follow flow: must be unlocked.
            return { success: false, error: "아직 잠금 해제 기간(1주일)이 지나지 않았습니다. 잠시 후 다시 시도해주세요." };
        }

        // Success! Return content
        return { success: true, content: message.content };

    } catch (e: any) {
        console.error("OTP Verify Error:", e);
        return { success: false, error: e.message };
    }
}
