import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Cron job to expire subscriptions
 * Runs daily to check for Pro subscriptions that have ended and auto_renew is false
 * Downgrades to Basic and archives messages (keep most recent one)
 */
export async function GET(request: Request) {
    try {
        // Verify this is called by Vercel Cron (optional but recommended)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error("Unauthorized cron request");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("=== SUBSCRIPTION EXPIRATION CRON JOB STARTED ===");

        const supabase = await createClient();

        // Find all Pro users with expired subscriptions and auto_renew = false
        const { data: expiredUsers, error: fetchError } = await supabase
            .from('profiles')
            .select('id, subscription_end_date, plan')
            .eq('plan', 'pro')
            .eq('auto_renew', false)
            .lt('subscription_end_date', new Date().toISOString());

        if (fetchError) {
            console.error("Error fetching expired subscriptions:", fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        console.log(`Found ${expiredUsers?.length || 0} expired subscriptions`);

        if (!expiredUsers || expiredUsers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No expired subscriptions to process',
                count: 0
            });
        }

        let successCount = 0;
        let errorCount = 0;

        // Process each expired subscription
        for (const user of expiredUsers) {
            try {
                console.log(`Processing user ${user.id}...`);

                // Archive all messages except the most recent one
                const { data: messages } = await supabase
                    .from('messages')
                    .select('id, created_at')
                    .eq('user_id', user.id)
                    .eq('archived', false)
                    .order('created_at', { ascending: false });

                if (messages && messages.length > 1) {
                    const messagesToArchive = messages.slice(1).map(m => m.id);

                    const { error: archiveError } = await supabase
                        .from('messages')
                        .update({ archived: true })
                        .in('id', messagesToArchive);

                    if (archiveError) {
                        console.error(`Error archiving messages for user ${user.id}:`, archiveError);
                        errorCount++;
                        continue;
                    }

                    console.log(`Archived ${messagesToArchive.length} messages for user ${user.id}`);
                }

                // Downgrade to Basic plan
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        plan: 'free',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (updateError) {
                    console.error(`Error downgrading user ${user.id}:`, updateError);
                    errorCount++;
                    continue;
                }

                console.log(`Successfully downgraded user ${user.id} to Basic`);
                successCount++;

            } catch (error) {
                console.error(`Error processing user ${user.id}:`, error);
                errorCount++;
            }
        }

        console.log(`=== CRON JOB COMPLETED: ${successCount} success, ${errorCount} errors ===`);

        return NextResponse.json({
            success: true,
            message: 'Subscription expiration cron job completed',
            total: expiredUsers.length,
            successCount,
            errorCount
        });

    } catch (error: any) {
        console.error("Cron job error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
