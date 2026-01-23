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

        // Critical Check: messageId가 없으면 절대 발송하지 않음 (비용 절감)
        if (!messageId || messageId.toString().trim() === '') {
            return NextResponse.json(
                { error: "Message ID is missing. Aborting SMS send to prevent cost." },
                { status: 400 } // Bad Request
            );
        }

        const messageService = new SolapiMessageService(apiKey, apiSecret);

        // 링크 생성 (도메인은 환경변수 또는 요청 헤더에서 가져옴)
        // 링크 생성 로직 개선
        const host = req.headers.get('host');

        // Vercel Preview Auth 문제 해결 및 링크 정확성을 위해 프로덕션 도메인 강제 사용
        const domain = 'https://www.afterm.co.kr';
        // domain = (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ...) // 기존 로직 주석 처리

        const link = `${domain}/view/${messageId.toString().trim()}`;

        // 사용자 요청 포맷 적용:
        // 1. [에프텀] 헤더
        // 2. 안내 멘트 후 줄바꿈 2번 (\n\n)
        // 3. 링크 앞뒤 공백 ( ${link} )
        const text = `[에프텀] ${senderName}님이 보낸 소중한 메시지가 도착했습니다. 아래 링크를 터치하여 확인해 주세요.\n\n ${link} `;

        const result = await messageService.sendOne({
            to: recipientPhone,
            from: senderPhone,
            text: text,
            subject: "[AFTERM] 소중한 메시지 도착", // LMS 제목
            // @ts-ignore: Solapi type definition might be strict, but 'LMS' is supported
            type: 'LMS'
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
