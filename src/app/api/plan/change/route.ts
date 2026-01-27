import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetPlan } = await request.json();

        if (!targetPlan || !['free', 'pro'].includes(targetPlan)) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        console.log(`=== PLAN CHANGE: User ${user.id} changing to ${targetPlan} ===`);

        // Get current plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        const currentPlan = profile?.plan || 'free';

        // Handle Pro -> Basic downgrade
        if (currentPlan === 'pro' && targetPlan === 'free') {
            console.log("Downgrading from Pro to Basic - archiving messages");

            // Get all messages ordered by created_at DESC
            const { data: messages } = await supabase
                .from('messages')
                .select('id, created_at')
                .eq('user_id', user.id)
                .eq('archived', false)
                .order('created_at', { ascending: false });

            if (messages && messages.length > 1) {
                // Keep the most recent one, archive the rest
                const messagesToArchive = messages.slice(1).map(m => m.id);

                const { error: archiveError } = await supabase
                    .from('messages')
                    .update({ archived: true })
                    .in('id', messagesToArchive);

                if (archiveError) {
                    console.error("Archive error:", archiveError);
                    return NextResponse.json({ error: "Failed to archive messages" }, { status: 500 });
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
                return NextResponse.json({ error: "Failed to restore messages" }, { status: 500 });
            }

            console.log("Restored archived messages");
        }

        // Update plan in profiles table
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
            return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
        }

        // Update user metadata for immediate reflection
        await supabase.auth.updateUser({
            data: { plan: targetPlan }
        });

        console.log(`Plan changed successfully to ${targetPlan}`);

        return NextResponse.json({
            success: true,
            plan: targetPlan,
            message: targetPlan === 'pro' ? '프로 플랜으로 업그레이드되었습니다!' : '베이직 플랜으로 변경되었습니다.'
        });

    } catch (error) {
        console.error("Plan change error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
