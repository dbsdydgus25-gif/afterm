import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 고인의 이름 + 생년월일 + API 키로 디지털 유산을 찾는 API
// uid 없이 /guardians/open 에서 직접 접근 가능
export async function POST(req: NextRequest) {
    try {
        const { deceasedName, birthDate, apiKey, deathCertificatePath } = await req.json();

        if (!deceasedName || !birthDate || !apiKey) {
            return NextResponse.json({ error: "고인 이름, 생년월일, API 키를 모두 입력해주세요." }, { status: 400 });
        }

        const supabase = await createClient();

        // 1) API 키로 유저 찾기
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("id, name, birth_date, api_key")
            .eq("api_key", apiKey)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "유효하지 않은 API 키입니다." }, { status: 404 });
        }

        // 2) 이름 대조 (OCR 결과 or 직접 입력)
        const profileName = (profile.name || "").trim().replace(/\s/g, "");
        const inputName = deceasedName.trim().replace(/\s/g, "");

        if (profileName !== inputName) {
            return NextResponse.json(
                { error: "입력하신 이름이 등록된 정보와 일치하지 않습니다. 사망진단서의 이름을 정확히 입력해주세요." },
                { status: 403 }
            );
        }

        // 3) 생년월일 대조
        if (profile.birth_date) {
            const storedDate = new Date(profile.birth_date).toISOString().slice(0, 10);
            const inputDate = new Date(birthDate).toISOString().slice(0, 10);
            if (storedDate !== inputDate) {
                return NextResponse.json(
                    { error: "생년월일이 일치하지 않습니다." },
                    { status: 403 }
                );
            }
        }

        // 4) 디지털 유산(vault_items) 조회
        const { data: vaultItems, error: vaultErr } = await supabase
            .from("vault_items")
            .select("id, category, platform_name, account_id, notes")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false });

        if (vaultErr) throw vaultErr;

        // 5) 사망진단서 업로드 경로 로그 기록 (추후 감사 추적용)
        if (deathCertificatePath) {
            try {
                await supabase.from("guardian_access_logs").insert({
                    target_user_id: profile.id,
                    access_type: "find_by_key",
                    death_certificate_path: deathCertificatePath,
                    accessed_at: new Date().toISOString()
                });
            } catch { /* 로그 실패는 무시 */ }
        }

        return NextResponse.json({
            success: true,
            vaultItems: (vaultItems || []).map(v => ({
                id: v.id,
                category: v.category,
                platform_name: v.platform_name,
                username: v.account_id,
                notes: v.notes
            })),
            messagesReleased: 0,
            totalMessages: 0
        });

    } catch (error) {
        console.error("[Find By Key Error]", error);
        return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }
}
