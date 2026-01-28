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

        // Get current plan and subscription info
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan, subscription_end_date, auto_renew, billing_cycle')
            .eq('id', user.id)
            .single();

        console.log("Profile fetch:", { profile, profileError });

        if (profileError) {
            console.error("Profile fetch error:", profileError);
            // Don't fail - continue with default plan
        }

        const currentPlan = profile?.plan || 'free';
        console.log("Current plan:", currentPlan, "Target plan:", targetPlan);

        // Handle Pro -> Basic downgrade (subscription cancellation)
        if (currentPlan === 'pro' && targetPlan === 'free') {
            console.log("Canceling Pro subscription - setting auto_renew to false");

            // Don't change plan immediately - just cancel auto-renewal
            // User keeps Pro until subscription_end_date
            const { error: cancelError } = await supabase
                .from('profiles')
                .update({
                    auto_renew: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (cancelError) {
                console.error("Cancel error:", cancelError);
                return NextResponse.json({ error: "Failed to cancel subscription: " + cancelError.message }, { status: 500 });
            }

            console.log("Subscription cancelled - Pro will end at:", profile?.subscription_end_date);

            // Calculate remaining days
            let remainingDays = 0;
            if (profile?.subscription_end_date) {
                const endDate = new Date(profile.subscription_end_date);
                const now = new Date();
                remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }

            // Update user metadata
            await supabase.auth.updateUser({
                data: { auto_renew: false }
            });

            const endDateFormatted = profile?.subscription_end_date
                ? new Date(profile.subscription_end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                : '';

            return NextResponse.json({
                success: true,
                cancelled: true,
                remainingDays,
                endDate: profile?.subscription_end_date,
                message: `구독이 취소되었습니다. ${endDateFormatted}까지 Pro를 이용할 수 있습니다.`
            });
        }

        // Handle Basic -> Pro upgrade OR Pro Monthly -> Pro Yearly switch
        if ((currentPlan === 'free' && targetPlan === 'pro') ||
            (currentPlan === 'pro' && targetPlan === 'pro')) {

            const { billingCycle = 'monthly' } = body;

            // Check if already on same cycle (default to 'monthly' if null)
            const currentCycle = profile?.billing_cycle || 'monthly';
            if (currentPlan === 'pro' && currentCycle === billingCycle) {
                return NextResponse.json({ error: "이미 이용 중인 플랜입니다." }, { status: 400 });
            }

            console.log(`Processing Pro Upgrade/Switch. Current: ${currentPlan}, Target: ${targetPlan}, Cycle: ${billingCycle}`);

            // Restore all archived messages (idempotent)
            const { error: restoreError } = await supabase
                .from('messages')
                .update({ archived: false })
                .eq('user_id', user.id)
                .eq('archived', true);

            if (restoreError) {
                console.error("Restore error:", restoreError);
                return NextResponse.json({ error: "Failed to restore messages: " + restoreError.message }, { status: 500 });
            }

            // Set subscription dates
            // If switching, we extend from the *current end date* if it exists and is in the future.
            // Otherwise, start from now.
            const now = new Date();
            let baseDate = now;

            if (profile?.subscription_end_date) {
                const currentEndDate = new Date(profile.subscription_end_date);
                if (currentEndDate > now) {
                    baseDate = currentEndDate;
                }
            }

            const renewalDate = new Date(baseDate);

            if (billingCycle === 'yearly') {
                renewalDate.setFullYear(renewalDate.getFullYear() + 1); // Add 1 year
            } else {
                renewalDate.setDate(renewalDate.getDate() + 30); // Add 30 days default
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    plan: 'pro',
                    billing_cycle: billingCycle,
                    subscription_end_date: renewalDate.toISOString(),
                    auto_renew: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error("Profile update error:", updateError);
                return NextResponse.json({ error: "Failed to update plan: " + updateError.message }, { status: 500 });
            }

            // Update user metadata
            await supabase.auth.updateUser({
                data: { plan: 'pro', auto_renew: true }
            });

            return NextResponse.json({
                success: true,
                plan: 'pro',
                billingCycle,
                message: billingCycle === 'yearly' ? '연간 프로 플랜으로 변경되었습니다!' : '프로 플랜으로 변경되었습니다!'
            });
        }

        // If we reach here, it means invalid plan transition
        console.error("Invalid plan transition:", { currentPlan, targetPlan });
        return NextResponse.json({ error: "Invalid plan transition" }, { status: 400 });

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
