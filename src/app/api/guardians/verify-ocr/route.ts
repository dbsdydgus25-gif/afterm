import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

// ── Service Role Supabase 클라이언트 (가디언 목록, 프로필 조회용) ──
const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Gemini 초기화 ──────────────────────────────────────────
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── CLOVA OCR 설정 ─────────────────────────────────────────
const CLOVA_OCR_INVOKE_URL = process.env.CLOVA_OCR_INVOKE_URL ?? "";
const CLOVA_OCR_SECRET = process.env.CLOVA_OCR_SECRET ?? "";

/** 문자열 정규화 (공백, 대소문자 무시) */
function norm(s: string | null | undefined): string {
    return (s || "").trim().replace(/\s+/g, "").toLowerCase();
}

/** 생년월일 정규화: 다양한 형식 → YYYYMMDD */
function normalizeBirthDate(raw: string): string {
    // 숫자만 추출
    return raw.replace(/[^0-9]/g, "");
}

/**
 * CLOVA OCR API 호출
 * @returns 인식된 전체 텍스트
 */
async function callClovaOcr(base64Image: string, imageFormat: string): Promise<string | null> {
    if (!CLOVA_OCR_INVOKE_URL || !CLOVA_OCR_SECRET) return null;

    const requestBody = {
        version: "V2",
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        images: [
            {
                format: imageFormat.toLowerCase().replace("jpeg", "jpg"),
                name: "death-cert",
                data: base64Image,
            },
        ],
    };

    const res = await fetch(CLOVA_OCR_INVOKE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-OCR-SECRET": CLOVA_OCR_SECRET,
        },
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        console.error("[CLOVA OCR] 호출 실패:", res.status, await res.text());
        return null;
    }

    const data = await res.json();
    const texts: string[] = [];
    for (const image of data.images ?? []) {
        for (const field of image.fields ?? []) {
            if (field.inferText) texts.push(field.inferText);
        }
    }
    return texts.join(" ");
}

/**
 * Gemini로 사망진단서 OCR 텍스트에서 구조화 정보 파싱
 * - deceased_name: 고인 성명
 * - birth_date: 생년월일 (YYYYMMDD 형식)
 * - death_date: 사망일
 * - is_valid: 사망진단서/사체검안서 여부
 */
async function parseDeathCertificate(ocrText: string) {
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `다음은 사망진단서(또는 사체검안서)에서 OCR로 추출된 텍스트입니다.
아래 JSON 형식만 출력하세요 (마크다운 없이):
{
  "deceased_name": "고인 성명 또는 null",
  "birth_date": "생년월일 숫자8자리(YYYYMMDD) 또는 null",
  "death_date": "사망일 또는 null",
  "is_valid": true 또는 false
}

판단 기준:
- "사망진단서", "사체검안서", "Death Certificate" 텍스트 존재 → is_valid: true
- birth_date: "주민등록번호" 또는 "생년월일" 라벨 옆 날짜를 YYYYMMDD로 변환 (주민번호 앞 6자리도 포함)
- deceased_name: "성명", "이름" 라벨 옆 값

OCR 텍스트:
${ocrText}`;

    try {
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const jsonStart = raw.indexOf("{");
        const jsonEnd = raw.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON 없음");
        return JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
    } catch {
        return { deceased_name: null, birth_date: null, death_date: null, is_valid: false };
    }
}

