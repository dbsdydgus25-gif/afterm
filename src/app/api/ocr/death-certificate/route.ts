import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

// ── Gemini 초기화 (OCR 텍스트 구조화 파싱용) ──────────────────────────
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── CLOVA OCR API 설정 ───────────────────────────────────────────────
// 네이버 클라우드 플랫폼 CLOVA OCR API 엔드포인트 및 시크릿 키
const CLOVA_OCR_INVOKE_URL = process.env.CLOVA_OCR_INVOKE_URL ?? "";
const CLOVA_OCR_SECRET = process.env.CLOVA_OCR_SECRET ?? "";

/**
 * CLOVA OCR API를 호출하여 이미지에서 텍스트를 추출합니다.
 * @param base64Image - Base64 인코딩된 이미지 데이터 (data: prefix 제외)
 * @param imageFormat - 이미지 형식 (jpg, png, pdf 등)
 * @returns 추출된 전체 텍스트 또는 null
 */
async function callClovaOcr(base64Image: string, imageFormat: string): Promise<string | null> {
    // CLOVA OCR API 요청 본문 구성
    const requestBody = {
        version: "V2",
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        images: [
            {
                format: imageFormat.toLowerCase().replace("jpeg", "jpg"),
                name: "death-certificate",
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
        const errText = await res.text();
        console.error("[CLOVA OCR] API 호출 실패:", res.status, errText);
        return null;
    }

    const data = await res.json();

    // CLOVA OCR 응답에서 인식된 텍스트 추출 (inferText 필드)
    const extractedTexts: string[] = [];
    for (const image of data.images ?? []) {
        for (const field of image.fields ?? []) {
            if (field.inferText) {
                extractedTexts.push(field.inferText);
            }
        }
    }

    return extractedTexts.join(" ");
}

/**
 * Gemini를 사용하여 OCR 텍스트에서 사망진단서 핵심 정보를 파싱합니다.
 * @param ocrText - CLOVA OCR로 추출된 원문 텍스트
 * @returns 파싱된 사망진단서 정보 객체
 */
async function parseDeatCertificateFromOcr(ocrText: string): Promise<{
    deceased_name: string | null;
    death_date: string | null;
    issuing_institution: string | null;
    document_type: string;
    is_valid_death_cert: boolean;
}> {
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `다음은 사망진단서(또는 사체검안서)에서 OCR으로 추출된 텍스트입니다.
아래 JSON 형식으로 정보를 추출해주세요. 없는 정보는 null로 표시하세요.

중요한 판단 기준:
- "사망진단서", "사체검안서", "Death Certificate" 등의 문구가 있으면 is_valid_death_cert = true
- 사망일은 "사망연월일", "사망일시" 등의 라벨 옆에 있는 날짜
- 발급 기관은 병원명, 의원명 등

반드시 아래 JSON 형식만 출력하세요 (마크다운 코드블록 없이):
{
  "deceased_name": "고인 성명 (예: 홍길동) 또는 null",
  "death_date": "사망 연월일 YYYY-MM-DD 형식 또는 null",
  "issuing_institution": "발급 기관명 (병원명 등) 또는 null",
  "document_type": "사망진단서 또는 사체검안서 또는 기타",
  "is_valid_death_cert": true 또는 false
}

OCR 텍스트:
${ocrText}`;

    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();

        // JSON 파싱
        const jsonStart = rawText.indexOf("{");
        const jsonEnd = rawText.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON 형식 없음");

        return JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
    } catch (err) {
        console.error("[Gemini] 사망진단서 파싱 실패:", err);
        return {
            deceased_name: null,
            death_date: null,
            issuing_institution: null,
            document_type: "기타",
            is_valid_death_cert: false,
        };
    }
}

// ════════════════════════════════════════════════════════════════
// POST /api/ocr/death-certificate
// 사망진단서 이미지를 받아 OCR 처리 후 DB에 저장합니다.
// 요청 body: { imageBase64: string, imageFormat: string, deceasedUserId?: string }
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 인증 확인 (가디언이 업로드하는 경우 로그인 필수)
        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const body = await req.json();
        const { imageBase64, imageFormat = "jpg", deceasedUserId } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "이미지 데이터가 필요합니다." }, { status: 400 });
        }

        // CLOVA OCR API 설정 확인
        if (!CLOVA_OCR_INVOKE_URL || !CLOVA_OCR_SECRET) {
            console.error("[OCR] CLOVA OCR 환경변수가 설정되지 않았습니다.");
            return NextResponse.json({ error: "OCR 서비스 설정이 완료되지 않았습니다." }, { status: 503 });
        }

        // 이미지 해시 계산 (중복 제출 방지용)
        const imageHash = crypto
            .createHash("sha256")
            .update(imageBase64)
            .digest("hex");

        // Step 1: CLOVA OCR 호출
        console.log("[OCR] CLOVA OCR API 호출 시작...");
        const ocrText = await callClovaOcr(imageBase64, imageFormat);

        if (!ocrText || ocrText.trim().length < 10) {
            return NextResponse.json({
                error: "이미지에서 텍스트를 인식할 수 없습니다. 더 선명한 이미지를 업로드해주세요.",
                status: "failed"
            }, { status: 422 });
        }

        console.log("[OCR] 추출된 텍스트 앞200자:", ocrText.slice(0, 200));

        // Step 2: Gemini로 구조화 파싱
        console.log("[OCR] Gemini로 사망진단서 정보 파싱 중...");
        const parsed = await parseDeatCertificateFromOcr(ocrText);

        // Step 3: 유효한 사망진단서인지 확인
        if (!parsed.is_valid_death_cert) {
            return NextResponse.json({
                error: "업로드된 문서가 사망진단서 또는 사체검안서로 확인되지 않습니다.",
                status: "invalid_document",
                parsed
            }, { status: 422 });
        }

        // Step 4: DB에 검증 기록 저장
        // 보안: 원본 이미지는 저장하지 않고, OCR 원문과 해시만 저장
        const { data: verification, error: dbError } = await supabase
            .from("death_certificate_verifications")
            .insert({
                guardian_id: user.id,
                deceased_user_id: deceasedUserId || null,
                deceased_name: parsed.deceased_name,
                death_date: parsed.death_date,
                issuing_institution: parsed.issuing_institution,
                status: "verified",
                verified_at: new Date().toISOString(),
                ocr_raw_text: ocrText.slice(0, 2000), // 최대 2000자만 저장
                image_hash: imageHash,
            })
            .select()
            .single();

        if (dbError) {
            console.error("[OCR] DB 저장 실패:", dbError);
            // DB 저장 실패해도 OCR 결과는 반환 (부분 성공)
        }

        console.log("[OCR] 사망진단서 인증 완료:", parsed.deceased_name, parsed.death_date);

        return NextResponse.json({
            status: "verified",
            verificationId: verification?.id ?? null,
            deceased_name: parsed.deceased_name,
            death_date: parsed.death_date,
            issuing_institution: parsed.issuing_institution,
            document_type: parsed.document_type,
            message: `${parsed.deceased_name ?? "고인"}님의 사망이 확인되었습니다. 디지털 유산에 접근할 수 있습니다.`,
        });

    } catch (e: any) {
        console.error("[OCR] 사망진단서 처리 중 서버 오류:", e);
        return NextResponse.json({
            error: e.message || "서버 오류가 발생했습니다.",
            status: "error"
        }, { status: 500 });
    }
}
