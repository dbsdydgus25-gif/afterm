import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Resume a cancelled Pro subscription
 * Sets auto_renew back to true
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log(`User ${user.id} resuming subscription`);

        // Update auto_renew to true
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                auto_renew: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error("Update error:", updateError);
            return NextResponse.json({ error: "Failed to resume subscription: " + updateError.message }, { status: 500 });
        }

        // Update user metadata
        await supabase.auth.updateUser({
            data: { auto_renew: true }
        });

        console.log("Subscription resumed successfully");

        return NextResponse.json({
            success: true,
            message: '구독이 재개되었습니다!'
        });

    } catch (error: any) {
        console.error("Resume subscription error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
