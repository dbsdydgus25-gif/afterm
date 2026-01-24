import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Disabled by user request.
    // No "Dead Man's Switch" processing.
    return NextResponse.json({ processed: 0, status: 'disabled' });
}
