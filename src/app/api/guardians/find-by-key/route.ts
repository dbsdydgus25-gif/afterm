import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 고인 디지털 유산 열람 API (UID 없이 API 키로 직접 접근)
 * 인증: 가디언즈 이름 + 고인 이름(full_name) + 고인 전화번호 + API 키
 * 성공 시: 디지털 유산 반환 + 잠긴 메시지를 수신인에게 SMS 발송
 */

// 서비스 역할 클라이언트 (RLS 우회)
const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

        // ─── Step 1: API 키로 고인 프로필 조회 ───────────────────
        // profiles 테이블은 name이 아니라 full_name, phone 컬럼 사용
        const { data: profile, error: profileErr } = await serviceSupabase
            .from("profiles")
            .select("id, full_name, phone, api_key")
            .eq("api_key", apiKey.trim())
            .maybeSingle();

        if (profileErr || !profile) {
            console.error("[find-by-key] API 키 조회 실패:", profileErr?.message);
            return NextResponse.json(
                { error: "유효하지 않은 API 키입니다. 고인이 공유한 API 키를 다시 확인해주세요." },
                { status: 403 }
            );
        }

        // ─── Step 2: 고인 이름 대조 ─────────────────────────────
        // profiles.full_name 컬럼 사용 (name이 아님)
        const profileNameNorm = (profile.full_name || "").trim().replace(/\s/g, "");
        const inputNameNorm = deceasedName.trim().replace(/\s/g, "");

        // full_name이 비어있는 경우 → 우회 불가 차단
        if (!profileNameNorm) {
            return NextResponse.json(
                { error: "고인 계정에 이름 정보가 없습니다. 설정에서 이름을 먼저 등록해주세요." },
                { status: 403 }
            );
        }
        if (profileNameNorm !== inputNameNorm) {
            return NextResponse.json(
                { error: "고인 이름이 일치하지 않습니다. 정확한 이름을 입력해주세요." },
                { status: 403 }
            );
        }

        // ─── Step 3: 고인 전화번호 대조 ─────────────────────────
        const profilePhoneNorm = (profile.phone || "").replace(/[^0-9]/g, "");

        // 전화번호가 없는 경우 → 차단
        if (!profilePhoneNorm) {
            return NextResponse.json(
                { error: "고인 계정에 전화번호 정보가 없습니다. 설정에서 전화번호를 먼저 등록해주세요." },
                { status: 403 }
            );
        }
        if (profilePhoneNorm !== cleanInputPhone) {
            return NextResponse.json(
                { error: "고인 전화번호가 일치하지 않습니다." },
                { status: 403 }
            );
        }

        // ─── Step 4: 가디언즈 명단 확인 (등록된 경우만 검증) ────
        const { data: guardiansList } = await serviceSupabase
            .from("guardians")
            .select("id, guardian_name, name")
            .eq("user_id", profile.id);

        if (guardiansList && guardiansList.length > 0) {
            const inputGuardianName = guardianName.trim().replace(/\s/g, "");
            const isRegistered = guardiansList.some(g => {
                // guardian_name 또는 name 컬럼 모두 확인
                const gName1 = (g.guardian_name || "").trim().replace(/\s/g, "");
                const gName2 = (g.name || "").trim().replace(/\s/g, "");
                return gName1 === inputGuardianName || gName2 === inputGuardianName;
            });
            if (!isRegistered) {
                return NextResponse.json(
                    { error: "등록된 가디언즈 명단에 없는 열람자입니다. 고인이 지정한 가디언즈만 열람할 수 있습니다." },
                    { status: 403 }
                );
            }
        }

        // ─── Step 5: 디지털 유산 조회 ────────────────────────────
        const { data: vaultItems, error: vaultErr } = await serviceSupabase
            .from("vault_items")
            .select("id, category, platform_name, account_id, notes, created_at")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false });

        if (vaultErr) throw vaultErr;

        // ─── Step 6: 잠긴 메시지 공개 및 SMS 발송 ──────────────
        const { data: pendingMessages } = await serviceSupabase
            .from("messages")
            .select("id, content, recipient_name, recipient_phone, status")
            .eq("user_id", profile.id)
            .in("status", ["locked", "pending"]);

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afterm.co.kr";
        let messagesReleased = 0;

        if (pendingMessages && pendingMessages.length > 0) {
            for (const msg of pendingMessages) {
                try {
                    // 메시지 상태 unlock 업데이트
                    await serviceSupabase
                        .from("messages")
                        .update({ status: "unlocked", is_unlocked: true })
                        .eq("id", msg.id);

                    // 수신인에게 SMS 발송
                    if (msg.recipient_phone) {
                        const smsText = `[에프텀] ${profile.full_name || "고인"}님이 남긴 소중한 메시지가 있습니다.\n아래 링크에서 확인해주세요.\n${siteUrl}/view/${msg.id}`;
                        await fetch(`${siteUrl}/api/sms/send`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone: msg.recipient_phone, message: smsText })
                        }).catch(() => { /* SMS 실패해도 열람은 허용 */ });
                    }
                    messagesReleased++;
                } catch (e) {
                    console.error("[find-by-key] 메시지 처리 오류:", e);
                }
            }
        }

        // ─── Step 7: 접근 로그 기록 ──────────────────────────────
        try {
            await serviceSupabase.from("guardian_access_logs").insert({
                target_user_id: profile.id,
                access_type: "api_key_open",
                guardian_name: guardianName,
                accessed_at: new Date().toISOString()
            });
        } catch { /* 로그 실패 무시 */ }

        // ─── 성공 응답 ───────────────────────────────────────────
        return NextResponse.json({
            success: true,
            deceasedName: profile.full_name,
            vaultItems: (vaultItems || []).map(v => ({
                id: v.id,
                category: v.category,
                platform_name: v.platform_name,
                account_id: v.account_id,
                notes: v.notes,
                created_at: v.created_at
            })),
            messages: (pendingMessages || []).map(m => ({
                id: m.id,
                content: m.content,
                recipient_name: m.recipient_name
            })),
            messagesReleased,
        });

    } catch (error) {
        console.error("[Find By Key Error]", error);
        return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }
}
