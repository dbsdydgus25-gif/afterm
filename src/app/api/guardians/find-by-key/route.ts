import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 고인 디지털 유산 열람 API
 * 인증 조건: 가디언즈 본인 이름 + 고인 이름 + 고인 핸드폰 + API 키 모두 일치해야 열람 가능
 * 하나라도 불일치하면 즉시 거부
 */
export async function POST(req: NextRequest) {
    try {
        const { guardianName, deceasedName, deceasedPhone, apiKey } = await req.json();

        // ─── 입력값 기본 검증 ─────────────────────────────────────
        if (!guardianName || !deceasedName || !deceasedPhone || !apiKey) {
            return NextResponse.json(
                { error: "가디언즈 이름, 고인 이름, 고인 핸드폰 번호, API 키를 모두 입력해주세요." },
                { status: 400 }
            );
        }

        // 핸드폰 번호 정규화 (숫자만)
        const cleanInputPhone = deceasedPhone.replace(/[^0-9]/g, "");
        if (cleanInputPhone.length < 10) {
            return NextResponse.json({ error: "올바른 핸드폰 번호를 입력해주세요." }, { status: 400 });
        }

        const supabase = await createClient();

        // ─── Step 1: API 키로 고인 프로필 조회 ───────────────────
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("id, name, phone, api_key")
            .eq("api_key", apiKey.trim())
            .maybeSingle(); // single() → maybeSingle() 로 변경 (오류 방지)

        if (profileErr || !profile) {
            // API 키가 유효하지 않음 → 즉시 차단
            return NextResponse.json(
                { error: "유효하지 않은 API 키입니다. 고인이 공유한 API 키를 다시 확인해주세요." },
                { status: 403 }
            );
        }

        // ─── Step 2: 고인 이름 대조 (필수 검증) ─────────────────
        // 프로필에 이름이 없는 경우도 차단 (빈 값이면 누구든 통과되는 취약점 방지)
        const profileNameNorm = (profile.name || "").trim().replace(/\s/g, "");
        const inputNameNorm = deceasedName.trim().replace(/\s/g, "");

        if (!profileNameNorm) {
            // 고인 프로필에 이름이 등록되지 않은 경우 → 열람 불가
            return NextResponse.json(
                { error: "고인 계정에 이름 정보가 없어 신원 확인이 불가능합니다." },
                { status: 403 }
            );
        }
        if (profileNameNorm !== inputNameNorm) {
            return NextResponse.json(
                { error: "고인 이름이 일치하지 않습니다." },
                { status: 403 }
            );
        }

        // ─── Step 3: 고인 핸드폰 번호 대조 (필수 검증) ──────────
        const profilePhoneNorm = (profile.phone || "").replace(/[^0-9]/g, "");

        if (!profilePhoneNorm) {
            // 프로필에 전화번호 없으면 열람 불가 (보안 강화)
            return NextResponse.json(
                { error: "고인 계정에 전화번호 정보가 없어 신원 확인이 불가능합니다." },
                { status: 403 }
            );
        }
        if (profilePhoneNorm !== cleanInputPhone) {
            return NextResponse.json(
                { error: "고인 전화번호가 일치하지 않습니다." },
                { status: 403 }
            );
        }

        // ─── Step 4: 가디언즈 등록 여부 확인 ────────────────────
        // 해당 고인 계정에 등록된 가디언즈인지 확인
        const { data: guardiansList } = await supabase
            .from("guardians")
            .select("id, name, phone")
            .eq("user_id", profile.id);

        // 가디언즈가 설정되어 있으면 → 등록된 가디언즈 명단에 있어야 열람 가능
        if (guardiansList && guardiansList.length > 0) {
            const inputGuardianName = guardianName.trim().replace(/\s/g, "");
            const isRegistered = guardiansList.some(g => {
                const gName = (g.name || "").trim().replace(/\s/g, "");
                return gName === inputGuardianName;
            });
            if (!isRegistered) {
                return NextResponse.json(
                    { error: "등록된 가디언즈 명단에 없는 이름입니다. 고인이 지정한 가디언즈만 열람할 수 있습니다." },
                    { status: 403 }
                );
            }
        }

        // ─── Step 5: 디지털 유산(vault_items) 조회 ──────────────
        const { data: vaultItems, error: vaultErr } = await supabase
            .from("vault_items")
            .select("id, category, platform_name, account_id, notes, created_at")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false });

        if (vaultErr) throw vaultErr;

        // ─── Step 6: 잠긴 메시지 공개 처리 ──────────────────────
        const { data: messages } = await supabase
            .from("messages")
            .select("id, content, recipient_name, recipient_phone, status")
            .eq("user_id", profile.id)
            .eq("status", "locked");

        if (messages && messages.length > 0) {
            await supabase
                .from("messages")
                .update({ status: "unlocked", is_unlocked: true })
                .eq("user_id", profile.id)
                .eq("status", "locked");
        }

        // ─── Step 7: 접근 로그 기록 ──────────────────────────────
        try {
            await supabase.from("guardian_access_logs").insert({
                target_user_id: profile.id,
                access_type: "api_key_open",
                guardian_name: guardianName,
                accessed_at: new Date().toISOString()
            });
        } catch { /* 로그 실패 무시 */ }

        // ─── 응답: 인증 성공 ─────────────────────────────────────
        return NextResponse.json({
            success: true,
            deceasedName: profile.name,
            vaultItems: (vaultItems || []).map(v => ({
                id: v.id,
                category: v.category,
                platform_name: v.platform_name,
                account_id: v.account_id,   // 아이디
                notes: v.notes,              // 메모 (비밀번호 포함 가능)
                created_at: v.created_at
            })),
            messages: (messages || []).map(m => ({
                id: m.id,
                content: m.content,
                recipient_name: m.recipient_name
            })),
            messagesReleased: messages?.length ?? 0,
        });

    } catch (error) {
        console.error("[Find By Key Error]", error);
        return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }
}
