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
                service: string; cost: string; date: string; category: string;
            }) => ({
                user_id: user.id,
                platform_name: item.service,
                notes: `${item.category} | ${item.cost} | 결제일: ${item.date}`,
            }));

            const { error } = await supabase.from("vault_items").insert(vaultItems);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Legacy Save Error]", error);
        return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
    }
}
