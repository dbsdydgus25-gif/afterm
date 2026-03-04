import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 가디언즈 본인 이름 + 고인 이름 + 고인 핸드폰 + API 키로 고인 디지털 유산을 찾는 API
export async function POST(req: NextRequest) {
    try {
        const { guardianName, deceasedName, deceasedPhone, apiKey } = await req.json();

        if (!guardianName || !deceasedName || !deceasedPhone || !apiKey) {
            return NextResponse.json({ error: "가디언즈 이름, 고인 이름, 고인 핸드폰 번호, API 키를 모두 입력해주세요." }, { status: 400 });
        }

        const supabase = await createClient();

        // 1) API 키로 고인 계정 찾기
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("id, name, phone, api_key")
            .eq("api_key", apiKey)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "유효하지 않은 API 키입니다. 고인이 공유한 API 키를 다시 확인해주세요." }, { status: 404 });
        }

        // 2) 고인 이름 대조
        const profileName = (profile.name || "").trim().replace(/\s/g, "");
        const inputName = deceasedName.trim().replace(/\s/g, "");
        if (profileName && profileName !== inputName) {
            return NextResponse.json({ error: "고인 이름이 등록된 정보와 일치하지 않습니다." }, { status: 403 });
        }

        // 3) 고인 핸드폰 번호 대조
        const profilePhone = (profile.phone || "").replace(/[^0-9]/g, "");
        const inputPhone = deceasedPhone.replace(/[^0-9]/g, "");
        if (profilePhone && profilePhone !== inputPhone) {
            return NextResponse.json({ error: "고인 핸드폰 번호가 등록된 정보와 일치하지 않습니다." }, { status: 403 });
        }

        // 4) 디지털 유산(vault_items) 조회
        const { data: vaultItems, error: vaultErr } = await supabase
            .from("vault_items")
            .select("id, category, platform_name, account_id, notes, created_at")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false });

        if (vaultErr) throw vaultErr;

        // 5) 잠긴 메시지 공개 처리
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

        // 6) 접근 로그 기록
        try {
            await supabase.from("guardian_access_logs").insert({
                target_user_id: profile.id,
                access_type: "api_key_open",
                guardian_name: guardianName,
                accessed_at: new Date().toISOString()
            });
        } catch { /* 로그 실패 무시 */ }

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
