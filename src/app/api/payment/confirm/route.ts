import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TOSS_PAYMENTS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;

export async function POST(request: Request) {
    try {
        console.log("=== PAYMENT CONFIRM API CALLED ===");

        const body = await request.json();
        const { paymentKey, orderId, amount, billingCycle, userId } = body;

        console.log("Payment Data:", { paymentKey, orderId, amount, billingCycle, userId });

        if (!paymentKey || !orderId || !amount) {
            return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
        }

        // 1. Verify Payment with Toss Payments API
        const encryptedSecretKey = Buffer.from(`${TOSS_PAYMENTS_SECRET_KEY}:`).toString('base64');
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${encryptedSecretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const paymentData = await response.json();
        console.log("Toss Response:", paymentData);

        if (!response.ok) {
            console.error("Payment confirmation failed:", paymentData);
            return NextResponse.json({
                error: paymentData.message || "Payment confirmation failed",
                code: paymentData.code
            }, { status: response.status });
        }

        // 2. Payment Successful -> Extend Subscription
        const supabase = await createClient();

        // 2-1. Get current profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error("Profile fetch error:", profileError);
            return NextResponse.json({ error: "Profile not found" }, { status: 500 });
        }

        // 2-2. Calculate new end date
        const now = new Date();
        let baseDate = now;

        if (profile.subscription_end_date) {
            const currentEndDate = new Date(profile.subscription_end_date);
            // Only extend if current end date is in future
            if (currentEndDate > now) {
                baseDate = currentEndDate;
            }
        }

        const newEndDate = new Date(baseDate);
        if (billingCycle === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else {
            newEndDate.setDate(newEndDate.getDate() + 30); // 30 days for monthly
        }

        console.log(`Extending subscription: ${baseDate.toISOString()} -> ${newEndDate.toISOString()}`);

        // 2-3. Update Profile
        // Force plan to 'pro' since they paid
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan: 'pro',
                billing_cycle: billingCycle, // Update to last purchased cycle
                subscription_end_date: newEndDate.toISOString(),
                updated_at: new Date().toISOString()
                // Do NOT set auto_renew since it's one-time
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Profile update error:", updateError);
            return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
        }

        // 2-4. Restore archived messages (if any)
        await supabase
            .from('messages')
            .update({ archived: false })
            .eq('user_id', userId)
            .eq('archived', true);

        // 2-5. Update User Metadata (Client session sync)
        await supabase.auth.updateUser({
            data: { plan: 'pro' }
        });

        return NextResponse.json({
            success: true,
            message: "이용권 구매가 완료되었습니다.",
            newEndDate: newEndDate.toISOString()
        });

    } catch (error: any) {
        console.error("Internal Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
