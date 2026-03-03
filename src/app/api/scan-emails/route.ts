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

        // provider_token은 클라이언트 세션에만 의존하나 SSR 서버에서는 접근 불가
        // 프론트에서 직접 body로 전달받는다
        const body = await req.json().catch(() => ({}));
        const providerToken: string | undefined = body?.providerToken;

        console.log("[Scan Emails] providerToken 존재:", !!providerToken);

        if (!providerToken) {
            return NextResponse.json({
                requires_auth: true,
                message: "Gmail 연동이 필요합니다. Google 계정으로 이메일 읽기 권한을 허용해주세요.",
            }, { status: 403 });
        }

        const emailTexts = await scanGmailEmails(providerToken);
        console.log("[Scan Emails] 수집된 이메일 텍스트 길이:", emailTexts.length);

        if (!emailTexts.trim()) {
            return NextResponse.json({ items: [], message: "구독/결제 관련 이메일을 찾지 못했어요. Gmail에 정기 결제 이메일이 있으신가요?" });
        }

        const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
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

        const emailBodies: string[] = [];

        // 전략 1: 받은 편지함에서 최근 100개 직접 읽기 (검색 쿼리 없이)
        // → Gmail 검색 쿼리 파싱 문제를 완전히 우회
        try {
            const listRes = await gmail.users.messages.list({
                userId: "me",
                labelIds: ["INBOX"],
                maxResults: 100,
            });
            const messages = listRes.data.messages ?? [];
            console.log(`[Gmail] INBOX 메시지 수: ${messages.length}`);

            for (const msg of messages) {
                if (!msg.id) continue;
                try {
                    const msgData = await gmail.users.messages.get({
                        userId: "me",
                        id: msg.id,
                        format: "metadata",
                        metadataHeaders: ["Subject", "From", "Date"],
                    });
                    const headers = msgData.data.payload?.headers ?? [];
                    const subject = headers.find(h => h.name === "Subject")?.value ?? "";
                    const from = headers.find(h => h.name === "From")?.value ?? "";
                    const date = headers.find(h => h.name === "Date")?.value ?? "";
                    const snippet = msgData.data.snippet ?? "";
                    emailBodies.push(`제목: ${subject}\n발신자: ${from}\n날짜: ${date}\n내용: ${snippet}`);
                } catch { /* 개별 메시지 실패 무시 */ }
            }
        } catch (e) {
            console.error("[Gmail] INBOX 읽기 실패:", e);
        }

        // 전략 2: 보낸 편지함/프로모션 탭도 추가로 읽기
        // (많은 구독 영수증이 프로모션 탭으로 분류됨)
        try {
            const promoRes = await gmail.users.messages.list({
                userId: "me",
                labelIds: ["CATEGORY_PROMOTIONS"],
                maxResults: 100,
            });
            const promoMessages = promoRes.data.messages ?? [];
            console.log(`[Gmail] PROMOTIONS 메시지 수: ${promoMessages.length}`);

            const seenIds = new Set(emailBodies.map((_, i) => i.toString()));
            for (const msg of promoMessages) {
                if (!msg.id || seenIds.has(msg.id)) continue;
                seenIds.add(msg.id);
                try {
                    const msgData = await gmail.users.messages.get({
                        userId: "me",
                        id: msg.id,
                        format: "metadata",
                        metadataHeaders: ["Subject", "From", "Date"],
                    });
                    const headers = msgData.data.payload?.headers ?? [];
                    const subject = headers.find(h => h.name === "Subject")?.value ?? "";
                    const from = headers.find(h => h.name === "From")?.value ?? "";
                    const date = headers.find(h => h.name === "Date")?.value ?? "";
                    const snippet = msgData.data.snippet ?? "";
                    emailBodies.push(`제목: ${subject}\n발신자: ${from}\n날짜: ${date}\n내용: ${snippet}`);
                } catch { /* 개별 메시지 실패 무시 */ }
            }
        } catch (e) {
            console.error("[Gmail] PROMOTIONS 읽기 실패:", e);
        }

        console.log(`[Gmail] 최종 수집 이메일 수: ${emailBodies.length}개`);
        // Gemini 토큰 절약을 위해 최대 150개만 전달
        return emailBodies.slice(0, 150).join("\n---\n");
    } catch (error) {
        console.error("[Gmail Scan Error]", error);
        return "";
    }
}
