import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string) => `
다음은 사용자의 이메일 제목, 발신자, 날짜, 주요 내용 목록입니다.
사용자가 가입했거나 구독 중인, 또는 현재 이용 중인 **모든 디지털 서비스와 계정 목록**을 최대한 많이 찾아내 JSON 배열로 추출해주세요.

[추출 목적]
- 사용자가 생전에 자신의 모든 '디지털 유산(계정, 구독, 자동결제 등)'을 파악하고 관리하기 위함입니다.
- **돈을 내는 유료 구독(넷플릭스 등)뿐만 아니라, 돈을 내지 않는 무료 서비스(회원가입, 소셜 계정, 뉴스레터, 툴 등)도 모두 포함해야 합니다.**

[분석 규칙]
1. 단순 광고성 메일(스팸)은 제외. **사용자가 실제로 가입했거나 활동한 흔적(환영 메일, 알림, 결제 영수증, 뉴스레터 정기 수신 등)은 모두 포함**하세요.
2. 각 서비스별로 결제 내역이 있다면 금액을 표기하고, 없다면 "무료/알 수 없음"으로 표기하세요.
3. 갱신일/결제일이 명시되어 있다면 표기하고, 없다면 "기록 없음"으로 표기하세요.
4. 중복 서비스는 가장 최신 1개만 남기세요.
5. 이메일에 계정 아이디(이메일주소 등)가 포함되어 있으면 account_id에 기입하세요.
6. 발신 도메인(From 이메일)도 서비스 식별에 활용하세요.

[출력 형식 - JSON 배열만 출력, 다른 텍스트 절대 금지]
[
  {
    "id": "고유숫자",
    "service": "서비스 이름 (Canva, 넷플릭스, 사람인, 토스 등)",
    "account_id": "계정 아이디 또는 이메일 (없으면 빈 문자열)",
    "cost": "결제액 (없으면 '무료/알 수 없음')",
    "date": "다음 갱신/결제 날짜 (없으면 '기록 없음')",
    "category": "생산성 툴|OTT|음악|클라우드|쇼핑|소셜/커뮤니티|구독 서비스|기타 중 하나"
  }
]

이메일 내용:
${emailTexts}
`;

// Gmail REST API를 fetch로 직접 호출
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailGet(token: string, path: string) {
    const res = await fetch(`${GMAIL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gmail API ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
}

// base64url → 텍스트 디코딩
function decodeBase64(data: string): string {
    try {
        return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    } catch {
        return "";
    }
}

// 파트에서 텍스트 본문 추출 (text/plain 우선)
function extractBody(payload: any): string {
    if (!payload) return "";
    // 직접 본문
    if (payload.body?.data) {
        return decodeBase64(payload.body.data).slice(0, 800);
    }
    // 멀티파트 - text/plain 우선
    if (payload.parts) {
        const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
        if (plain?.body?.data) return decodeBase64(plain.body.data).slice(0, 800);
        // text/html fallback
        const html = payload.parts.find((p: any) => p.mimeType === "text/html");
        if (html?.body?.data) {
            return decodeBase64(html.body.data)
                .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
        }
    }
    return "";
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
        console.log("[Scan Emails] 수집 이메일:", scanResult.inboxCount, "오류:", scanResult.error);

        if (!scanResult.emailTexts || scanResult.emailTexts.length < 30) {
            return NextResponse.json({
                items: [],
                message: "최근 이메일에서 유용한 결제/구독 내역을 찾을 수 없습니다.",
                debug: {
                    inboxCount: scanResult.inboxCount,
                    scanError: scanResult.error,
                    tokenReceived: !!providerToken
                }
            });
        }

        const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(SCAN_PROMPT(scanResult.emailTexts));
        const rawText = result.response.text().trim();

        console.log("[Gemini Raw Text 앞500자]:", rawText.slice(0, 500));

        try {
            const jsonStart = rawText.indexOf("[");
            const jsonEnd = rawText.lastIndexOf("]");
            if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON 배열을 찾을 수 없음");

            const parsed = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
            return NextResponse.json({
                items: parsed,
                debug: {
                    inboxCount: scanResult.inboxCount,
                    tokenReceived: !!providerToken
                }
            });
        } catch (jsonErr) {
            console.error("Gemini JSON Parsing Error:", jsonErr, "Raw output:", rawText.slice(0, 300));
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
    let lastError = "";

    // 단일 메시지 전체 정보 가져오기 (snippet + 본문 일부)
    const getFullMeta = async (id: string): Promise<string | null> => {
        try {
            // format=full 로 본문까지 포함
            const data = await gmailGet(token, `/messages/${id}?format=full`);
            const hs: { name: string; value: string }[] = data.payload?.headers ?? [];
            const subject = hs.find(h => h.name === "Subject")?.value ?? "";
            const from = hs.find(h => h.name === "From")?.value ?? "";
            const date = hs.find(h => h.name === "Date")?.value ?? "";
            const snippet: string = data.snippet ?? "";
            const bodyText = extractBody(data.payload);

            return `제목: ${subject}\n발신자: ${from}\n날짜: ${date}\n본문요약: ${snippet}\n본문: ${bodyText}`;
        } catch {
            return null;
        }
    };

    // 최근 1년 구매/가입/영수증 관련 메일 쿼리
    const queries = [
        `newer_than:12m (결제 OR 영수증 OR invoice OR receipt OR payment)`,
        `newer_than:12m (가입 OR 환영 OR welcome OR subscription OR 구독 OR 알림 OR 확인)`,
    ];

    for (const q of queries) {
        try {
            const data = await gmailGet(token, `/messages?maxResults=40&q=${encodeURIComponent(q)}`);
            const msgs: { id: string }[] = data.messages ?? [];
            inboxCount += msgs.length;
            console.log(`[Gmail] 쿼리 "${q.slice(0, 40)}..." 결과: ${msgs.length}개`);

            // 최대 25개씩 병렬 처리
            const results = await Promise.all(msgs.slice(0, 25).map(m => getFullMeta(m.id)));
            results.forEach(r => { if (r) emailBodies.push(r); });
        } catch (e) {
            lastError = String(e);
            console.error("[Gmail] 쿼리 검색 실패:", e);
        }
    }

    // 중복 제거 (동일 제목 메일)
    const seen = new Set<string>();
    emailBodies = emailBodies.filter(b => {
        const key = b.slice(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`[Gmail] 최종 수집: ${emailBodies.length}개, 오류: ${lastError}`);
    return {
        emailTexts: emailBodies.join("\n---\n"),
        inboxCount,
        error: lastError || undefined,
    };
}
