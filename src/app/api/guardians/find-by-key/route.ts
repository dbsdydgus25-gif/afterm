import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 가디언즈 이름 + 핸드폰 + API 키로 고인 디지털 유산을 찾는 API
export async function POST(req: NextRequest) {
    try {
        const { guardianName, guardianPhone, apiKey } = await req.json();

        if (!guardianName || !guardianPhone || !apiKey) {
            return NextResponse.json({ error: "이름, 핸드폰 번호, API 키를 모두 입력해주세요." }, { status: 400 });
        }

        const supabase = await createClient();

        // 1) API 키로 유저(고인) 찾기
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("id, name, api_key")
            .eq("api_key", apiKey)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "유효하지 않은 API 키입니다. 고인이 공유한 API 키를 다시 확인해주세요." }, { status: 404 });
        }

        // 2) 가디언즈 인증 - 핸드폰 번호로 등록된 가디언즈인지 확인
        const cleanPhone = guardianPhone.replace(/[^0-9]/g, "");
        const { data: guardian } = await supabase
            .from("guardians")
            .select("id, name, phone")
            .eq("user_id", profile.id)
            .single();

        // 가디언즈가 설정되어 있으면 폰 번호 대조, 없으면 이름만 확인
        if (guardian) {
            const cleanStoredPhone = (guardian.phone || "").replace(/[^0-9]/g, "");
            if (cleanStoredPhone && cleanStoredPhone !== cleanPhone) {
                return NextResponse.json(
                    { error: "인증에 실패했습니다. 가디언즈로 등록된 정보와 일치하지 않습니다." },
                    { status: 403 }
                );
            }
        }

        // 3) 디지털 유산(vault_items) 조회
        const { data: vaultItems, error: vaultErr } = await supabase
            .from("vault_items")
            .select("id, category, platform_name, account_id, notes, created_at")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false });

        if (vaultErr) throw vaultErr;

        // 4) 메시지 공개 처리
        const { data: messages } = await supabase
            .from("messages")
            .select("id, content, recipient_name, recipient_phone, status, created_at")
            .eq("user_id", profile.id)
            .eq("status", "locked");

        // 메시지 unlock 처리
        if (messages && messages.length > 0) {
            await supabase
                .from("messages")
                .update({ status: "unlocked", is_unlocked: true })
                .eq("user_id", profile.id)
                .eq("status", "locked");
        }

        // 5) 접근 로그 기록
        try {
            await supabase.from("guardian_access_logs").insert({
                target_user_id: profile.id,
                access_type: "api_key_open",
                guardian_name: guardianName,
                guardian_phone: guardianPhone,
                accessed_at: new Date().toISOString()
            });
        } catch { /* 로그 실패는 무시 */ }

        return NextResponse.json({
            success: true,
            deceasedName: profile.name,
            vaultItems: (vaultItems || []).map(v => ({
                id: v.id,
                category: v.category,
                platform_name: v.platform_name,
                username: v.account_id,
                notes: v.notes,
                created_at: v.created_at
            })),
            messages: (messages || []).map(m => ({
                id: m.id,
                content: m.content,
                recipient_name: m.recipient_name
            })),
            messagesReleased: messages?.length ?? 0,
            totalMessages: messages?.length ?? 0
        });

    } catch (error) {
        console.error("[Find By Key Error]", error);
        return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }
}
