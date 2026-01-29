import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("=== FREE TRIAL UPGRADE API CALLED ===");

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { targetPlan } = body;

        // Fetch current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan, subscription_end_date')
            .eq('id', user.id)
            .single();

        const currentPlan = profile?.plan || 'free';

        // 1. Handle Downgrade (Pro -> Free)
        if (targetPlan === 'free') {
            // Logic: Cancel subscription (set auto_renew false) or immediate downgrade?
            // For "Free Trial", usually people want to cancel potential future billing.
            // But we don't have billing yet. So we just let them stay Pro until it expires?
            // Or allow immediate revert to Free?
            // Let's assume immediate revert for now if they WANT to go back to Basic limits.

            // Actually, usually "downgrade" just means turning off auto-renew.
            // But since we are giving 60 days fixed, maybe just keep them as Pro?
            // Let's implement "Cancel" as "Do nothing" or "Set auto_renew = false" (symbolic).
            // Since we won't charge them anyway.

            // If they explicitly want "Basic", we update the plan.
            const { error: downgradeError } = await supabase
                .from('profiles')
                .update({
                    plan: 'free',
                    auto_renew: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (downgradeError) throw downgradeError;

            return NextResponse.json({
                success: true,
                message: "Basic 플랜으로 변경되었습니다."
            });
        }

        // 2. Handle Upgrade (Free -> Pro) or Extension
        if (targetPlan === 'pro') {
            // "2-Month Free Trial" Logic
            // Start Date: Now
            // End Date: Now + 60 days

            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 60); // Add 60 days

            // If already Pro, maybe extend?
            // "현재 이용 중" logic in frontend might prevent calling this, but if they do:
            // Let's just set it to 60 days from NOW (reset/extend).
            // Or add 60 days to current end date? 
            // Let's simply Grant 60 Days from Today (as a trial).

            const { error: upgradeError } = await supabase
                .from('profiles')
                .update({
                    plan: 'pro',
                    subscription_end_date: endDate.toISOString(),
                    billing_cycle: 'monthly', // Default
                    auto_renew: false, // It's a trial, no auto-billing card on file
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (upgradeError) {
                console.error("Upgrade error:", upgradeError);
                return NextResponse.json({ error: "Failed to upgrade" }, { status: 500 });
            }

            // Also restore archived messages if any
            await supabase
                .from('messages')
                .update({ archived: false })
                .eq('user_id', user.id)
                .eq('archived', true);

            return NextResponse.json({
                success: true,
                plan: 'pro',
                endDate: endDate.toISOString(),
                message: '2개월 무료 체험이 시작되었습니다! (60일간 무제한 이용)'
            });
        }

        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    } catch (error: any) {
        console.error("Plan change error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
