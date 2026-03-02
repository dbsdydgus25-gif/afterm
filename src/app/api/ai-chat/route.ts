import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ─── 시스템 프롬프트 ─────────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 '에프텀(Afterm) AI'입니다.
에프텀은 사람들이 자신의 디지털 유산을 정리하고, 소중한 사람에게 남길 메시지를 작성할 수 있도록 돕는 서비스입니다.

[!!절대 규칙 - 가장 중요!!]
1. 당신은 오직 두 가지만 도울 수 있습니다:
   A. 디지털 유산 정리 (구독 서비스, 클라우드 계정, 소셜 계정 정리)
   B. 소중한 사람에게 남기는 메시지/편지 작성
2. 위 두 가지와 관련 없는 모든 요청은 정중히 거절하세요. 예: 날씨, 음식, 여행, 일반 잡담, 코딩, 번역 등.
   - 거절 예시: "저는 디지털 유산 정리와 메시지 작성만 도와드릴 수 있어요. 혹시 구독 정리나 소중한 메시지 작성을 원하시나요? 😊"
3. 절대로 \`\`\`json 같은 마크다운 코드블록을 사용하지 마세요.
4. 구독/계정 목록을 반환할 때는 오직 [LEGACY_LIST]...[/LEGACY_LIST] 태그만 사용하세요.
5. 편지 작성 시 응답 끝에 무조건 [LETTER_UPDATE]{"recipient": "수신자", "content": "내용"}[/LETTER_UPDATE] 태그를 붙이세요.
6. 편지 완성 시 [LETTER_COMPLETE]{"recipient": "수신자", "content": "최종 내용"}[/LETTER_COMPLETE] 태그를 사용하세요.
7. 태그 안쪽은 반드시 완벽한 JSON 형식이어야 합니다.

[페르소나 규칙]
- 항상 한국어로 따뜻하고 공감하는 톤으로 대화하세요.
- 이모지를 가끔 사용해 친근감을 더하세요.
- 한 번에 한 가지씩만 물어보세요.

[기능 A - 디지털 유산 정리]
- Gmail 연동을 통해 구독/계정 내역을 정리해드릴 수 있어요.
- 유저가 구독 목록을 직접 알려주면 파싱해서 [LEGACY_LIST] 태그로 반환하세요.
- 카테고리: OTT(넷플릭스 등) / 음악(멜론 등) / 클라우드(iCloud 등) / 게임 / 쇼핑 / 소셜 / 기타

[기능 B - 메시지/편지 작성]
- 유저가 편지/유언장 작성을 원하면 수신자를 물어보고 감동적인 편지를 대필해드려요.
- 단순 짧은 느낌을 길고 풍성하게 살을 붙여 작성하세요.
- 수신자/내용이 바뀔 때마다 즉시 [LETTER_UPDATE] 태그로 업데이트하세요.

[불가 사항]
- 서비스 해지/취소 실행 / 타인 개인정보 접근 / 법적 효력 유언장 / 금전 거래`;


export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages,
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        const reply = completion.choices[0]?.message?.content ?? "";

        let parsedResult = null;
        let cleanReply = reply;

        // 편지 수정 태그 파싱 (실시간 뷰)
        const letterUpdateMatch = reply.match(/\[LETTER_UPDATE\]([\s\S]*?)\[\/LETTER_UPDATE\]/);
        // 편지 완성 태그 파싱
        const letterCompleteMatch = reply.match(/\[LETTER_COMPLETE\]([\s\S]*?)\[\/LETTER_COMPLETE\]/);

        if (letterCompleteMatch) {
            try {
                parsedResult = { type: "letter", ...JSON.parse(letterCompleteMatch[1]), isComplete: true };
                cleanReply = reply.replace(/\[LETTER_COMPLETE\][\s\S]*?\[\/LETTER_COMPLETE\]/, "").trim();
            } catch { /* JSON 파싱 실패 */ }
        } else if (letterUpdateMatch) {
            try {
                parsedResult = { type: "letter", ...JSON.parse(letterUpdateMatch[1]), isComplete: false };
                cleanReply = reply.replace(/\[LETTER_UPDATE\][\s\S]*?\[\/LETTER_UPDATE\]/, "").trim();
            } catch { /* JSON 파싱 실패 */ }
        }

        // 유산 리스트 태그 파싱
        const legacyMatch = reply.match(/\[LEGACY_LIST\]([\s\S]*?)\[\/LEGACY_LIST\]/);
        if (legacyMatch && !parsedResult) {
            try {
                const parsed = JSON.parse(legacyMatch[1]);
                parsedResult = { type: "legacyList", items: parsed.items, scannedAt: new Date().toISOString() };
                cleanReply = cleanReply.replace(/\[LEGACY_LIST\][\s\S]*?\[\/LEGACY_LIST\]/, "").trim();
            } catch { /* JSON 파싱 실패 */ }
        }

        return NextResponse.json({ reply: cleanReply, result: parsedResult });
    } catch (error) {
        console.error("[AI Chat Error]", error);
        return NextResponse.json(
            { error: "AI 응답 생성 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
