import { NextResponse } from "next/server";
import { processAbsenceChecks } from "@/lib/absence";
import { getErrorMessage } from "@/lib/error";

// This route serves as a public wrapper to trigger the Cron Job internally.
// IN PRODUCTION, THIS SHOULD BE PROTECTED OR DISABLED.
// For this testing phase, we allow it.

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get('messageId') || undefined;

        console.log(`[Manual Cron] Triggering processAbsenceChecks directly... (Target: ${messageId || 'ALL'})`);

        // Call the shared logic directly (Bypassing HTTP/Auth)
        const result = await processAbsenceChecks(messageId);

        return NextResponse.json({
            message: "Manual Trigger Executed Successfully",
            result
        });

    } catch (error: unknown) {
        console.error("[Manual Cron] Error:", error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
