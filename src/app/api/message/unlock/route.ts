import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const { messageId, phone, code } = await request.json();

        if (!messageId || !code) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let cleanPhone = phone ? phone.replace(/-/g, '') : null;
        const supabaseAdmin = createAdminClient();

        // If phone is missing, try to find it via Message -> Sender
        if (!cleanPhone) {
            const { data: msgInfo } = await supabaseAdmin
                .from('messages')
                .select('user_id')
                .eq('id', messageId)
                .single();

            if (msgInfo?.user_id) {
                const { data: senderInfo } = await supabaseAdmin
                    .from('profiles')
                    .select('phone')
                    .eq('id', msgInfo.user_id)
                    .single();
                if (senderInfo?.phone) {
                    cleanPhone = senderInfo.phone.replace(/-/g, '');
                }
            }
        }

        if (!cleanPhone) {
            return NextResponse.json({ error: "핸드폰 번호를 찾을 수 없습니다." }, { status: 400 });
        }

        // 1. Verify Code
        const { data: verificationData, error: verificationError } = await supabaseAdmin
            .from('verification_codes')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (verificationError || !verificationData) {
            return NextResponse.json({ success: false, error: "인증번호가 만료되었거나 올바르지 않습니다." }, { status: 400 });
        }

        // 2. Verify Message Ownership & Phone Match again
        const { data: message, error: messageError } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (messageError || !message) {
            return NextResponse.json({ success: false, error: "메시지를 찾을 수 없습니다." }, { status: 404 });
        }

        if (message.recipient_phone.replace(/-/g, '') !== cleanPhone) {
            // Check if it matches Sender's phone (Option 1)
            const { data: senderProfile } = await supabaseAdmin
                .from('profiles')
                .select('phone')
                .eq('id', message.user_id)
                .single();

            if (senderProfile?.phone && senderProfile.phone.replace(/-/g, '') === cleanPhone) {
                // Allowed: Sender verification
            } else {
                return NextResponse.json({ success: false, error: "전화번호가 일치하지 않습니다. (수신인 또는 작성자 번호 필요)" }, { status: 403 });
            }
        }

        // 3. Unlock Message (Update Status)
        // Only update if it's not already unlocked or viewable? 
        // Actually, just logging that it was accessed is enough, or changing status to 'READ' or 'UNLOCKED'
        // Let's assume we want to track it.
        await supabaseAdmin
            .from('messages')
            .update({ status: 'UNLOCKED' }) // Ensure this status exists in your schema or use metadata
            .eq('id', messageId);

        // 4. Consume Code
        await supabaseAdmin.from('verification_codes').delete().eq('id', verificationData.id);

        // 5. Return Content
        // Fetch ALL attachments from message_attachments table
        const { data: attachments } = await supabaseAdmin
            .from('message_attachments')
            .select('*')
            .eq('message_id', messageId)
            .order('created_at', { ascending: true });

        // Generate signed URLs for all attachments
        const attachmentUrls = [];
        if (attachments && attachments.length > 0) {
            for (const att of attachments) {
                const { data: signedData } = await supabaseAdmin
                    .storage
                    .from('memories')
                    .createSignedUrl(att.file_path, 3600); // 1 hour

                if (signedData?.signedUrl) {
                    attachmentUrls.push({
                        url: signedData.signedUrl,
                        type: att.file_type,
                        size: att.file_size
                    });
                }
            }
        }

        // Also handle legacy file_path if exists and not in attachments
        let legacyFileUrl = null;
        if (message.file_path) {
            // Check if it's already in attachments
            const isDuplicate = attachments?.some(a => a.file_path === message.file_path);
            if (!isDuplicate) {
                const { data } = await supabaseAdmin
                    .storage
                    .from('memories')
                    .createSignedUrl(message.file_path, 3600);
                if (data?.signedUrl) {
                    legacyFileUrl = data.signedUrl;
                    // Add to attachments list
                    attachmentUrls.unshift({
                        url: data.signedUrl,
                        type: message.file_type,
                        size: message.file_size
                    });
                }
            }
        }

        // 6. Fetch Sender Profile for name
        const { data: senderProfileInfo } = await supabaseAdmin
            .from('profiles')
            .select('full_name, nickname')
            .eq('id', message.user_id)
            .single();

        const senderName = senderProfileInfo?.full_name || senderProfileInfo?.nickname || '작성자';

        return NextResponse.json({
            success: true,
            content: message.content,
            attachments: attachmentUrls, // Array of all attachments
            file_url: attachmentUrls[0]?.url || null, // First file for backward compatibility
            file_type: attachmentUrls[0]?.type || null,
            recipient_name: message.recipient_name,
            sender_name: senderName,
            recipient_relationship: message.recipient_relationship || '',
            created_at: message.created_at
        });

    } catch (error: any) {
        console.error("Unlock Error:", error);
        return NextResponse.json({ error: "메시지 열람 중 오류가 발생했습니다." }, { status: 500 });
    }
}
