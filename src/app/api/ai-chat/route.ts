import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ─── 시스템 프롬프트 ───────────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 '에프텀(Afterm) AI'입니다. 한국인 사용자의 디지털 유산 정리와 소중한 사람에게 남길 마지막 메시지 작성을 도와주는 친절하고 따뜻한 AI입니다.

[페르소나 규칙]
1. 항상 한국어로 대화하세요.
2. 사용자가 어떤 것을 원하는지 천천히, 공감하며 물어보세요. 한 번에 너무 많은 질문을 하지 마세요.
3. 온화하고 신뢰감 있는 톤을 유지하세요. 이모지를 가끔 사용해 친근감을 더하세요.

[권한 경계 - 매우 중요]
다음의 요청은 정중하지만 단호하게 거절해야 합니다:
- 서비스 직접 해지, 계정 삭제, 구독 취소
- 타인의 개인정보 조회, 타인의 메일 접근
- 법적 효력이 있는 공식 유언장 작성 (기념 메시지는 가능, 법적 유언장 불가)
- 금융 이체, 결제 실행 등 금전적 거래

거절 시 반드시: "죄송합니다, 에프텀 AI는 [X] 권한이 없습니다. 대신 [대안]을 도와드릴 수 있어요."  형식으로 대안을 제시하세요.

[편지 작성 완료 감지]
사용자가 편지 작성을 마쳤다고 판단되면, 응답에 아래 JSON을 포함시키세요:
[LETTER_COMPLETE]{"recipient": "수신자 이름", "content": "완성된 편지 내용 전체"}[/LETTER_COMPLETE]

이 태그를 포함시키면 우측 화면에 편지지 에디터가 열립니다.`;

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
            max_tokens: 1000,
            temperature: 0.7,
        });

        const reply = completion.choices[0]?.message?.content ?? "";

        // 편지 완성 태그 파싱
        const letterMatch = reply.match(/\[LETTER_COMPLETE\]([\s\S]*?)\[\/LETTER_COMPLETE\]/);
        let result = null;
        let cleanReply = reply;

        if (letterMatch) {
            try {
                result = { type: "letter", ...JSON.parse(letterMatch[1]) };
                cleanReply = reply.replace(/\[LETTER_COMPLETE\][\s\S]*?\[\/LETTER_COMPLETE\]/, "").trim();
            } catch {
                // JSON 파싱 실패 시 그냥 텍스트로 처리
            }
        }

        return NextResponse.json({ reply: cleanReply, result });
    } catch (error) {
        console.error("[AI Chat Error]", error);
        return NextResponse.json(
            { error: "AI 응답 생성 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
