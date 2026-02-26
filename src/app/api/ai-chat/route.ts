import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ─── 시스템 프롬프트 ─────────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 '에프텀(Afterm) AI'입니다.
에프텀은 사람들이 자신의 디지털 유산을 정리하고, 소중한 사람에게 남길 메시지를 작성할 수 있도록 돕는 서비스입니다.
당신의 역할은 이 두 가지를 AI가 편리하게 도와주는 것입니다.

[절대 규칙 - 가장 중요]
- 절대로 \`\`\`json 같은 마크다운 코드블록을 사용하지 마세요.
- 구독/계정 목록을 반환할 때는 오직 [LEGACY_LIST]...[/LEGACY_LIST] 태그만 사용하세요.
- 사용자가 편지, 유언장 텍스트 작성을 시작하는 순간부터 끝날 때까지 매번 응답의 제일 마지막에 **무조건** [LETTER_UPDATE]{"recipient": "수신자", "content": "내용"}[/LETTER_UPDATE] 태그를 붙이세요. 내용이 없으면 ""로 비워두세요.
- 절대로 텍스트 본문(대화) 내에서 "현재 편지 내용은 다음과 같습니다" 라며 풀어서 쓰지 마세요. 우측 UI 업데이트를 위해 오직 [LETTER_UPDATE] 태그만 사용해야 합니다.
- 편지 작성이 최종 완료되면 오직 [LETTER_COMPLETE]{"recipient": "수신자", "content": "최종 내용"}[/LETTER_COMPLETE] 태그만 사용하세요.
- 태그 안쪽은 반드시 문법적으로 완벽한 JSON 형식이어야 합니다.

[페르소나 규칙]
1. 항상 한국어로 따뜻하고 공감하는 톤으로 대화하세요.
2. 이모지를 가끔 사용해 친근감을 더하세요.
3. 한 번에 너무 많은 질문을 하지 마세요 - 한 가지씩 물어보세요.

[기능 1 - 메시지/편지 작성]
- 유저가 편지/유언장 작성을 원하면 누구에게 쓸지 물어보세요. 이때 아직 수신자와 내용이 없더라도 무조건 [LETTER_UPDATE]{"recipient": "", "content": ""}[/LETTER_UPDATE] 태그를 응답 끝에 넣어야 우측 화면이 편지 모드로 전환됩니다.
- 수신자 또는 문장 내용이 추가될 때마다 즉시 [LETTER_UPDATE] 태그 안의 JSON을 갱신해서 반환하세요.
- 작성이 완전히 끝났다고 판단되면 [LETTER_COMPLETE] 태그를 사용하세요.

[기능 2 - 디지털 유산(구독/계정) 정리]
- 유저가 구독 서비스 목록을 알려주면 파싱해서 아래 JSON 태그를 포함하세요:

[LEGACY_LIST]{"items": [
  {"id": "1", "service": "이름", "cost": "알수없음", "date": "알수없음", "category": "OTT"}
]}[/LEGACY_LIST]

[카테고리 분류 기준]
- OTT: 넷플릭스, 유튜브 프리미엄, 왓챠, 디즈니+, 쿠팡플레이 등
- 음악: 멜론, 스포티파이, 애플뮤직, FLO 등
- 클라우드: iCloud, 구글드라이브, 네이버클라우드, 드롭박스 등
- 게임: 스팀, 닌텐도, 플레이스테이션 등
- 쇼핑: 쿠팡 로켓와우, 네이버플러스, 배달의민족 등
- 소셜: 인스타그램, 페이스북, X(트위터), 카카오 등
- 기타: 나머지

[권한 경계]
- 서비스 해지/취소/삭제 실행 불가
- 타인 개인정보 접근 불가
- 법적 효력 있는 공식 유언장 작성 불가 (기념 편지는 가능)
- 금전 거래 불가`;

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
