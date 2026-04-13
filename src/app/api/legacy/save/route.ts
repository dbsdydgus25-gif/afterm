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
                account_id?: string;
                username?: string;
                password?: string;
                memo?: string;
            }) => ({
                user_id: user.id,
                platform_name: item.service,
                // AI 스캔 결과의 account_id 또는 username 을 계정 ID로 저장
                account_id: item.account_id || item.username || "",
                // Gemini가 분류한 카테고리를 그대로 저장 (이전: 무조건 "subscription" 하드코딩)
                // 매핑: 통신->communication, 유료구독->subscription, 클라우드->cloud, SNS->social
                category: (() => {
                    const cat = item.category || "";
                    if (cat === "통신") return "communication";
                    if (cat === "유료구독") return "subscription";
                    if (cat === "클라우드") return "cloud";
                    if (cat === "SNS") return "social";
                    return "subscription"; // 미매핑 폴백
                })(),
                notes: `[AI 스캔] ${item.category} | ${item.cost} | 결제일: ${item.date}${item.password ? ` | 패스워드: ${item.password}` : ""}${item.memo ? ` | 메모: ${item.memo}` : ""}`,
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
