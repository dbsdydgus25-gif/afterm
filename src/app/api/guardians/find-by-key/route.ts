import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 고인 디지털 유산 열람 API (UID 없이 API 키로 직접 접근)
 * 인증: 가디언즈 이름 + 고인 이름 + 고인 전화번호 + API 키
 * 성공 시: 디지털 유산 반환 + 잠긴 메시지를 수신인에게 SMS 발송
 */

// 서비스 역할 클라이언트 (RLS 우회 - 서버 전용)
const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** 텍스트 정규화: 공백 제거, 소문자화 */
function normName(s: string | null | undefined): string {
    return (s || "").trim().replace(/\s+/g, "").toLowerCase();
}

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
        // profiles.full_name 이 없으면 auth.users 메타데이터에서도 확인
        let resolvedName = profile.full_name || "";

        if (!resolvedName) {
            // auth admin API로 실제 이름 조회
            const { data: authUser } = await serviceSupabase.auth.admin.getUserById(profile.id);
            resolvedName =
                authUser?.user?.user_metadata?.full_name ||
                authUser?.user?.user_metadata?.name ||
                "";
            console.log("[find-by-key] full_name 없음 → auth 메타데이터 폴백:", resolvedName);
        }

        // 이름 정규화 비교
        const profileNameNorm = normName(resolvedName);
        const inputNameNorm = normName(deceasedName);

        if (!profileNameNorm) {
            // 이름 자체가 아예 없는 경우 → 열람 불가
            return NextResponse.json(
                { error: "고인 계정에 이름 정보가 없습니다. 고인의 에프텀 계정 설정에서 이름을 등록해야 합니다." },
                { status: 403 }
            );
        }
        if (profileNameNorm !== inputNameNorm) {
            console.log("[find-by-key] 이름 불일치 - DB:", profileNameNorm, "입력:", inputNameNorm);
            return NextResponse.json(
                { error: "고인 이름이 일치하지 않습니다. 정확한 이름을 입력해주세요." },
                { status: 403 }
            );
        }

        // ─── Step 3: 고인 전화번호 대조 ─────────────────────────
        let resolvedPhone = (profile.phone || "").replace(/[^0-9]/g, "");

        if (!resolvedPhone) {
            // profiles.phone 없으면 auth 메타데이터에서 확인
            const { data: authUser } = await serviceSupabase.auth.admin.getUserById(profile.id);
            resolvedPhone = (
                authUser?.user?.user_metadata?.phone ||
                authUser?.user?.phone ||
                ""
            ).replace(/[^0-9]/g, "");
            console.log("[find-by-key] phone 없음 → auth 메타데이터 폴백:", resolvedPhone);
        }

        if (!resolvedPhone) {
            return NextResponse.json(
                { error: "고인 계정에 전화번호 정보가 없습니다. 설정에서 전화번호를 먼저 등록해주세요." },
                { status: 403 }
            );
        }
        if (resolvedPhone !== cleanInputPhone) {
            console.log("[find-by-key] 전화번호 불일치 - DB:", resolvedPhone, "입력:", cleanInputPhone);
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
            const inputGuardianNorm = normName(guardianName);
            const isRegistered = guardiansList.some(g => {
                return (
                    normName(g.guardian_name) === inputGuardianNorm ||
                    normName(g.name) === inputGuardianNorm
                );
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
                        const smsText = `[에프텀] ${resolvedName || "고인"}님이 남긴 소중한 메시지가 있습니다.\n아래 링크에서 확인해주세요.\n${siteUrl}/view/${msg.id}`;
                        await fetch(`${siteUrl}/api/sms/send`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone: msg.recipient_phone, message: smsText })
                        }).catch(e => console.warn("[find-by-key] SMS 발송 실패:", e));
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
            deceasedName: resolvedName,
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
