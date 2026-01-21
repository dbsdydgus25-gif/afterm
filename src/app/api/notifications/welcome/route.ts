import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/solapi/client";

export async function POST(request: Request) {
    try {
        const { phone, name } = await request.json();

        if (!phone || !name) {
            return NextResponse.json({ error: "Missing 'phone' or 'name'" }, { status: 400 });
        }

        // Clean phone number (remove hyphens)
        const cleanPhone = phone.replace(/-/g, '');

        const messageText = `[에프텀] ${name}님, 가입을 환영합니다.
소중한 사람들에게 전할 이야기를 지금 바로 남겨보세요.

당신의 이야기는 영원히 기억될 것입니다.`;

        const result = await sendMessage({
            to: cleanPhone,
            text: messageText,
            type: 'LMS' // LMS limits are higher, safe for this length
        });

        if (result.success) {
            return NextResponse.json({ success: true, data: result.data });
        } else {
            console.error("SMS Send Failed:", result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Welcome API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
