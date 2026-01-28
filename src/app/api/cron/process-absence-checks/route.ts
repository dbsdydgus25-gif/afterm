import { NextResponse } from "next/server";
import { processAbsenceChecks } from "@/lib/absence";

/**
 * Cron job to process absence verification stages
 * Runs according to vercel.json schedule.
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("=== ABSENCE VERIFICATION CRON JOB STARTED (Scheduled) ===");

        const result = await processAbsenceChecks();

        return NextResponse.json({
            success: true,
            cronResult: result
        });

    } catch (error: any) {
        console.error("Absence verification cron error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 });
    }
}
