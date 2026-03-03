import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string) => `
다음은 사용자의 이메일 내용들입니다. 이 이메일들을 분석하여 "실제로 결제가 발생하고 있는" 정기 결제 및 구독 서비스 내역만 JSON 배열로 추출해주세요.

[매우 엄격한 필터링 규칙 - 반드시 지킬 것]
1. 단순 회원가입 환영 메일 (예: AFTERM 가입 환영), 뉴스레터 구독, 무료 서비스 안내 메일은 **절대 포함하지 마세요**.
2. 이메일 본문에 실제 "결제 내역", "영수증", "승인번호", "갱신일", "다음 결제일", 통화 단위("원", "$") 등 **명확한 금전적 거래 증거**가 있는 서비스만 포함하세요. (예: Canva, n8n, Netflix 등)
3. 구독 취소 확인 이메일, 결제 실패, 환불 처리 이메일이 있는 서비스는 제외하세요.
4. 일회성 단순 쇼핑/배달 결제는 제외하고, 정기 구독/월정액 성격의 서비스만 포함하세요.
5. 중복 서비스는 최신 것 하나만 포함하세요.
6. 만약 이메일에서 확실하게 돈이 나가는 구독 서비스라고 판단할 수 없으면, **과감하게 제외하세요**. 추측해서 넣지 마세요.

[출력 형식 - JSON 배열만 출력, 다른 텍스트 금지]
[
  {
    "id": "고유숫자",
    "service": "서비스 이름 (예: Canva, n8n)",
    "cost": "결제액 (예: 17,000원/월 또는 $15/month)",
    "date": "다음 결제일 또는 갱신일 (예: 매월 15일, 2026년 4월 1일 등)",
    "category": "생산성 툴|OTT|음악|클라우드|게임|기타 중 하나"
  }
]

이메일 내용:
${emailTexts}
`;

// Gmail REST API를 fetch로 직접 호출 (googleapis 패키지 불필요 → Cold Start 빠름)
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailGet(token: string, path: string) {
    const res = await fetch(`${GMAIL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gmail API ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const providerToken: string | undefined = body?.providerToken;

        console.log("[Scan Emails] providerToken 존재:", !!providerToken, "길이:", providerToken?.length ?? 0);

        if (!providerToken) {
            return NextResponse.json({
                requires_auth: true,
                message: "Gmail 연동이 필요합니다.",
            }, { status: 403 });
        }

        const scanResult = await scanGmailEmails(providerToken);
        console.log("[Scan Emails] INBOX:", scanResult.inboxCount, "PROMO:", scanResult.promoCount, "오류:", scanResult.error);

        if (!scanResult.emailTexts.trim()) {
            return NextResponse.json({
                items: [],
                message: "구독/결제 관련 이메일을 찾지 못했어요. Gmail에 정기 결제 이메일이 있으신가요?",
                debug: {
                    tokenReceived: true,
                    inboxCount: scanResult.inboxCount,
                    promoCount: scanResult.promoCount,
                    scanError: scanResult.error,
                },
            });
        }

        const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(SCAN_PROMPT(scanResult.emailTexts));
        const rawText = result.response.text().trim();

        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        let items: unknown[] = [];
        if (jsonMatch) {
            try { items = JSON.parse(jsonMatch[0]); } catch { items = []; }
        }

        return NextResponse.json({
            items,
            debug: { tokenReceived: true, inboxCount: scanResult.inboxCount, promoCount: scanResult.promoCount }
        });
    } catch (error) {
        console.error("[Scan Emails Error]", error);
        return NextResponse.json({
            error: "이메일 스캔 중 오류가 발생했습니다.",
            detail: String(error),
        }, { status: 500 });
    }
}

async function scanGmailEmails(token: string) {
    const emailBodies: string[] = [];
    let inboxCount = 0;
    let promoCount = 0;
    let lastError = "";

    // 단일 메시지 메타데이터 가져오기
    const getMeta = async (id: string): Promise<string | null> => {
        try {
            const data = await gmailGet(token, `/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
            const hs: { name: string; value: string }[] = data.payload?.headers ?? [];
            const subject = hs.find(h => h.name === "Subject")?.value ?? "";
            const from = hs.find(h => h.name === "From")?.value ?? "";
            const date = hs.find(h => h.name === "Date")?.value ?? "";
            const snippet: string = data.snippet ?? "";
            return `제목: ${subject}\n발신자: ${from}\n날짜: ${date}\n내용: ${snippet}`;
        } catch {
            return null;
        }
    };

    // INBOX 최근 15개
    try {
        const data = await gmailGet(token, "/messages?maxResults=15&labelIds=INBOX");
        const msgs: { id: string }[] = data.messages ?? [];
        inboxCount = msgs.length;
        console.log(`[Gmail] INBOX: ${inboxCount}개`);
        const results = await Promise.all(msgs.map(m => getMeta(m.id)));
        results.forEach(r => { if (r) emailBodies.push(r); });
    } catch (e) {
        lastError = String(e);
        console.error("[Gmail] INBOX 실패:", e);
    }

    // PROMOTIONS 최근 15개 (결제 영수증이 여기 분류됨)
    try {
        const data = await gmailGet(token, "/messages?maxResults=15&labelIds=CATEGORY_PROMOTIONS");
        const msgs: { id: string }[] = data.messages ?? [];
        promoCount = msgs.length;
        console.log(`[Gmail] PROMOTIONS: ${promoCount}개`);
        const results = await Promise.all(msgs.map(m => getMeta(m.id)));
        results.forEach(r => { if (r) emailBodies.push(r); });
    } catch (e) {
        lastError = String(e);
        console.error("[Gmail] PROMOTIONS 실패:", e);
    }

    console.log(`[Gmail] 최종 수집: ${emailBodies.length}개, 오류: ${lastError}`);
    return {
        emailTexts: emailBodies.join("\n---\n"),
        inboxCount,
        promoCount,
        error: lastError || undefined,
    };
}
