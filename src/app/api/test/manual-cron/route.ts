import { NextResponse } from "next/server";
import { processAbsenceChecks } from "@/lib/absence";

// This route serves as a public wrapper to trigger the Cron Job internally.
// IN PRODUCTION, THIS SHOULD BE PROTECTED OR DISABLED.
// For this testing phase, we allow it.

export async function GET(request: Request) {
    try {
        console.log("[Manual Cron] Triggering processAbsenceChecks directly...");

        // Call the shared logic directly (Bypassing HTTP/Auth)
        const result = await processAbsenceChecks();

        return NextResponse.json({
            message: "Manual Trigger Executed Successfully",
            result
        });

    } catch (error: any) {
        console.error("[Manual Cron] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
