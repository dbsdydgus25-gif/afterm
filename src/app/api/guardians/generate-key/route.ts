import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// ============================================================
// API 키 생성 엔드포인트 (/api/guardians/generate-key)
// 로그인된 유저의 고유 API 키를 생성하고 profiles 테이블에 저장합니다.
// 이미 API 키가 있는 경우 기존 키를 반환합니다.
// ============================================================

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. 로그인 유저 검증
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        // 2. 기존 API 키가 있는지 확인
        const { data: profile } = await supabase
            .from("profiles")
            .select("api_key")
            .eq("id", user.id)
            .single();

        // 이미 API 키가 있으면 기존 키 반환
        if (profile?.api_key) {
            return NextResponse.json({
                success: true,
                apiKey: profile.api_key,
                isNew: false
            });
        }

        // 3. 새 API 키 생성 (형식: afterm-xxxxxxxxxxxxxxxx)
        const rawKey = crypto.randomBytes(16).toString("hex");
        const apiKey = `afterm-${rawKey}`;

        // 4. profiles 테이블에 API 키 저장
        const { error } = await supabase
            .from("profiles")
            .update({ api_key: apiKey })
            .eq("id", user.id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            apiKey,
            isNew: true
        });
    } catch (error) {
        console.error("[API Key 생성 오류]", error);
        return NextResponse.json({ error: "API 키 생성 중 오류가 발생했습니다." }, { status: 500 });
    }
}

// API 키 조회 (GET)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("api_key")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            apiKey: profile?.api_key || null
        });
    } catch (error) {
        console.error("[API Key 조회 오류]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
