import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("=== PLAN CHANGE API CALLED ===");

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("Auth check:", { userId: user?.id, authError });

        if (authError || !user) {
            console.error("Auth error:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        console.log("Request body:", body);

        const { targetPlan } = body;

        if (!targetPlan || !['free', 'pro'].includes(targetPlan)) {
            console.error("Invalid plan:", targetPlan);
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        console.log(`User ${user.id} changing to ${targetPlan}`);

        // Get current plan
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        console.log("Profile fetch:", { profile, profileError });

        if (profileError) {
            console.error("Profile fetch error:", profileError);
            return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
        }

        const currentPlan = profile?.plan || 'free';
        console.log("Current plan:", currentPlan, "Target plan:", targetPlan);

        // Handle Pro -> Basic downgrade
        if (currentPlan === 'pro' && targetPlan === 'free') {
            console.log("Downgrading from Pro to Basic - archiving messages");

            // Get all messages ordered by created_at DESC
            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('id, created_at, archived')
                .eq('user_id', user.id)
                .eq('archived', false)
                .order('created_at', { ascending: false });

            console.log("Messages fetch:", { count: messages?.length, error: messagesError });

            if (messagesError) {
                console.error("Messages fetch error:", messagesError);
                return NextResponse.json({ error: "Failed to fetch messages: " + messagesError.message }, { status: 500 });
            }

            if (messages && messages.length > 1) {
                // Keep the most recent one, archive the rest
                const messagesToArchive = messages.slice(1).map(m => m.id);
                console.log("Archiving messages:", messagesToArchive);

                const { error: archiveError } = await supabase
                    .from('messages')
                    .update({ archived: true })
                    .in('id', messagesToArchive);

                if (archiveError) {
                    console.error("Archive error:", archiveError);
                    return NextResponse.json({ error: "Failed to archive messages: " + archiveError.message }, { status: 500 });
                }

                console.log(`Archived ${messagesToArchive.length} messages`);
            }
        }

        // Handle Basic -> Pro upgrade
        if (currentPlan === 'free' && targetPlan === 'pro') {
            console.log("Upgrading from Basic to Pro - restoring archived messages");

            // Restore all archived messages
            const { error: restoreError } = await supabase
                .from('messages')
                .update({ archived: false })
                .eq('user_id', user.id)
                .eq('archived', true);

            if (restoreError) {
                console.error("Restore error:", restoreError);
                return NextResponse.json({ error: "Failed to restore messages: " + restoreError.message }, { status: 500 });
            }

            console.log("Restored archived messages");
        }

        // Update plan in profiles table
        console.log("Updating profile...");
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan: targetPlan,
                subscription_tier: targetPlan,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error("Profile update error:", updateError);
            return NextResponse.json({ error: "Failed to update plan: " + updateError.message }, { status: 500 });
        }

        console.log("Profile updated successfully");

        // Update user metadata for immediate reflection
        console.log("Updating user metadata...");
        const { error: metadataError } = await supabase.auth.updateUser({
            data: { plan: targetPlan }
        });

        if (metadataError) {
            console.error("Metadata update error:", metadataError);
            // Don't fail the request for metadata error
        }

        console.log(`Plan changed successfully to ${targetPlan}`);

        return NextResponse.json({
            success: true,
            plan: targetPlan,
            message: targetPlan === 'pro' ? '프로 플랜으로 업그레이드되었습니다!' : '베이직 플랜으로 변경되었습니다.'
        });

    } catch (error: any) {
        console.error("Plan change error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
