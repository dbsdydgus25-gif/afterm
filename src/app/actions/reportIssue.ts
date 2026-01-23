'use server';

import { createClient } from '@supabase/supabase-js';
import { notifySenderOfView } from './notifySenderOfView';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function reportIssue(messageId: string) {
    if (!messageId) return { success: false, error: "Message ID missing" };

    try {
        // 1. Check current status
        const { data: message, error: fetchError } = await supabaseAdmin
            .from('messages')
            .select('verification_status')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            return { success: false, error: "Message not found" };
        }

        // 이미 프로세스가 진행 중이거나 완료된 경우 중복 실행 방지
        update_status: if (message.verification_status !== 'idle' && message.verification_status !== null) {
            // 이미 신고된 상태라면 성공으로 간주하고 반환 (UI에서 처리)
            return { success: true, status: message.verification_status };
        }

        // 2. Update Status to 'report_received'
        const { error: updateError } = await supabaseAdmin
            .from('messages')
            .update({
                verification_status: 'report_received',
                report_received_at: new Date().toISOString(),
                verify_attempt_count: 0
            })
            .eq('id', messageId);

        if (updateError) {
            console.error("Failed to report issue:", updateError);
            return { success: false, error: "Database update failed" };
        }

        // 3. Immediately notify sender via email (Optional but good for UX)
        // 기존 notifySenderOfView 재사용 (단, 맥락이 조금 다르므로 추후 분리 가능)
        // 여기선 "누군가 열람 시도" 알림이 이미 갔을 것이므로 생략하거나,
        // "비상 상황이 리포트되었습니다"라는 별도 이메일을 보낼 수도 있음.
        // 일단은 상태 변경에 집중.

        return { success: true, status: 'report_received' };

    } catch (err: any) {
        console.error("Report issue error:", err);
        return { success: false, error: err.message };
    }
}
