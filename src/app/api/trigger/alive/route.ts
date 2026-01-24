import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("token"); // messageId

    if (!id) return NextResponse.redirect(new URL('/', request.url)); // simple redirect on error

    const admin = createAdminClient();

    try {
        // Find Message
        const { data: message, error } = await admin
            .from('messages')
            .select('id, user_id, status')
            .eq('id', id)
            .single();

        if (error || !message) throw new Error("Message not found");

        // Reset Trigger
        await admin
            .from('messages')
            .update({
                status: 'LOCKED',
                is_triggered: false,
                trigger_started_at: null,
                retry_count: 0
            })
            .eq('id', id);

        // Redirect to a success page
        return NextResponse.redirect(new URL('/trigger/confimation?status=alive', request.url));

    } catch (e) {
        console.error("Alive Check Error:", e);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
