'use server';

import { createClient } from '@supabase/supabase-js';
import { notifySenderOfView } from './notifySenderOfView';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function reportIssue(messageId: string) {
    if (!messageId) return { success: false, error: "Message ID missing" };
    console.log(`[ReportIssue V2] Start for ${messageId}, Env=${process.env.NODE_ENV}`);

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
        // message.verification_status !== 'idle' 체크를 제거하여,
        // 기존에 잘못된 상태(active + report_received)인 경우에도 다시 Trigger를 걸 수 있게 수정함.
        /*
        update_status: if (message.verification_status !== 'idle' && message.verification_status !== null) {
            return { success: true, status: message.verification_status };
        }
        */

        // 2. Call the trigger start API logic
        // We can call the API endpoint internally or replicate logic.
        // calling fetch('http://localhost:3000/api/trigger/start') might be flaky in Vercel.
        // Better to import the logic or just perform the DB update here matching the API.

        // Let's match the API logic:
        // Set status = TRIGGERED, dead_mans_lock_minutes = 1 (test), etc.

        const { error: updateError } = await supabaseAdmin
            .from('messages')
            .update({
                status: 'TRIGGERED', // This is what Cron looks for
                verification_status: 'report_received', // Keep this for UI tracking?
                trigger_started_at: new Date().toISOString(),
                last_reminder_sent_at: new Date().toISOString(),
                retry_count: 0,
                // dead_mans_lock_minutes: 10080, // 7 days (Production)
                dead_mans_lock_minutes: 10080, // Production: 7 Days
                is_triggered: true
            })
            .eq('id', messageId);

        if (updateError) {
            console.error("Failed to report issue:", updateError);
            return { success: false, error: "Database update failed" };
        }

        // 3. Send the "Confirmation" Email to Sender (Start Notification)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://afterm.co.kr';

        console.log(`[ReportIssue] Calling Trigger API at ${baseUrl}...`);

        try {
            const triggerRes = await fetch(`${baseUrl}/api/trigger/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, type: 'timer' })
            });

            if (!triggerRes.ok) {
                const errText = await triggerRes.text();
                console.error(`[ReportIssue] Trigger API failed: ${triggerRes.status}`, errText);
            } else {
                console.log(`[ReportIssue] Trigger API success:`, await triggerRes.json());
            }
        } catch (e) {
            console.error("Failed to trigger email:", e);
            // Don't fail the request just because email fetch failed, if DB update worked.
        }

        return { success: true, status: 'report_received' };

    } catch (err: any) {
        console.error("Report issue error:", err);
        return { success: false, error: err.message };
    }
}
