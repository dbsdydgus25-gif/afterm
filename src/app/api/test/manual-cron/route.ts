import { NextResponse } from "next/server";

// This route serves as a public wrapper to trigger the protected Cron Job internally.
// IN PRODUCTION, THIS SHOULD BE PROTECTED OR DISABLED.
// For this testing phase, we allow it.

export async function GET(request: Request) {
    try {
        // Call the internal cron logic or valid HTTPS URL
        // Calling localhost URL inside container might be tricky depending on env.
        // It's safer to import the GET function from the cron route if possible, 
        // but Next.js App Router exports are tricky to call directly due to Request/Response types.

        // Let's use fetch to the public URL with the secret.
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr';
        const cronUrl = `${siteUrl}/api/cron/process-absence-checks`;

        const res = await fetch(cronUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        });

        const data = await res.json();

        return NextResponse.json({
            message: "Manual Trigger Attempted",
            cronStatus: res.status,
            cronResult: data
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
