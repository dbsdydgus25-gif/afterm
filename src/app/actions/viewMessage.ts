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

/**
 * FETCH UNLOCKED CONTENT (For Recipients)
 * Returns content ONLY if status is 'UNLOCKED'
 */
export async function getUnlockedMessageContent(messageId: string) {
    if (!messageId) return { error: "Message ID required" };

    try {
        // 1. Fetch Message status & content (Admin bypass)
        const { data: message, error } = await supabaseAdmin
            .from('messages')
            .select('id, user_id, status, content, recipient_name, recipient_relationship, created_at')
            .eq('id', messageId)
            .single();

        if (error || !message) {
            return { error: "Message not found" };
        }

        // 2. Security Check: status MUST be UNLOCKED
        if (message.status !== 'UNLOCKED') {
            return {
                isLocked: true,
                senderId: message.user_id // Return ID so client can fetch sender name via other action
            };
        }

        // 3. Fetch Sender Info
        const senderInfo = await getMessageSenderInfo(messageId);
        const senderName = senderInfo.senderName || "Unknown";

        // 4. Fetch Attachments
        const { data: attachments } = await supabaseAdmin
            .from('message_attachments')
            .select('*')
            .eq('message_id', messageId)
            .order('created_at', { ascending: true });

        // 5. Generate Signed URLs for attachments
        const attachmentUrls = [];
        if (attachments && attachments.length > 0) {
            for (const att of attachments) {
                // If public, we might not need signed URL, but sticking to secure pattern
                const { data: signedData } = await supabaseAdmin.storage
                    .from('memories')
                    .createSignedUrl(att.file_path, 3600); // 1 Hour

                if (signedData?.signedUrl) {
                    attachmentUrls.push({
                        url: signedData.signedUrl,
                        type: att.file_type,
                        size: att.file_size
                    });
                }
            }
        }

        return {
            success: true,
            content: message.content,
            recipientName: message.recipient_name,
            recipientRelationship: message.recipient_relationship,
            senderName,
            attachments: attachmentUrls,
            date: message.created_at
        };

    } catch (err: any) {
        console.error("getUnlockedMessageContent error:", err);
        return { error: err.message };
    }
}
