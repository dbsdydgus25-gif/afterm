'use server';

import { createClient } from '@supabase/supabase-js';

// ADMIN CLIENT: Bypasses RLS
// Use only for strictly controlled fetch operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Recipient View: Fetch Sender Name Only
 * This action allows unauthenticated recipients to see who sent the message.
 * It does NOT return the message content unless specific conditions are met (future scope).
 */
export async function getMessageSenderInfo(messageId: string) {
    if (!messageId) return { error: "Message ID required" };

    try {
        const { data, error } = await supabaseAdmin
            .from('messages')
            .select(`
                user_id,
                profiles:user_id ( full_name )
            `)
            .eq('id', messageId)
            .single();

        if (error || !data) {
            console.error("Admin fetch error:", error);
            return { error: "메시지를 찾을 수 없습니다." };
        }

        // @ts-ignore
        const senderName = data.profiles?.full_name || "사용자";
        return { senderName };
    } catch (err: any) {
        console.error("Server action error:", err);
        return { error: `서버 오류: ${err.message || JSON.stringify(err)}` };
    }
}
