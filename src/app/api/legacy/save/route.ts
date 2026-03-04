import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { result } = await req.json();

        if (!result) {
            return NextResponse.json({ error: "No result to save" }, { status: 400 });
        }

        // 편지 저장
        if (result.type === "letter") {
            const { error } = await supabase.from("messages").insert({
                user_id: user.id,
                recipient_name: result.recipient,
                content: result.editedContent ?? result.content,
                status: "locked",
                type: "text",
            });
            if (error) throw error;
        }

        // 디지털 유산 리스트 저장
        if (result.type === "legacyList" && Array.isArray(result.items)) {
            const vaultItems = result.items.map((item: {
                service: string;
                cost: string;
                date: string;
                category: string;
                username?: string;
                password?: string;
                memo?: string;
            }) => ({
                user_id: user.id,
                platform_name: item.service,
                account_id: item.username || "",
                // PIN이 없으므로 암호화 없이 일시적으로 notes나 별도 처리가 필요할 수 있음
                // 여기서는 일단 notes에 합쳐서 저장하도록 대응 (기본 vault UI와 호환)
                notes: `[AI 스캔] ${item.category} | ${item.cost} | 결제일: ${item.date}${item.password ? ` | 패스워드: ${item.password}` : ""}${item.memo ? ` | 메모: ${item.memo}` : ""}`,
                category: "subscription" // 기본값
            }));

            // upsert: user_id + platform_name 기준 중복이면 최신버전으로 업데이트
            const { error } = await supabase.from("vault_items").upsert(vaultItems, {
                onConflict: "user_id,platform_name",
                ignoreDuplicates: false
            });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Legacy Save Error]", error);
        return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
    }
}
