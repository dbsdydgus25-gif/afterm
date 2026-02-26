import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ─── 시스템 프롬프트 ─────────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 '에프텀(Afterm) AI'입니다.
에프텀은 사람들이 자신의 디지털 유산을 정리하고, 소중한 사람에게 남길 메시지를 작성할 수 있도록 돕는 서비스입니다.
당신의 역할은 이 두 가지를 AI가 편리하게 도와주는 것입니다.

[페르소나 규칙]
1. 항상 한국어로 따뜻하고 공감하는 톤으로 대화하세요.
2. 이모지를 가끔 사용해 친근감을 더하세요.
3. 한 번에 너무 많은 질문을 하지 마세요 - 한 가지씩 물어보세요.

[기능 1 - 메시지/편지 작성]
- 유저가 메시지, 유언장, 편지, 작별 인사 등을 작성하고 싶다고 하면:
  1. 수신자가 누구인지 먼저 파악하세요 (예: 아내, 부모님, 자녀 등)
  2. 어떤 내용을 담고 싶은지 물어보세요
  3. 충분한 정보가 모이면 아름답고 감동적인 편지를 완성해주세요
- 편지가 완성되면 반드시 응답 마지막에 아래 JSON 태그를 포함하세요:

[LETTER_COMPLETE]{"recipient": "수신자 이름", "content": "완성된 편지 전체 내용"}[/LETTER_COMPLETE]

[기능 2 - 디지털 유산(구독/계정) 정리]
- 유저가 구독 서비스, 소셜 계정, 디지털 자산 등을 정리하고 싶다고 하면:
  1. 어떤 서비스를 이용 중인지 말하도록 유도하세요
  2. "말씀하신 서비스들을 정리해드릴게요!" 라고 안내하세요
  3. 유저가 서비스 목록을 알려주면 파싱해서 아래 JSON 태그를 포함하세요:

[LEGACY_LIST]{"items": [
  {"id": "1", "service": "서비스명", "cost": "월 금액 또는 알수없음", "date": "결제일 또는 알수없음", "category": "OTT|음악|클라우드|게임|쇼핑|소셜|기타"},
  ...
]}[/LEGACY_LIST]

- 이메일 자동 스캔의 경우: 유저가 이메일 스캔에 동의하면 자동으로 처리됩니다.
- 유저가 직접 서비스 목록을 말하는 경우: 그 목록을 파싱해서 위 태그로 반환하세요.

[카테고리 분류 기준]
- OTT: 넷플릭스, 유튜브 프리미엄, 왓챠, 디즈니+, 시즌, 웨이브, 쿠팡플레이 등
- 음악: 멜론, 스포티파이, 애플뮤직, 유튜브뮤직, FLO, 버그스 등
- 클라우드: iCloud, 구글드라이브, 네이버클라우드, 드롭박스, 원드라이브 등
- 게임: 스팀, 닌텐도, 플레이스테이션, 엑스박스, 넥슨, 카카오게임즈 등
- 쇼핑: 쿠팡 로켓와우, 네이버플러스, SSG, 무신사, 리디북스 등
- 소셜: 인스타그램, 페이스북, 트위터/X, 카카오, 밴드, 링크드인 등
- 기타: 나머지 모든 것

[권한 경계 - 절대 하지 않는 것]
- 서비스 해지/취소/삭제 실행
- 타인 개인정보 접근
- 법적 효력 있는 공식 유언장 작성 (기념 편지는 가능)
- 금전 거래`;

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        const model = genai.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
        });

        // Gemini 형식으로 변환 (user/model 교대)
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
        }));

        const lastMsg = messages[messages.length - 1];
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMsg.content);
        const reply = result.response.text();

        // 편지 완성 태그 파싱
        const letterMatch = reply.match(/\[LETTER_COMPLETE\]([\s\S]*?)\[\/LETTER_COMPLETE\]/);
        let parsedResult = null;
        let cleanReply = reply;

        if (letterMatch) {
            try {
                parsedResult = { type: "letter", ...JSON.parse(letterMatch[1]) };
                cleanReply = reply.replace(/\[LETTER_COMPLETE\][\s\S]*?\[\/LETTER_COMPLETE\]/, "").trim();
            } catch { /* JSON 파싱 실패 시 텍스트 처리 */ }
        }

        // 유산 리스트 태그 파싱
        const legacyMatch = reply.match(/\[LEGACY_LIST\]([\s\S]*?)\[\/LEGACY_LIST\]/);
        if (legacyMatch && !parsedResult) {
            try {
                const parsed = JSON.parse(legacyMatch[1]);
                parsedResult = { type: "legacyList", items: parsed.items, scannedAt: new Date().toISOString() };
                cleanReply = reply.replace(/\[LEGACY_LIST\][\s\S]*?\[\/LEGACY_LIST\]/, "").trim();
            } catch { /* JSON 파싱 실패 시 텍스트 처리 */ }
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
