import { NextResponse } from "next/server";

export async function POST(request: Request) {
    // Disabled by user request.
    return NextResponse.json({ success: true, status: 'disabled' });
}
