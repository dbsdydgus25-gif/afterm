import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const envCheck = {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
            key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
            keyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
        };

        if (envCheck.key === 'MISSING') {
            return NextResponse.json({ error: "Service Role Key Missing", envCheck }, { status: 500 });
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('messages')
            .select('id, status, is_triggered, trigger_started_at, last_reminder_sent_at, dead_mans_lock_minutes, retry_count')
            // .eq('status', 'TRIGGERED') // Commented out to see ALL
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        return NextResponse.json({
            serverTime: new Date().toISOString(),
            envCheck,
            messages: data
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
