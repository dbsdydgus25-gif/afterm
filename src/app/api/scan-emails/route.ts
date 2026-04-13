import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SCAN_PROMPT = (emailTexts: string, userIntent?: string) => `
당신은 사용자의 디지털 유산 정리를 돕는 AI입니다.
이메일을 분석해서 **진짜로 중요한 디지털 자산**만 추출하세요.

${userIntent ? `[✅ 사용자 요청 (최우선 적용)]
"${userIntent}"
→ 이 요청에 맞는 카테고리/조건만 추출하세요.` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【추출 대상 — 4개 핵심 카테고리만】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 📱 통신 — 매월 요금이 청구되는 통신/인터넷 서비스
   예: SKT, KT, LG U+, 알뜰폰, 인터넷, KT인터넷, LG인터넷 등

2. 💳 유료구독 — 정기 결제되는 모든 유료 구독 서비스
   예: Netflix, 티빙, 왓챠, 쿠팡 로켓와우, 멜론, Spotify, Adobe, Microsoft 365,
       Apple One, YouTube Premium, 네이버플러스, 카카오 이모티콘 구독 등

3. ☁️ 클라우드 — 데이터·파일이 저장된 클라우드 서비스 (유료/무료 모두)
   예: iCloud, Google One, 구글 드라이브, 원드라이브, 네이버 MYBOX, 드롭박스, AWS 등

4. 👤 SNS — 계정이 살아있는 소셜/커뮤니티 서비스
   예: Instagram, Facebook, Twitter/X, TikTok, LinkedIn, 카카오스토리, 네이버 밴드 등

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【제외 대상 — 절대 추출 금지】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 쇼핑몰 1회성 구매 (쿠팡 상품 주문, 배달, 옷 구매 등 정기결제 아닌 것)
- 게임 아이템/앱 1회 결제 (인앱결제, 앱 다운로드)
- 스팸/광고/프로모션 이메일
- 이미 해지/취소/환불된 서비스 (isActive: false로 표시)
- 금융(은행/증권/보험) — 별도 관리 필요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【규칙】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ 중복 절대 금지: 같은 서비스는 반드시 1개만 (최신/유료 정보 우선)
★ cost: 명확한 금액 증거 있을 때만 기재, 없으면 "무료"
★ category: 반드시 "통신" | "유료구독" | "클라우드" | "SNS" 중 하나

[출력 형식 — JSON 배열만, 마크다운 블록 없이]
[
  {
    "id": "고유숫자",
    "service": "서비스 이름 (예: Netflix, SKT, iCloud)",
    "account_id": "발견된 이메일/아이디 (없으면 빈 문자열)",
    "cost": "월 결제금액 (예: 14,900원) 또는 증거 없으면 '무료'",
    "isPaid": true,
    "isActive": true,
    "date": "다음 갱신일 또는 최근 메일 날짜 (없으면 '기록 없음')",
    "category": "통신 | 유료구독 | 클라우드 | SNS 중 하나",
    "notes": "특이사항 (없으면 빈 문자열)"
  }
]

최종 출력 전 자가 검토: 위 4개 카테고리 외 항목이 있으면 제거하세요.
오직 JSON 배열만 반환하세요.

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
                // 서버사이드 API route에서는 NEXT_PUBLIC_ 접두어 없는 환경변수를 사용해야 함
                const clientId = process.env.GOOGLE_CLIENT_ID;
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

        // emailTexts 글자 수 대신 수집된 이메일 개수(inboxCount)로 판단
        // 이유: 이메일 본문이 짧아도(예: 알림 메일) 유의미한 데이터일 수 있음
        if (!scanResult.emailTexts || scanResult.inboxCount === 0) {
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

        // gemini-2.0-flash-lite: API 키에서 제공하는 최신 경량화 모델 (가장 높은 무료 한도 제공)
        const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        let result;
        try {
            result = await model.generateContent(SCAN_PROMPT(scanResult.emailTexts, userIntent));
        } catch (geminiErr: any) {
            const errMsg = geminiErr?.message || "";
            // 429 쿼터 초과 시 사용자 친화적 메시지 반환
            if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.includes("quota")) {
                return NextResponse.json({
                    items: [],
                    message: "현재 AI 분석 서버가 잠시 바쁩니다. 1~2분 후 다시 시도해주세요. ⏳",
                    error: "quota_exceeded"
                });
            }
            throw geminiErr;
        }
        const rawText = result.response.text().trim();

        console.log("[Gemini Raw Text 앞500자]:", rawText.slice(0, 500));

        try {
            const jsonStart = rawText.indexOf("[");
            const jsonEnd = rawText.lastIndexOf("]");
            if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON 배열을 찾을 수 없음");

            let parsed: any[] = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));

            // [2차 큐레이션 필터] AI 결과를 TypeScript 단에서 재검증

            // 1. 허용 카테고리 외 항목 제거 (4개 핵심 카테고리만)
            const ALLOWED_CATEGORIES = ["통신", "유료구독", "클라우드", "SNS"];
            parsed = parsed.filter((item: { category?: string; isActive?: boolean }) => {
                if (item.isActive === false) return false; // 해지된 서비스 제외
                // category가 허용 목록에 없으면 제외
                return ALLOWED_CATEGORIES.includes(item.category ?? "");
            });

            // 2. 서비스명 기준 중복 제거 (유료 우선)
            parsed = parsed.reduce((acc: any[], item: any) => {
                const existing = acc.find((e: any) =>
                    e.service.toLowerCase().trim() === item.service.toLowerCase().trim()
                );
                if (!existing) {
                    acc.push(item);
                } else if (item.isPaid && !existing.isPaid) {
                    Object.assign(existing, item);
                }
                return acc;
            }, []);

            // 3. 사용자 의도별 필터링
            if (userIntent) {
                const il = userIntent.toLowerCase().replace(/\s+/g, "");

                // 통신 관련
                if (/통신|핸드폰요금|핸드폰비|인터넷요금|통신비|skt|kt|lgu/.test(il)) {
                    parsed = parsed.filter((i: any) => i.category === "통신");
                }
                // SNS 관련
                else if (/sns|소셜|인스타|페이스북|트위터|틱톡|링크드인/.test(il)) {
                    parsed = parsed.filter((i: any) => i.category === "SNS");
                }
                // 클라우드 관련
                else if (/클라우드|icloud|구글드라이브|원드라이브|드롭박스/.test(il)) {
                    parsed = parsed.filter((i: any) => i.category === "클라우드");
                }
                // 유료구독 관련
                else if (/유료|구독|결제|돈나가|돈빠져|ott|스트리밍|넷플|왓챠|티빙|멜론|스포티파이/.test(il)) {
                    parsed = parsed.filter((i: any) => i.category === "유료구독" || i.isPaid === true);
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
    } else if (intentLower.includes("소셜") || intentLower.includes("sns") || intentLower.includes("소셜 계정")) {
        // SNS 계정 가입 확인 이메일 특화 쿼리
        queries = [
            `newer_than:12m (instagram OR twitter OR tiktok OR linkedin OR facebook OR threads OR 인스타 OR 트위터 OR 틱톡 OR 링크드인 OR 스레드) (가입 OR welcome OR 로그인 OR 알림 OR 인증)`,
            `newer_than:12m ("가입을 환영합니다" OR "welcome to" OR "계정 생성" OR "새로운 로그인") -label:promotions -("뉴스레터" OR "광고")`
        ];
    } else if (intentLower.includes("음악") || intentLower.includes("음악 스트리밍")) {
        // 음악 스트리밍 서비스 특화 쿼리
        queries = [
            `newer_than:12m (spotify OR flo OR melon OR 멜론 OR 바이브 OR 지니뮤직 OR "apple music" OR "youtube music" OR 유튜브뮤직)`
        ];
    } else if (intentLower.includes("게임") || intentLower.includes("게임 구독")) {
        // 게임 구독 서비스 특화 쿼리
        queries = [
            `newer_than:12m (steam OR "xbox game pass" OR nintendo OR playstation OR "EA play" OR 넥슨 OR 엔씨소프트 OR 트리군)`
        ];
    } else if (intentLower.includes("구독")) {
        // 모든 구독 서비스 (종합)
        queries = [
            `newer_than:12m ("정기 결제" OR 구독 OR subscription OR recurring) -("1회성" OR 단건)`,
            `newer_than:12m (receipt OR 영수증 OR invoice OR "payment successful" OR 결제 OR "결제 완료") (월간 OR monthly OR renew OR 갱신) -("주문이 완료" OR "배송이 시작" OR "배달")`,
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
