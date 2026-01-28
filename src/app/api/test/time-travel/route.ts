import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This is a TESTING tool. It should be protected or disabled in production if not for this specific testing phase.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messageId, action } = body;

        console.log(`[TimeTravel] Request: ${action} for ${messageId}`);

        if (!messageId) {
            return NextResponse.json({ error: "Message ID required" }, { status: 400 });
        }

        if (action === "fast-forward-7days") {
            // Set stage1_sent_at to 8 days ago
            const eightDaysAgo = new Date();
            eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

            const { error } = await supabaseAdmin
                .from('messages')
                .update({
                    stage1_sent_at: eightDaysAgo.toISOString(),
                    absence_check_stage: 1 // Ensure stage is 1
                })
                .eq('id', messageId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Fast forwarded 8 days" });
        }

        if (action === "fast-forward-24hours") {
            // Set stage2_sent_at to 25 hours ago
            const twentyFiveHoursAgo = new Date();
            twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);

            const { error } = await supabaseAdmin
                .from('messages')
                .update({
                    stage2_sent_at: twentyFiveHoursAgo.toISOString(),
                    absence_check_stage: 2 // Ensure stage is 2
                })
                .eq('id', messageId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Fast forwarded 25 hours" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
