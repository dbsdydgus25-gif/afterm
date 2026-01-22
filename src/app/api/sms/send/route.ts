import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipientPhone, recipientName, senderName, messageId } = body;

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

        // 링크 생성 (도메인은 환경변수 또는 요청 헤더에서 가져옴)
        // 로컬 테스트를 위해 localhost 분기 처리 가능하나, 일단 프로덕션 도메인 고려
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const domain = `${protocol}://${host}`;
        const link = `${domain}/view/${messageId}`;

        const text = `[AFTERM]\n${senderName}님이 남기신 소중한 메시지가 있습니다.\n\n나중에 부재 시 열람하실 수 있습니다.\n\n확인하기: ${link}`;

        const result = await messageService.sendOne({
            to: recipientPhone,
            from: senderPhone,
            text: text,
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("SMS send error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send SMS" },
            { status: 500 }
        );
    }
}