// ════════════════════════════════════════════════════════════════
// POST /api/guardians/verify-ocr
// 사망진단서 OCR 기반 가디언 인증 → API 키 발급
//
// 요청 body:
//   guardianName  - 가디언(열람자) 이름
//   deceasedName  - 열람자가 입력한 고인 이름
//   deceasedBirth - 열람자가 입력한 고인 생년월일 (YYYYMMDD 또는 YYYY-MM-DD)
//   deceasedPhone - 열람자가 입력한 고인 전화번호
//   imageBase64   - 사망진단서 이미지 Base64
//   imageFormat   - 이미지 형식 (jpg/png/pdf)
//   userId        - 고인 user_id (URL query uid)
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            guardianName,
            deceasedName,
            deceasedBirth,
            deceasedPhone,
            imageBase64,
            imageFormat = "jpg",
            userId,
        } = body;

        // ── 1. 입력값 검증 ─────────────────────────────────────
        if (!guardianName || !deceasedName || !deceasedBirth || !deceasedPhone || !imageBase64) {
            return NextResponse.json({
                error: "모든 항목(가디언 이름, 고인 이름, 생년월일, 전화번호, 사망진단서 이미지)을 입력해주세요."
            }, { status: 400 });
        }

        // ── 2. 고인 프로필 조회 (전화번호 + userId 기준) ───────
        const inputPhone = deceasedPhone.replace(/[^0-9]/g, "");

        let profileQuery = serviceSupabase
            .from("profiles")
            .select("id, full_name, phone, api_key");

        if (userId) {
            profileQuery = profileQuery.eq("id", userId);
        } else {
            profileQuery = profileQuery.eq("phone", inputPhone);
        }

        const { data: profiles } = await profileQuery;

        // 전화번호로 매칭되는 프로필 찾기
        let profile = profiles?.find(p => {
            const dbPhone = (p.phone || "").replace(/[^0-9]/g, "");
            return dbPhone === inputPhone;
        });

        // auth metadata에서도 확인
        if (!profile && userId) {
            const { data: authUser } = await serviceSupabase.auth.admin.getUserById(userId);
            const metaPhone = (authUser?.user?.user_metadata?.phone || authUser?.user?.phone || "").replace(/[^0-9]/g, "");
            if (metaPhone === inputPhone) {
                profile = profiles?.[0];
            }
        }

        if (!profile) {
            return NextResponse.json({
                error: "입력한 고인 전화번호로 등록된 AFTERM 계정을 찾을 수 없습니다."
            }, { status: 404 });
        }

        // ── 3. 가디언 목록 대조 ────────────────────────────────
        const { data: guardiansList } = await serviceSupabase
            .from("guardians")
            .select("id, guardian_name, guardian_phone")
            .eq("user_id", profile.id);

        if (!guardiansList || guardiansList.length === 0) {
            return NextResponse.json({
                error: "해당 고인의 계정에 등록된 가디언즈가 없습니다."
            }, { status: 403 });
        }

        const matchedGuardian = guardiansList.find(g =>
            norm(g.guardian_name) === norm(guardianName)
        );

        if (!matchedGuardian) {
            return NextResponse.json({
                error: `'${guardianName}'님은 고인이 사전 지정한 가디언즈 목록에 없습니다. 고인이 등록한 가디언즈만 열람이 가능합니다.`
            }, { status: 403 });
        }

        // ── 4. CLOVA OCR 호출 ──────────────────────────────────
        console.log("[verify-ocr] CLOVA OCR 호출 시작...");
        const ocrText = await callClovaOcr(imageBase64, imageFormat);

        if (!ocrText || ocrText.trim().length < 10) {
            return NextResponse.json({
                error: "사망진단서에서 텍스트를 인식할 수 없습니다. 더 선명한 사진을 다시 업로드해주세요."
            }, { status: 422 });
        }

        // ── 5. Gemini로 사망진단서 정보 파싱 ──────────────────
        console.log("[verify-ocr] Gemini 파싱 중...");
        const certInfo = await parseDeathCertificate(ocrText);
        console.log("[verify-ocr] OCR 파싱 결과:", certInfo);

        // 유효한 사망진단서인지 확인
        if (!certInfo.is_valid) {
            return NextResponse.json({
                error: "업로드된 문서가 사망진단서 또는 사체검안서로 확인되지 않습니다. 올바른 문서를 업로드해주세요."
            }, { status: 422 });
        }

        // ── 6. 이름 매칭 ─────────────────────────────────────
        if (certInfo.deceased_name && norm(certInfo.deceased_name) !== norm(deceasedName)) {
            return NextResponse.json({
                error: `사망진단서에 기재된 이름(${certInfo.deceased_name})과 입력하신 이름(${deceasedName})이 일치하지 않습니다.`
            }, { status: 403 });
        }

        // ── 7. 생년월일 매칭 ──────────────────────────────────
        if (certInfo.birth_date) {
            const ocr_birth = normalizeBirthDate(certInfo.birth_date);
            const input_birth = normalizeBirthDate(deceasedBirth);
            // 8자리 비교 (YYYYMMDD), 또는 주민번호 앞 6자리(YYMMDD) 기준으로도 비교
            const ocr6 = ocr_birth.slice(-6);
            const input6 = input_birth.slice(-6);
            if (ocr6 && input6 && ocr6 !== input6) {
                return NextResponse.json({
                    error: "사망진단서의 생년월일과 입력하신 생년월일이 일치하지 않습니다."
                }, { status: 403 });
            }
        }

        // ── 8. 인증 성공 — OCR 검증 기록 저장 (이미지 비저장) ─
        const imageHash = crypto.createHash("sha256").update(imageBase64).digest("hex");

        try {
            await serviceSupabase.from("death_certificate_verifications").insert({
                guardian_id: null,                         // 비로그인 가디언이므로 null
                deceased_user_id: profile.id,
                deceased_name: certInfo.deceased_name || deceasedName,
                death_date: certInfo.death_date,
                status: "verified",
                verified_at: new Date().toISOString(),
                ocr_raw_text: ocrText.slice(0, 2000),
                image_hash: imageHash,
            });
        } catch (dbErr) {
            console.warn("[verify-ocr] OCR 기록 저장 실패 (계속 진행):", dbErr);
        }

        // ── 9. 가디언 상태 업데이트 & 디지털 유산 조회 ────────
        await serviceSupabase.from("guardians")
            .update({ status: "opened" })
            .eq("id", matchedGuardian.id);

        const [vaultRes, msgRes] = await Promise.all([
            serviceSupabase
                .from("vault_items")
                .select("id, category, platform_name, account_id, notes, created_at")
                .eq("user_id", profile.id)
                .order("created_at", { ascending: true }),
            serviceSupabase
                .from("messages")
                .select("id, content, recipient_name, recipient_phone, status")
                .eq("user_id", profile.id)
                .in("status", ["locked", "pending"]),
        ]);

        // 잠긴 메시지 해제 및 SMS 발송
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afterm.co.kr";
        let messagesReleased = 0;
        const deceasedDisplayName = profile.full_name || deceasedName;

        for (const msg of msgRes.data ?? []) {
            try {
                await serviceSupabase
                    .from("messages")
                    .update({ status: "unlocked", is_unlocked: true })
                    .eq("id", msg.id);

                if (msg.recipient_phone) {
                    const smsText = `[에프텀] ${deceasedDisplayName}님이 남긴 소중한 메시지가 있습니다.\n${siteUrl}/view/${msg.id}`;
                    await fetch(`${siteUrl}/api/sms/send`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: msg.recipient_phone, message: smsText }),
                    }).catch(() => {});
                }
                messagesReleased++;
            } catch (e) {
                console.error("[verify-ocr] 메시지 해제 실패:", e);
            }
        }

        // ── 10. API 키와 함께 결과 반환 ───────────────────────
        return NextResponse.json({
            success: true,
            deceasedName: deceasedDisplayName,
            apiKey: profile.api_key,                // 가디언에게 전달할 API 키
            ocrMatchedName: certInfo.deceased_name,
            vaultItems: (vaultRes.data ?? []).map(v => ({
                id: v.id,
                category: v.category,
                platform_name: v.platform_name,
                account_id: v.account_id,
                notes: v.notes,
                created_at: v.created_at,
            })),
            messagesReleased,
        });

    } catch (error: any) {
        console.error("[verify-ocr] 서버 오류:", error);
        return NextResponse.json({
            error: error.message || "인증 처리 중 서버 오류가 발생했습니다."
        }, { status: 500 });
    }
}
