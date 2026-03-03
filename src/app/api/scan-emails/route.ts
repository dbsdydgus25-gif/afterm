import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string) => `
다음은 사용자의 이메일 내용들입니다. 이 이메일들을 분석하여 "실제로 결제가 발생하고 있는" 정기 결제 및 구독 서비스 내역만 JSON 배열로 추출해주세요.

[매우 엄격한 필터링 규칙 - 2단계로 진행할 것]
1단계: 먼저 이메일에 언급된 모든 서비스 가입, 구독, 환영 메일을 전부 찾아내세요.
2단계: 그 중에서 실제 "결제 내역", "영수증(Receipt)", "인보이스(Invoice)", "승인번호", 통화 단위("원", "$") 등 **명확하게 돈이 결제된 증거**가 있거나, **확실한 다음 갱신일/결제일**이 적혀 있는 서비스만 최종 결과로 남기세요.
3단계: 단순 회원가입 환영 메일 (예: AFTERM 가입 환영), 무료 계정 생성, 단순 가입, 뉴스레터 구독은 **반드시 제외**하세요.

[필수 요구사항]
- 중복 서비스는 가장 최신 결제/갱신 내역 하나만 포함하세요.
- 일회성 단순 쇼핑(쿠팡 배달 등)은 제외하고, 월정액/구독/라이선스 갱신 성격의 서비스(예: Canva, n8n, Netflix, ChatGPT 등)만 포함하세요.

[출력 형식 - JSON 배열만 출력, 다른 텍스트 금지]
[
  {
    "id": "고유숫자",
    "service": "서비스 이름 (예: Canva, n8n, Netflix 등)",
    "cost": "결제액 (예: 17,000원/월 또는 $15/month)",
    "date": "다음 갱신/결제 날짜만 (예: 2026년 4월 1일)",
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
                message: "Gmail 연동이 필요합니다."
            }, { status: 400 });
        }

        const scanResult = await scanGmailEmails(providerToken);
        console.log("[Scan Emails] INBOX:", scanResult.inboxCount, "PROMO:", scanResult.promoCount, "오류:", scanResult.error);

        if (!scanResult.emailTexts) {
            return NextResponse.json({
                items: [],
                message: "최근 이메일에서 유용한 결제/구독 내역을 찾을 수 없습니다.",
                debug: {
                    inboxCount: scanResult.inboxCount,
                    promoCount: scanResult.promoCount,
                    scanError: scanResult.error,
                    tokenReceived: !!providerToken
                }
            });
        }

        const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(SCAN_PROMPT(scanResult.emailTexts));
        const rawText = result.response.text().trim();

        console.log("[Gemini Raw Text]:", rawText);

        try {
            const jsonStart = rawText.indexOf("[");
            const jsonEnd = rawText.lastIndexOf("]");
            if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON 배열을 찾을 수 없음");

            const parsed = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
            return NextResponse.json({
                items: parsed,
                debug: {
                    inboxCount: scanResult.inboxCount,
                    promoCount: scanResult.promoCount,
                    tokenReceived: !!providerToken
                }
            });
        } catch (jsonErr) {
            console.error("Gemini JSON Parsing Error:", jsonErr, "Raw output:", rawText);
            return NextResponse.json({ error: "AI 분석 결과 형식이 잘못되었습니다." }, { status: 500 });
        }

    } catch (e: any) {
        console.error("Email scan error:", e);
        return NextResponse.json({ error: e.message || "서버 오류가 발생했습니다." }, { status: 500 });
    }
}

async function scanGmailEmails(token: string) {
    let emailBodies: string[] = [];
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

    // 최근 6개월 구매/가입/영수증 관련 메일 검색 쿼리 (최대한 넓게)
    const query = encodeURIComponent(`newer_than:6m (결제 OR 영수증 OR 구독 OR 가입 OR 환영 OR 승인 OR receipt OR invoice OR payment OR subscription OR welcome)`);

    try {
        const data = await gmailGet(token, `/messages?maxResults=60&q=${query}`);
        const msgs: { id: string }[] = data.messages ?? [];
        inboxCount = msgs.length;
        promoCount = 0; // 이제 쿼리 기반이라 하나로 통일

        console.log(`[Gmail] 6개월 결제/영수증 검색 결과: ${msgs.length}개`);

        // 너무 많으면 Timeout 위험이 있으므로 Promise.all로 병렬 처리하되 40개까지만 (maxResults=40)
        const results = await Promise.all(msgs.map(m => getMeta(m.id)));
        results.forEach(r => { if (r) emailBodies.push(r); });
    } catch (e) {
        lastError = String(e);
        console.error("[Gmail] 쿼리 검색 실패:", e);
    }

    console.log(`[Gmail] 최종 수집: ${emailBodies.length}개, 오류: ${lastError}`);
    return {
        emailTexts: emailBodies.join("\n---\n"),
        inboxCount,
        promoCount,
        error: lastError || undefined,
    };
}
