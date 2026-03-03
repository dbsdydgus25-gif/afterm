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

        const { data: sessionData } = await supabase.auth.getSession();
        const providerToken = sessionData?.session?.provider_token;
        const provider = sessionData?.session?.user?.app_metadata?.provider;

        let emailTexts = "";

        if (provider === "google" && providerToken) {
            emailTexts = await scanGmailEmails(providerToken);
        } else {
            // Google으로 로그인하지 않았거나 providerToken이 없음
            // 프론트엔드에서 Gmail 연동 버튼을 표시하도록 requires_auth 반환
            return NextResponse.json({
                requires_auth: true,
                message: "Gmail 연동이 필요합니다. Google 계정으로 이메일 읽기 권한을 허용해주세요.",
            }, { status: 403 });
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

        // 여러 검색 쿼리로 넘게 잡기
        const queries = [
            // 한국어 결제/구독 키워드 (제목+본문 전체)
            "(결제 OR 구독 OR 청구 OR 청구서 OR 영수증 OR 정기결제 OR 정기구독 OR 월정액 OR 자동결제 OR 자동이체 OR 카드결제 OR 이용내역 OR 결제완료 OR 결제확인 OR 구독갱신 OR 갱신 OR 해지 OR 취소 OR 구독료) newer_than:365d",
            // 영어 결제/구독 키워드
            "(payment OR subscription OR receipt OR invoice OR billing OR renewal OR charged OR charge OR auto-renewal OR monthly OR annual OR plan OR \"your plan\" OR \"thank you for subscribing\" OR \"payment confirmed\" OR \"payment successful\" OR \"order confirmation\" OR \"payment receipt\" OR \"credit card\" OR \"debit card\" OR \"auto pay\" OR \"autopay\") newer_than:365d",
            // 알려진 구독 서비스 발신자 도메인 (한국+글로벌)
            "from:(netflix.com OR spotify.com OR apple.com OR google.com OR youtube.com OR coupang.com OR kakao.com OR naver.com OR discord.com OR notion.so OR adobe.com OR microsoft.com OR amazon.com OR chatgpt.com OR openai.com OR midjourney.com OR figma.com OR github.com OR slack.com OR zoom.us OR watcha.com OR wavve.com OR tving.com OR melon.com OR genie.co.kr OR vibe.naver.com OR hulu.com OR disneyplus.com OR max.com OR paramount.com OR dropbox.com OR icloud.com) newer_than:365d",
        ];


        const seenIds = new Set<string>();
        const emailBodies: string[] = [];

        for (const q of queries) {
            try {
                const listRes = await gmail.users.messages.list({
                    userId: "me",
                    q,
                    maxResults: 50,
                });
                const messages = listRes.data.messages ?? [];
                console.log(`[Gmail] query: "${q.slice(0, 60)}..." -> ${messages.length}` + " messages found");

                for (const msg of messages) {
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
                        if (subject || snippet) {
                            emailBodies.push(`제목: ${subject}\n산층: ${from}\n날짜: ${date}\n내용: ${snippet}`);
                        }
                    } catch { /* 개별 메시지 실패 무시 */ }
                }
            } catch (qErr) {
                console.error("[Gmail] query error:", qErr);
            }
        }

        console.log(`[Gmail] 전체 수집 이메일: ${emailBodies.length}개`);
        return emailBodies.join("\n---\n");
    } catch (error) {
        console.error("[Gmail Scan Error]", error);
        return "";
    }
}

