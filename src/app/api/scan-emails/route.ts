import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string, userIntent?: string) => `
당신은 사용자의 디지털 유산 관리를 돕는 수석 풀스택 개발자이자 AI 비서입니다.
제공된 이메일 메타데이터(제목, 발신자, 날짜, 요약본문)들을 분석하여, 사용자가 '실제로 가입하여 이용 중이거나', '자동 결제/구독 중인' **유효 디지털 서비스 및 계정 목록**을 최대한 정확히 찾아내 JSON 배열로 추출해주세요.

${userIntent ? `[✅ 사용자 특별 지시사항 (가장 강력한 우선순위)]
사용자가 방금 이렇게 요청했습니다: "${userIntent}"
만약 이 요청이 특정 카테고리(예: OTT만, 클라우드만, 음악앱만 등)를 지정하고 있다면, 이메일 내역 중 **해당 조건에 부합하는 서비스들만** 추출하여 결과 JSON 배열에 담으세요. 조건에 맞지 않는 다른 서비스들은 과감히 버리세요.` : ""}

[추출 목적 및 대상]
- 목적: 사후 방치될 수 있는 모든 '디지털 유산(계정, 구독, 자동결제 등)'을 파악하고 관리하기 위함입니다.
- **포함 대상**:
  1. 명확한 가입 환영 메일 (예: "가입을 환영합니다", "Welcome to...")
  2. 정기 결제/구독 영수증 (넷플릭스, 쿠팡 로켓와우, 어도비, iCloud 등)
  3. 실 사용 알림 메일 (예: "새로운 기기 로그인", "비밀번호 변경 안내", 정기 뉴스레터 등 계정 소유를 증명하는 건)
- **제외 대상 (스팸/단순 광고/1회성 구매)**:
  1. 사용자가 가입하지 않아도 발송되는 프로모션 타겟팅 광고 및 스팸, 피싱 메일.
  2. **일회성 단순 구매 내역 (쿠팡 1회성 상품 주문, 배달의민족 음식 배달, 쇼핑몰 옷 구매 등 정기결제가 아닌 것)**.
  3. **구글 플레이(Google Play), 앱스토어(App Store) 결제 내역이라도 본문이나 제목에 "구독(Subscription)"이 명시되지 않고 단순히 게임 아이템 현질(인앱 결제)이나 앱 1회 다운로드 결제일 뿐인 경우 절대 무시할 것.**

[추출 규칙]
1. **유/무료 구분 및 금액 기재 엄격화**: 
   - [중요!] 본문에 명확한 결제 금액(예: 14,900원, $15.99)이 적혀 있는 "돈이 나간 흔적"이 있어야만 그 금액을 \`cost\`에 적으세요. 금액 증빙 문구가 없다면 유료 구독으로 추측하지 말고 무조건 \`cost\` 필드에 "무료"라고 적으세요.
   - 1회성 제품/서비스 결제건은 추출 대상에서 완전히 통째로 제거하세요.
2. **아이디(account_id) 및 비밀번호 추출**:
   - 이메일 수신자 주소나 본문에 명시된 계정 ID가 있다면 \`account_id\`에 기재.
   - 본문에 "임시 비밀번호" 등이 명시되었다면, \`notes\` 필드에 "패스워드: ~~~~" 형태로 기록 (없으면 생략).
3. **중복 계정 합병 (상태 전이 반영)**: 똑같은 서비스(예: Netflix)에 대해 '가입 환영 메일(과거)'과 '최근 결제 영수증(현재)'이 두 개 스캔되었다면, 무조건 **하나의 객체로 합쳐서 반환**하세요. 무료 상태와 유료 상태가 겹치면 가급적 가장 최신의 돈을 지불하는 형태(유료)를 기준으로 1개의 서비스만 남기세요. 동일 플랫폼이 2개 이상 추출되면 안 됩니다.
4. 서비스 식별: '발신자(From)' 도메인과 '제목'을 바탕으로 실제 서비스 이름(예: Facebook, Notion, 쿠팡 등)을 깔끔하게 추출.

[출력 형식 - 오직 유효한 JSON 배열만 출력, \`\`\`json 등 마크다운 블록 제외]
[
  {
    "id": "고유숫자",
    "service": "실제 서비스 이름 (예: Netflix, Notion, 사람인 등)",
    "account_id": "발견된 아이디 또는 이메일 (없으면 빈 문자열)",
    "cost": "결제금액 (예: '14,900원' 또는 결제 증거 없으면 '무료')",
    "date": "다음 갱신/결제 날짜 또는 최근 메일 수신일 (없으면 '기록 없음')",
    "category": "OTT|생산성|소셜/커뮤니티|쇼핑|구독|기타 중 가장 적합한 하나",
    "notes": "추출한 비밀번호(예: '패스워드: 1a2b3c') 또는 알림 등 기타 특이사항 (없으면 빈 문자열)"
  }
]

아래 제공된 이메일 기록을 분석하여, 오직 위 JSON 배열 형태만 반환하세요. JSON 문법에 오류가 없어야 합니다.

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
        let providerToken: string | undefined = body?.providerToken;
        let userIntent: string | undefined = body?.userIntent;

        console.log("[Scan Emails] 클라이언트 providerToken 존재:", !!providerToken);
        console.log("[Scan Emails] 클라이언트 userIntent 존재:", !!userIntent, userIntent);

        if (!providerToken) {
            // DB에서 리프레시 토큰 조회
            const { data: profile } = await supabase
                .from("profiles")
                .select("gmail_refresh_token")
                .eq("id", user.id)
                .single();

            const refreshToken = profile?.gmail_refresh_token;

            if (refreshToken) {
                const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
                const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

                if (clientId && clientSecret) {
                    try {
                        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: new URLSearchParams({
                                client_id: clientId,
                                client_secret: clientSecret,
                                refresh_token: refreshToken,
                                grant_type: "refresh_token"
                            })
                        });

                        if (tokenRes.ok) {
                            const tokenData = await tokenRes.json();
                            providerToken = tokenData.access_token;
                            console.log("[Scan Emails] 리프레시 토큰으로 Access Token 갱신 성공");
                        } else {
                            console.error("[Scan Emails] 리프레시 토큰 갱신 실패:", await tokenRes.text());
                        }
                    } catch (refreshErr) {
                        console.error("[Scan Emails] 토큰 갱신 요청 에러:", refreshErr);
                    }
                } else {
                    console.warn("[Scan Emails] GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET 환경 변수가 없어 토큰을 갱신할 수 없습니다.");
                }
            }
        }

        if (!providerToken) {
            return NextResponse.json({
                requires_auth: true,
                message: "Gmail 연동이 필요합니다."
            }, { status: 400 });
        }

        const scanResult = await scanGmailEmails(providerToken, userIntent);
        console.log("[Scan Emails] 수집 이메일:", scanResult.inboxCount, "오류:", scanResult.error);

        // 스코프 부족, 인증 에러인 경우 재연동 유도 (DB를 즉시 날리지 않고 에러만 반환하여 클라이언트에서 대응 유도)
        if (scanResult.error && (scanResult.error.includes("insufficient authentication scopes") || scanResult.error.includes("invalid_grant") || scanResult.error.includes("403") || scanResult.error.includes("401"))) {
            return NextResponse.json({
                requires_auth: true,
                message: "Gmail 연동 권한이 부족하거나 만료되었습니다. 다시 연동해주세요."
            }, { status: 400 });
        }

        if (!scanResult.emailTexts || scanResult.emailTexts.length < 30) {
            return NextResponse.json({
                items: [],
                message: userIntent
                    ? `현재 Gmail 연동으로 찾았지만, '${userIntent}'와(과) 관련된 내역을 찾지 못했어요.`
                    : "현재 Gmail 연동으로 찾았을 때 해당하는 디지털 유산은 찾지 못했어요.",
                debug: {
                    inboxCount: scanResult.inboxCount,
                    scanError: scanResult.error,
                    tokenReceived: !!providerToken
                }
            });
        }

        const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(SCAN_PROMPT(scanResult.emailTexts, userIntent));
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

async function scanGmailEmails(token: string, userIntent?: string) {
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

    // 사용자 의도에 따른 기본/맞춤형 쿼리 생성
    let queries: string[] = [];
    const intentLower = userIntent?.toLowerCase() || "";

    if (intentLower.includes("클라우드") || intentLower.includes("데이터")) {
        queries = [
            `newer_than:12m (cloud OR 드라이브 OR drive OR 아이클라우드 OR icloud OR 원드라이브 OR "google one" OR "구글 원") -("1회성" OR "일시불")`,
            `newer_than:12m ("가입을 환영합니다" OR "welcome to") (cloud OR 드라이브 OR drive OR 아이클라우드 OR icloud OR 원드라이브)`,
        ];
    } else if (intentLower.includes("ott") || intentLower.includes("넷플릭스") || intentLower.includes("스트리밍")) {
        queries = [
            `newer_than:12m (netflix OR 넷플릭스 OR 디즈니 OR 티빙 OR tving OR 왓챠 OR 쿠팡플레이 OR wavve OR 웨이브 OR "youtube premium" OR "유튜브 프리미엄") -("1회성" OR "일시불")`
        ];
    } else if (intentLower.includes("소셜") || intentLower.includes("sns") || intentLower.includes("계정")) {
        queries = [
            `newer_than:12m ("가입을 환영합니다" OR "welcome to" OR "계정 생성" OR "새로운 로그인") -label:promotions -("뉴스레터" OR "광고")`
        ];
    } else if (intentLower.includes("돈나가는") || intentLower.includes("유료") || intentLower.includes("결제된")) {
        queries = [
            `newer_than:12m ("정기 결제" OR 구독 OR subscription OR recurring) -("1회성" OR 일시불 OR 단건)`,
            `newer_than:12m (receipt OR 영수증) (월간 OR monthly OR renew OR 갱신) -("주문이 완료" OR "배송이 시작" OR "배달")`,
        ];
    } else {
        // 일반적인 "디지털 유산 찾아줘" 요청 시 (전체 스캔)
        queries = [
            `newer_than:12m ("정기 결제" OR 구독 OR subscription OR recurring) -("1회성" OR 일시불 OR 단건)`,
            `newer_than:12m (receipt OR 영수증) (월간 OR monthly OR renew OR 갱신) -("주문이 완료" OR "배송이 시작" OR "배달")`,
            `newer_than:12m ("가입을 환영합니다" OR "welcome to") -label:promotions -("뉴스레터" OR "소식지" OR "광고")`,
        ];
    }

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
