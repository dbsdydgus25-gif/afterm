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

        if (action === "fast-forward-48hours") {
            // Set stage2_sent_at to 49 hours ago to trigger unlock
            const fortyNineHoursAgo = new Date();
            fortyNineHoursAgo.setHours(fortyNineHoursAgo.getHours() - 49);

            const { error } = await supabaseAdmin
                .from('messages')
                .update({
                    stage2_sent_at: fortyNineHoursAgo.toISOString(),
                    absence_check_stage: 2 // Ensure stage is 2
                })
                .eq('id', messageId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Fast forwarded 49 hours" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
