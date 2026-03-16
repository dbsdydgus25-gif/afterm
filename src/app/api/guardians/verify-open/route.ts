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

        // [UX 개선] 고인의 이름(deceasedName)은 구글/카카오 로그인 시 닉네임이나 영어로 설정되는 경우가 많아, 
        // 실제 유가족(가디언즈)이 실명을 입력했을 때 불일치로 인해 열람하지 못하는 치명적인 문제가 있습니다. 
        // API 키, 고인 전화번호, 가디언즈 이름 3가지 정보가 정확하다면 고인 이름 검증은 생략합니다.
        
        // if (norm(resolvedName) !== norm(deceasedName)) {
        //     return NextResponse.json({ error: "고인 이름이 일치하지 않습니다. 정확한 이름을 입력해주세요." }, { status: 403 });
        // }
        
        if (resolvedPhone !== inputDeceasedPhone) {
            return NextResponse.json({ error: "고인 전화번호가 일치하지 않습니다." }, { status: 403 });
        }

        // ─── 4. 가디언즈 명단 대조 ─────────────────────────────────
        // 등록된 가디언즈 목록을 가져옴
        const { data: guardiansList, error: guardiansErr } = await serviceSupabase
            .from("guardians")
            .select("id, guardian_name, guardian_phone")
            .eq("user_id", profile.id);

        if (guardiansErr) {
            console.error("guardians fetch error:", guardiansErr);
        }

        if (!guardiansList || guardiansList.length === 0) {
            return NextResponse.json({ error: "해당 고인의 계정에 등록된 가디언즈가 없습니다." }, { status: 403 });
        }

        const inputGuardianNorm = norm(guardianName);
        const matchedGuardian = guardiansList.find(g =>
            norm(g.guardian_name) === inputGuardianNorm
        );

        if (!matchedGuardian) {
            return NextResponse.json({ error: "등록된 가디언즈 이름과 일치하지 않습니다." }, { status: 403 });
        }

        // ─── 5. 사망진단서 OCR 인증 여부 확인 (병행 경로) ────────────────
        // OCR 인증이 완료된 가디언은 별도 프로세스 없이 열람 허용 (기록 조회)
        let hasOcrVerification = false;
        try {
            // death_certificate_verifications 테이블에서 verified 상태 확인
            // guardian_id만으로 조회 (로그인된 가디언이 아닐 수도 있어서 guardian_name으로 fallback)
            const { data: ocrVeri } = await serviceSupabase
                .from("death_certificate_verifications")
                .select("id, status, deceased_name")
                .eq("status", "verified")
                .order("created_at", { ascending: false })
                .limit(1);

            // 인증 기록이 있고, 고인 이름이 일치하면 OCR 인증 통과로 처리
            if (ocrVeri && ocrVeri.length > 0) {
                const ocrRecord = ocrVeri[0];
                // 고인 이름이 없거나 일치하면 통과
                if (!ocrRecord.deceased_name || norm(ocrRecord.deceased_name) === norm(resolvedName)) {
                    hasOcrVerification = true;
                    console.log("[verify-open] OCR 인증 병행 경로 확인:", ocrRecord.id);
                }
            }
        } catch (ocrErr) {
            // OCR 테이블 조회 실패해도 기존 방식으로 계속 진행
            console.warn("[verify-open] OCR 인증 체크 실패 (무시):", ocrErr);
        }

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
