import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Simulating Payment Success & Upgrading User
        // 1. Update Profile (Source of Truth)
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan: 'pro',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error("DB Update Failed:", updateError);
            return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
        }

        // 2. (Optional) Log to dummy payments table if it existed
        // ...

        return NextResponse.json({ success: true, message: "Upgraded to Pro" });

    } catch (error: any) {
        console.error("Mock Payment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
