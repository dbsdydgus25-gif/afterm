import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';
import { getErrorMessage } from "@/lib/error";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Support both parameter styles:
        // 1. Vault/Direct: { phone, message }
        // 2. Memory Message (Legacy): { recipientPhone, recipientName, senderName, messageId }

        const destination = body.recipientPhone || body.phone;
        const directMessage = body.message || body.text;

        const { senderName, messageId } = body;

        const apiKey = process.env.SOLAPI_API_KEY;
        const apiSecret = process.env.SOLAPI_API_SECRET;
        const senderPhone = process.env.SOLAPI_SENDER_NUMBER;

        if (!apiKey || !apiSecret || !senderPhone) {
            const missing = [];
            if (!apiKey) missing.push('SOLAPI_API_KEY');
            if (!apiSecret) missing.push('SOLAPI_API_SECRET');
            if (!senderPhone) missing.push('SOLAPI_SENDER_NUMBER');

            console.error(`Solapi environment variables missing: ${missing.join(', ')}`);
            return NextResponse.json(
                { error: `SMS configuration missing: ${missing.join(', ')}` },
                { status: 500 }
            );
        }

        const messageService = new SolapiMessageService(apiKey, apiSecret);
        let textToSend = '';

        // Case 1: Direct Message (Vault)
        if (directMessage) {
            textToSend = directMessage;
        }
        // Case 2: Memory Message (Legacy) - Requires messageId
        else {
            // Critical Check: messageId가 없으면 절대 발송하지 않음 (비용 절감)
            if (!messageId || messageId.toString().trim() === '') {
                return NextResponse.json(
                    { error: "Message ID is missing. Aborting SMS send to prevent cost." },
                    { status: 400 } // Bad Request
                );
            }

            // 링크 생성 (도메인은 환경변수 또는 요청 헤더에서 가져옴)
            const domain = 'https://www.afterm.co.kr';
            const link = `${domain}/view/${messageId.toString().trim()}`;

            textToSend = `[에프텀] ${senderName}님이 보낸 소중한 메시지가 도착했습니다. 아래 링크를 터치하여 확인해 주세요.\n\n${link}\n\n`;
        }

        const result = await messageService.sendOne({
            to: destination,
            from: senderPhone,
            text: textToSend,
            subject: "[AFTERM] 소중한 메시지 도착", // LMS 제목
            // Solapi LMS 타입 지정
            type: 'LMS'
        });

        return NextResponse.json({ success: true, result });
    } catch (error: unknown) {
        console.error("SMS send error:", error);
        return NextResponse.json(
            { error: getErrorMessage(error) || "Failed to send SMS" },
            { status: 500 }
        );
    }
}
