import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * TEST ONLY: Manually trigger 48-hour check
 * This simulates 48 hours passing by setting stage2_sent_at to 49 hours ago
 */
export async function POST(request: Request) {
    try {
        const { messageId } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: "messageId required" }, { status: 400 });
        }

        // 1. Get current message
        const { data: message, error: fetchError } = await supabaseAdmin
            .from('messages')
            .select('id, absence_check_stage, stage2_sent_at')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            return NextResponse.json({
                error: "Message not found",
                details: fetchError?.message
            }, { status: 404 });
        }

        if (message.absence_check_stage !== 2) {
            return NextResponse.json({
                error: "Message must be in stage 2 (48h wait)",
                currentStage: message.absence_check_stage
            }, { status: 400 });
        }

        // 2. Set stage2_sent_at to 49 hours ago
        const fortyNineHoursAgo = new Date(Date.now() - (49 * 60 * 60 * 1000));

        const { error: updateError } = await supabaseAdmin
            .from('messages')
            .update({ stage2_sent_at: fortyNineHoursAgo.toISOString() })
            .eq('id', messageId);

        if (updateError) {
            return NextResponse.json({
                error: "Update failed",
                details: updateError.message
            }, { status: 500 });
        }

        // 3. Manually call cron endpoint
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const cronResponse = await fetch(`${siteUrl}/api/cron/verify`, {
            method: 'GET'
        });

        const cronResult = await cronResponse.json();

        return NextResponse.json({
            success: true,
            message: "Time fast-forwarded to 49 hours ago, cron triggered",
            cronResult
        });

    } catch (error: any) {
        console.error("Test trigger error:", error);
        return NextResponse.json({
            error: "Internal error",
            details: error.message
        }, { status: 500 });
    }
}
