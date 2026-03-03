import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string) => `
다음은 사용자의 이메일 내용들입니다. 이 이메일들을 분석하여 현재 활성화된 정기 결제 및 구독 서비스 내역을 JSON 배열로 추출해주세요.

[중요한 필터링 규칙]
1. 현재 활성화된 구독/정기 결제만 포함하세요.
2. 구독 취소 확인 이메일, 환불 처리 이메일이 있는 서비스는 제외하세요.
3. 일회성 결제(쿀핑 등)는 제외하고, 정기 구독/월정액 서비스만 포함하세요.
4. 중복 서비스는 최신 것 하나만 포함하세요.
5. 우선순위: OTT(넷플릭스, 유튜브 프리미엄 등), 클라우드(iCloud, 구글드라이브 등), 음악(멜론, 스포티파이 등), 게임, 생산성 툴 위주로 찾으세요.
6. 비용을 모를 때는 "알 수 없음"으로 표시하세요.

[출력 형식 - JSON 배열만 출력, 다른 텍스트 금지]
[
  {
    "id": "고유숫자",
    "service": "서비스 이름",
    "cost": "월 결제액 (예: 17,000원/월)",
    "date": "결제일 (예: 매월 15일)",
    "category": "OTT|음악|클라우드|게임|쓰핑|기타 중 하나"
  }
]

이메일 내용:
${emailTexts}
`;

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

        const { emailTexts, inboxCount, promoCount, error: scanError } = await scanGmailEmails(providerToken);
        console.log("[Scan Emails] INBOX:", inboxCount, "PROMO:", promoCount, "텍스트 길이:", emailTexts.length, "오류:", scanError);

        if (!emailTexts.trim()) {
            return NextResponse.json({
                items: [],
                message: "구독/결제 관련 이메일을 찾지 못했어요. Gmail에 정기 결제 이메일이 있으신가요?",
                debug: { tokenReceived: true, inboxCount, promoCount, scanError },
            });
        }

        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(SCAN_PROMPT(emailTexts));
        const rawText = result.response.text().trim();

        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        let items: unknown[] = [];
        if (jsonMatch) {
            try { items = JSON.parse(jsonMatch[0]); } catch { items = []; }
        }

        return NextResponse.json({ items, debug: { tokenReceived: true, inboxCount, promoCount, scanError } });
    } catch (error) {
        console.error("[Scan Emails Error]", error);
        return NextResponse.json({ error: "이메일 스캔 중 오류가 발생했습니다.", detail: String(error) }, { status: 500 });
    }
}
async function scanGmailEmails(accessToken: string): Promise<{ emailTexts: string; inboxCount: number; promoCount: number; error?: string }> {
    const emailBodies: string[] = [];
    const processedMessageIds = new Set<string>(); // To prevent duplicates across INBOX and PROMOTIONS
    let inboxCount = 0;
    let promoCount = 0;
    let lastError = "";

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth });

        // 헬퍼: 메시지 ID 목록 → 메타데이터 병렬 패치
        const fetchMeta = async (ids: string[]) => {
            const results = await Promise.allSettled(
                ids.map(id =>
                    gmail.users.messages.get({
                        userId: "me",
                        id,
                        format: "metadata",
                        metadataHeaders: ["Subject", "From", "Date"],
                    })
                )
            );
            return results
                .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => r.status === "fulfilled")
                .map(r => {
                    const d = (r as PromiseFulfilledResult<{ data: { payload?: { headers?: { name?: string; value?: string }[] }; snippet?: string } }>).value.data;
                    const headers = d.payload?.headers ?? [];
                    const subject = headers.find(h => h.name === "Subject")?.value ?? "";
                    const from = headers.find(h => h.name === "From")?.value ?? "";
                    const date = headers.find(h => h.name === "Date")?.value ?? "";
                    const snippet = d.snippet ?? "";
                    return `제목: ${subject}\n발신자: ${from}\n날짜: ${date}\n내용: ${snippet}`;
                });
        };

        // INBOX 최근 25개
        try {
            const listRes = await gmail.users.messages.list({ userId: "me", labelIds: ["INBOX"], maxResults: 25 });
            const ids = (listRes.data.messages ?? []).map(m => m.id!).filter(Boolean);
            inboxCount = ids.length;
            console.log(`[Gmail] INBOX: ${inboxCount}개`);
            const texts = await fetchMeta(ids);
            emailBodies.push(...texts);
        } catch (e) {
            lastError = String(e);
            console.error("[Gmail] INBOX 실패:", e);
        }

        // PROMOTIONS 최근 25개 (결제/영수증 메일 대부분 여기)
        try {
            const promoRes = await gmail.users.messages.list({ userId: "me", labelIds: ["CATEGORY_PROMOTIONS"], maxResults: 25 });
            const ids = (promoRes.data.messages ?? [])
                .map(m => m.id!)
                .filter(id => id && !processedMessageIds.has(id));
            promoCount = ids.length;
            console.log(`[Gmail] PROMOTIONS: ${promoCount}개`);
            const texts = await fetchMeta(ids);
            emailBodies.push(...texts);
        } catch (e) {
            lastError = String(e);
            console.error("[Gmail] PROMOTIONS 실패:", e);
        }

    } catch (error) {
        lastError = String(error);
        console.error("[Gmail Scan Error]", error);
    }

    console.log(`[Gmail] 최종 수집 이메일: ${emailBodies.length}개, 오류: ${lastError}`);
    return {
        emailTexts: emailBodies.slice(0, 150).join("\n---\n"),
        inboxCount,
        promoCount,
        error: lastError || undefined,
    };
}
