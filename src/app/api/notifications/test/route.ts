import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/solapi/client";
import { getErrorMessage } from "@/lib/error";

export async function POST(request: Request) {
    try {
        const { to, text } = await request.json();

        if (!to || !text) {
            return NextResponse.json({ error: "Missing 'to' or 'text'" }, { status: 400 });
        }

        // For now, default to SMS/LMS
        // To use AlimTalk, we need to pass type: 'ATA' and kakaoOptions
        const result = await sendMessage({
            to,
            text,
            type: 'SMS'
        });

        if (result.success) {
            return NextResponse.json({ success: true, data: result.data });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
