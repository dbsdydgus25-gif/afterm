import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 고인 디지털 유산 열람 통합 API (/api/guardians/verify-open)
 * UID 유무와 상관없이 가장 엄격하게 4가지(가디언즈 이름, 고인 이름, 고인 전화번호, API 키)를 모두 검증합니다.
 */

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function norm(s: string | null | undefined): string {
    return (s || "").trim().replace(/\s+/g, "").toLowerCase();
}

export async function POST(req: NextRequest) {
    try {
        const { guardianName, deceasedName, deceasedPhone, apiKey, userId } = await req.json();

        // ─── 1. 기본 입력값 검증 ─────────────────────────────────────
        if (!guardianName || !deceasedName || !deceasedPhone || !apiKey) {
            return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
        }

        const inputDeceasedPhone = deceasedPhone.replace(/[^0-9]/g, "");

        // ─── 2. API 키 (또는 userId)로 고인 프로필 조회 ───────────────
        let query = serviceSupabase.from("profiles").select("id, full_name, phone, api_key").eq("api_key", apiKey.trim());
        if (userId) {
            query = query.eq("id", userId);
        }

        const { data: profile, error: profileErr } = await query.maybeSingle();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "API 키가 유효하지 않거나 고인 정보와 일치하지 않습니다." }, { status: 403 });
        }

        // ─── 3. 고인 이름 및 전화번호 대조 (auth metadata 폴백 포함) ──
        let resolvedName = profile.full_name || "";
        let resolvedPhone = (profile.phone || "").replace(/[^0-9]/g, "");

        if (!resolvedName || !resolvedPhone) {
            const { data: authUser } = await serviceSupabase.auth.admin.getUserById(profile.id);
            if (!resolvedName) {
                resolvedName = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || "";
            }
            if (!resolvedPhone) {
                resolvedPhone = (authUser?.user?.user_metadata?.phone || authUser?.user?.phone || "").replace(/[^0-9]/g, "");
            }
        }

        if (norm(resolvedName) !== norm(deceasedName)) {
            return NextResponse.json({ error: "고인 이름이 일치하지 않습니다. 정확한 이름을 입력해주세요." }, { status: 403 });
        }
        if (resolvedPhone !== inputDeceasedPhone) {
            return NextResponse.json({ error: "고인 전화번호가 일치하지 않습니다." }, { status: 403 });
        }

        // ─── 4. 가디언즈 명단 대조 ─────────────────────────────────
        // 등록된 가디언즈 목록을 가져옴
        const { data: guardiansList } = await serviceSupabase
            .from("guardians")
            .select("id, guardian_name, name")
            .eq("user_id", profile.id);

        if (!guardiansList || guardiansList.length === 0) {
            return NextResponse.json({ error: "해당 고인의 계정에 등록된 가디언즈가 없습니다." }, { status: 403 });
        }

        const inputGuardianNorm = norm(guardianName);
        const matchedGuardian = guardiansList.find(g =>
            norm(g.guardian_name) === inputGuardianNorm || norm(g.name) === inputGuardianNorm
        );

        if (!matchedGuardian) {
            return NextResponse.json({ error: "등록된 가디언즈 이름과 일치하지 않습니다." }, { status: 403 });
        }

        // 인증 성공! 상태 업데이트
        await serviceSupabase.from("guardians").update({ status: "opened" }).eq("id", matchedGuardian.id);

        // ─── 5. 디지털 유산 및 잠긴 메시지 처리 ───────────────────────
        const [vaultRes, msgRes] = await Promise.all([
            serviceSupabase.from("vault_items").select("id, category, platform_name, account_id, notes, created_at").eq("user_id", profile.id).order("created_at", { ascending: true }),
            serviceSupabase.from("messages").select("id, content, recipient_name, recipient_phone, status").eq("user_id", profile.id).in("status", ["locked", "pending"])
        ]);

        const vaultItems = vaultRes.data || [];
        const pendingMessages = msgRes.data || [];

        let messagesReleased = 0;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afterm.co.kr";

        if (pendingMessages.length > 0) {
            for (const msg of pendingMessages) {
                try {
                    await serviceSupabase.from("messages").update({ status: "unlocked", is_unlocked: true }).eq("id", msg.id);
                    if (msg.recipient_phone) {
                        const smsText = `[에프텀] ${resolvedName}님이 남긴 소중한 메시지가 있습니다.\n아래 링크에서 확인해주세요.\n${siteUrl}/view/${msg.id}`;
                        await fetch(`${siteUrl}/api/sms/send`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone: msg.recipient_phone, message: smsText })
                        }).catch(() => { });
                    }
                    messagesReleased++;
                } catch (e) {
                    console.error("Message release error:", e);
                }
            }
        }

        // 접근 로그 기록
        try {
            await serviceSupabase.from("guardian_access_logs").insert({
                target_user_id: profile.id, access_type: "verify_open", guardian_name: guardianName, accessed_at: new Date().toISOString()
            });
        } catch (e) {
            // ignore
        }

        return NextResponse.json({
            success: true,
            deceasedName: resolvedName,
            vaultItems: vaultItems.map(v => ({
                id: v.id, category: v.category, platform_name: v.platform_name, account_id: v.account_id, notes: v.notes, created_at: v.created_at
            })),
            messagesReleased
        });

    } catch (error) {
        console.error("[Verify Open API Error]", error);
        return NextResponse.json({ error: "인증 처리 중 서버 오류가 발생했습니다." }, { status: 500 });
    }
}
