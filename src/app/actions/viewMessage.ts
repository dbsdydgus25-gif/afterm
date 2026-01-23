'use server';

import { createClient } from '@supabase/supabase-js';

// ADMIN CLIENT: Bypasses RLS
// Use only for strictly controlled fetch operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing via Server Action!");
}

/**
 * Recipient View: Fetch Sender Name Only
 * This action allows unauthenticated recipients to see who sent the message.
 * It does NOT return the message content unless specific conditions are met (future scope).
 */
export async function getMessageSenderInfo(messageId: string) {
    if (!messageId) return { error: "Message ID required" };

    try {
        // 1. Fetch Message (user_id only)
        // FK 관계(PGRST200) 오류를 피하기 위해 조인 대신 2번의 쿼리로 분리합니다.
        const { data: messageData, error: messageError } = await supabaseAdmin
            .from('messages')
            .select('user_id')
            .eq('id', messageId)
            .single();

        if (messageError || !messageData) {
            console.error("Message fetch error:", messageError);
            return {
                error: `MSG_ERR: ${messageError?.code || 'NoCode'} - ${messageError?.message || 'Msg Not Found'} / Details: ${messageError?.details || 'None'}`
            };
        }

        // 2. Fetch Sender Profile
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('full_name') // profiles 테이블은 FK 없이 ID로 직접 조회
            .eq('id', messageData.user_id)
            .single();

        // 프로필이 없거나 에러가 나도, 메인 로직(메시지 존재 확인)에는 영향 안 미치게 fallback 처리
        if (profileError) {
            console.error("Profile fetch error (Non-critical):", profileError);
        }

        let senderName = profileData?.full_name;

        // 3. Fallback: If profile name is missing, try Auth User Metadata
        if (!senderName) {
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(messageData.user_id);
            if (!authError && authUser) {
                senderName = authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0];
            }
        }

        senderName = senderName || "사용자";
        return { senderName };
    } catch (err: any) {
        console.error("Server action error:", err);
        return { error: `서버 오류: ${err.message || JSON.stringify(err)}` };
    }
}
