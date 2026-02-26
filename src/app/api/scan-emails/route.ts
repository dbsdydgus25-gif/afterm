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
3. 일회성 결제(쇼핑 등)는 제외하고, 정기 구독/월정액 서비스만 포함하세요.
4. 중복 서비스는 최신 것 하나만 포함하세요.
5. 우선순위: OTT(넷플릭스, 유튜브 프리미엄 등), 클라우드(iCloud, 구글드라이브 등), 음악(멜론, 스포티파이 등), 게임, 생산성 툴 위주로 찾으세요.

[출력 형식 - JSON 배열만 출력, 다른 텍스트 금지]
[
  {
    "id": "고유숫자",
    "service": "서비스 이름",
    "cost": "월 결제액 (예: 17,000원/월)",
    "date": "결제일 (예: 매월 15일)",
    "category": "OTT|음악|클라우드|게임|쇼핑|기타 중 하나"
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

        const { data: sessionData } = await supabase.auth.getSession();
        const providerToken = sessionData?.session?.provider_token;
        const provider = sessionData?.session?.user?.app_metadata?.provider;

        let emailTexts = "";

        if (provider === "google" && providerToken) {
            emailTexts = await scanGmailEmails(providerToken);
        } else {
            return NextResponse.json({
                items: [],
                message: "Google 계정으로 로그인하면 이메일을 자동 분석할 수 있어요!"
            });
        }

        if (!emailTexts.trim()) {
            return NextResponse.json({ items: [], message: "분석할 이메일을 찾지 못했어요." });
        }

        const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(SCAN_PROMPT(emailTexts));
        const rawText = result.response.text().trim();

        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        let items: unknown[] = [];
        if (jsonMatch) {
            try {
                items = JSON.parse(jsonMatch[0]);
            } catch {
                items = [];
            }
        }

        return NextResponse.json({ items });
    } catch (error) {
        console.error("[Scan Emails Error]", error);
        return NextResponse.json({ error: "이메일 스캔 중 오류가 발생했습니다." }, { status: 500 });
    }
}

async function scanGmailEmails(accessToken: string): Promise<string> {
    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth });

        const searchQuery = "subject:(결제 OR 구독 OR 청구 OR payment OR subscription OR receipt OR invoice OR 영수증 OR 정기결제 OR renewal) newer_than:365d";

        const listRes = await gmail.users.messages.list({
            userId: "me",
            q: searchQuery,
            maxResults: 100,
        });

        const messages = listRes.data.messages ?? [];
        const emailBodies: string[] = [];

        for (const msg of messages.slice(0, 50)) {
            try {
                const msgData = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id!,
                    format: "snippet",
                });
                const subject = msgData.data.payload?.headers?.find(h => h.name === "Subject")?.value ?? "";
                if (msgData.data.snippet) {
                    emailBodies.push(`제목: ${subject}\n내용: ${msgData.data.snippet}`);
                }
            } catch { /* skip individual errors */ }
        }

        return emailBodies.join("\n---\n");
    } catch (error) {
        console.error("[Gmail Scan Error]", error);
        return "";
    }
}
