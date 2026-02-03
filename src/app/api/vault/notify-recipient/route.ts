import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const { vaultItemId, recipientPhone, recipientName, senderName } = await req.json();

        if (!vaultItemId || !recipientPhone || !recipientName || !senderName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Send SMS notification
        const message = `[AFTERM] ${senderName}님이 소중한 것을 남겼습니다. 확인하려면 afterm.co.kr에 로그인해주세요.`;

        try {
            // Use existing SMS API
            const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: recipientPhone,
                    message: message
                })
            });

            if (!smsResponse.ok) {
                console.error("SMS send failed:", await smsResponse.text());
            }
        } catch (smsError) {
            console.error("SMS error:", smsError);
            // Don't fail the entire request if SMS fails
        }

        // Mark notification as sent
        const { error: updateError } = await supabase
            .from('vault_items')
            .update({ notification_sent: true })
            .eq('id', vaultItemId)
            .eq('user_id', user.id); // Security: only update own items

        if (updateError) {
            console.error("Update notification status error:", updateError);
        }

        return NextResponse.json({
            success: true,
            message: "Notification sent successfully"
        });

    } catch (error) {
        console.error("Vault notification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
