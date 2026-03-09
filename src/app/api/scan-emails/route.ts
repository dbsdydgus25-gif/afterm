import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string, userIntent?: string) => `
당신은 사용자의 디지털 유산 관리를 돕는 AI 비서입니다.
제공된 이메일 메타데이터(제목, 발신자, 날짜, 요약본문)들을 분석하여, 사용자가 '실제로 가입하여 이용 중이거나', '자동 결제/구독 중인' **유효 디지털 서비스 및 계정 목록**을 정확히 찾아내 JSON 배열로 추출해주세요.

${userIntent ? `[✅ 사용자 특별 지시사항 (최우선 적용)]
사용자 요청: "${userIntent}"
이 요청이 특정 카테고리(예: OTT만, 클라우드만, 음악앱만, 유료만 등)를 지정하고 있다면, **해당 조건에 부합하는 서비스들만** 추출하세요. 나머지는 결과에서 완전히 제거하세요.` : ""}

[포함 대상]
1. 명확한 가입 환영 메일 (예: "가입을 환영합니다", "Welcome to...")
2. 정기 결제/구독 영수증 (넷플릭스, 쿠팡 로켓와우, 어도비, iCloud 등)
3. 실 사용 알림 메일 (예: "새로운 기기 로그인", "비밀번호 변경 안내" 등 계정 소유를 증명하는 건)

[제외 대상]
1. 사용자가 가입하지 않아도 발송되는 프로모션 타겟팅 광고 및 스팸, 피싱 메일
2. **일회성 단순 구매 내역 (쿠팡 1회성 상품 주문, 배달의민족 음식 배달, 쇼핑몰 옷 구매 등 정기결제가 아닌 것)**
3. **구글 플레이(Google Play), 앱스토어(App Store) 결제 내역이라도 본문에 "구독(Subscription)"이 명시되지 않고 게임 아이템 인앱결제나 앱 1회 다운로드 결제인 경우**

[추출 규칙 - 반드시 모두 준수할 것]

★ 규칙 A (절대 규칙 - 중복 금지):
발신자(From) 도메인(@netflix.com, @apple.com 등)이 동일하거나, 서비스 이름이 같은 이메일이 여러 개 있어도 **반드시 단 1개의 JSON 객체만 출력**하세요. 이 규칙을 어기면 결과 전체가 무효입니다.
- 같은 서비스의 '가입 환영 메일(과거)'과 '최근 결제 영수증(현재)'이 둘 다 있으면 → **1개로 합병**, 최신 유료 정보 우선
- 같은 서비스의 '무료 가입'과 '유료 전환'이 둘 다 있으면 → **1개로 합병**, 유료 상태 우선
- 동일 플랫폼이 2개 이상 출력되는 것은 절대 불가

★ 규칙 B (cost 필드 - 증거 없이 추측 금지):
- 본문에 명확한 결제 금액(예: 14,900원, $15.99, ₩9,900)이 직접 적혀 있는 경우에만 해당 금액을 \`cost\`에 기재
- 금액 증거가 없으면 → 무조건 \`cost\`: "무료" 로 기재 (유료라고 추측하거나 임의로 금액 적지 말 것)
- 1회성 결제건은 추출 대상에서 완전히 제거

★ 규칙 C (account_id 추출):
- 이메일 수신자 주소나 본문에 명시된 계정 ID/이메일이 있으면 \`account_id\`에 기재
- 본문에 "임시 비밀번호" 등이 있으면 \`notes\` 필드에 "패스워드: ~~~" 형태로 기록 (없으면 빈 문자열)

★ 규칙 D (해지 및 취소 필터링 - 매우 중요):
- 이메일 본문이나 제목에 "구독 취소", "해지됨", "취소 완료", "cancelled", "refunded", "이용권 해지" 등 서비스 만료/해지 관련 내용이 명시되어 있다면 해당 서비스는 현재 사용 중이 아니므로 반드시 \`isActive: false\` 로 기재하세요. 
- 그 외 정상 가입/구독 상태라면 \`isActive: true\` 입니다.

[출력 형식 - 오직 유효한 JSON 배열만 출력, \`\`\`json 등 마크다운 블록 절대 사용 금지]
[
  {
    "id": "고유숫자",
    "service": "실제 서비스 이름 (예: Netflix, Notion, 쿠팡 등)",
    "account_id": "발견된 아이디 또는 이메일 (없으면 빈 문자열)",
    "cost": "결제금액 (예: '14,900원') 또는 결제 증거 없으면 반드시 '무료'",
    "isPaid": true, // 결제 금액이 있는 유료 서비스라면 true, 증거가 없는 0원/무료면 false
    "isActive": true, // 해지/취소/환불 내역이 있다면 false, 현재 유지 중이면 true
    "date": "다음 갱신/결제 날짜 또는 최근 메일 수신일 (없으면 '기록 없음')",
    "category": "OTT|생산성|소셜/커뮤니티|쇼핑|구독|기타 중 가장 적합한 하나",
    "notes": "패스워드 등 기타 특이사항 (없으면 빈 문자열)"
  }
]

최종 출력 전 자가 검토: 같은 서비스가 2개 이상 있으면 1개로 합병 후 출력하세요.
오직 위 JSON 배열 형태만 반환하세요. JSON 문법에 오류가 없어야 합니다.

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

        // 스코프 부족, 인증 에러인 경우 재연동 유도 (DB를 확실하게 초기화하여 클라이언트와 상태를 동기화시킴)
        if (scanResult.error && (scanResult.error.includes("insufficient authentication scopes") || scanResult.error.includes("invalid_grant") || scanResult.error.includes("403") || scanResult.error.includes("401"))) {
            await supabase.from("profiles").update({
                gmail_connected: false,
                gmail_refresh_token: null
            }).eq("id", user.id);

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

            let parsed: any[] = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));

            // [2차 큐레이션 필터] AI 결과를 바탕으로 TypeScript 단에서 확실하게 한 번 더 필러링
            
            // 1. 해지된 구독 무조건 제외
            parsed = parsed.filter(item => item.isActive !== false);

            // 2. 사용자 특별 의도 필터링
            if (userIntent) {
                const intentLower = userIntent.toLowerCase();
                
                // 유료 서비스 필터
                if (intentLower.includes("돈나가는") || intentLower.includes("유료") || intentLower.includes("결제된")) {
                    parsed = parsed.filter(item => item.isPaid === true);
                }
                // OTT 필터
                else if (intentLower.includes("ott") || intentLower.includes("스트리밍")) {
                    parsed = parsed.filter(item => item.category === "OTT");
                }
                // 생산성/클라우드 필터
                else if (intentLower.includes("클라우드") || intentLower.includes("업무") || intentLower.includes("작업")) {
                    parsed = parsed.filter(item => item.category === "생산성" || item.category === "클라우드");
                }
            }

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
    let inboxCount = 0;
    let lastError = "";

    // 메시지 ID 중복 제거용
    const seenIds = new Set<string>();
    // 발신자 도메인별 수집 카운트 (도메인당 최대 10개로 제한하여 특정 서비스 이메일이 무한 수집되는 것을 방지하되, 여러 구글 결제 등을 놓치지 않게 여유를 둠)
    const domainCount = new Map<string, number>();
    const MAX_PER_DOMAIN = 10;

    // 발신자에서 도메인 추출
    const extractDomain = (from: string): string => {
        const match = from.match(/@([\w.-]+)/);
        return match ? match[1].toLowerCase() : from.toLowerCase().slice(0, 20);
    };

    // 단일 메시지 전체 정보 가져오기 (snippet + 본문 일부)
    const getFullMeta = async (id: string): Promise<{ text: string; domain: string } | null> => {
        try {
            // format=full 로 본문까지 포함
            const data = await gmailGet(token, `/messages/${id}?format=full`);
            const hs: { name: string; value: string }[] = data.payload?.headers ?? [];
            const subject = hs.find(h => h.name === "Subject")?.value ?? "";
            const from = hs.find(h => h.name === "From")?.value ?? "";
            const date = hs.find(h => h.name === "Date")?.value ?? "";
            const snippet: string = data.snippet ?? "";
            const bodyText = extractBody(data.payload);
            const domain = extractDomain(from);

            return {
                text: `제목: ${subject}\n발신자: ${from}\n날짜: ${date}\n본문요약: ${snippet}\n본문: ${bodyText}`,
                domain,
            };
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
            `newer_than:12m ("정기 결제" OR 구독 OR subscription OR recurring) -("1회성" OR 단건)`,
            `newer_than:12m (receipt OR 영수증 OR invoice OR "payment successful" OR 결제 OR "결제 완료") (월간 OR monthly OR renew OR 갱신) -("주문이 완료" OR "배송이 시작" OR "배달")`,
        ];
    } else {
        // 일반적인 "디지털 유산 찾아줘" 요청 시 (전체 스캔)
        queries = [
            `newer_than:12m ("정기 결제" OR 구독 OR subscription OR recurring) -("1회성" OR 단건)`,
            `newer_than:12m (receipt OR 영수증 OR invoice OR "payment successful" OR 결제 OR "결제 완료") (월간 OR monthly OR renew OR 갱신) -("주문이 완료" OR "배송이 시작" OR "배달")`,
            `newer_than:12m ("가입을 환영합니다" OR "welcome to") -label:promotions -("뉴스레터" OR "소식지" OR "광고")`,
        ];
    }

    // 공통 추가: 해지 확인용 쿼리 (가장 중요한 부분)
    queries.push(`newer_than:12m ("구독 취소" OR 해지 OR 환불 OR cancelled OR refunded OR "subscription canceled" OR "이용권 해지") -label:promotions`);

    const emailBodies: string[] = [];

    for (const q of queries) {
        try {
            const data = await gmailGet(token, `/messages?maxResults=40&q=${encodeURIComponent(q)}`);
            const msgs: { id: string }[] = data.messages ?? [];
            inboxCount += msgs.length;
            console.log(`[Gmail] 쿼리 "${q.slice(0, 40)}..." 결과: ${msgs.length}개`);

            // 최대 25개씩 병렬 처리
            const results = await Promise.all(
                msgs.slice(0, 25)
                    // 이미 처리한 메시지 ID 스킵
                    .filter(m => !seenIds.has(m.id))
                    .map(async m => {
                        seenIds.add(m.id);
                        return getFullMeta(m.id);
                    })
            );

            for (const r of results) {
                if (!r) continue;
                // 도메인별 최대 MAX_PER_DOMAIN개 제한 (같은 서비스 이메일 대량 수집 방지)
                const cnt = domainCount.get(r.domain) ?? 0;
                if (cnt >= MAX_PER_DOMAIN) continue;
                domainCount.set(r.domain, cnt + 1);
                emailBodies.push(r.text);
            }
        } catch (e) {
            lastError = String(e);
            console.error("[Gmail] 쿼리 검색 실패:", e);
        }
    }

    console.log(`[Gmail] 최종 수집: ${emailBodies.length}개 (도메인별 최대 ${MAX_PER_DOMAIN}개 제한), 오류: ${lastError}`);
    return {
        emailTexts: emailBodies.join("\n---\n"),
        inboxCount,
        error: lastError || undefined,
    };
}
