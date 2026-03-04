import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// 가디언즈 추가 엔드포인트 (/api/guardians/add)
// 새 가디언즈를 등록하고 SMS를 통해 안내 메시지를 발송합니다.
// ============================================================

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. 로그인 유저 검증
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const body = await req.json();
        const { guardianName, guardianPhone } = body;

        // 2. 필수값 검증
        if (!guardianName || !guardianPhone) {
            return NextResponse.json({ error: "이름과 전화번호는 필수입니다." }, { status: 400 });
        }

        // 3. 유저의 API 키 조회 (SMS 발송 및 오픈 페이지 링크 생성에 사용)
        const { data: profile } = await supabase
            .from("profiles")
            .select("api_key, full_name")
            .eq("id", user.id)
            .single();

        // API 키가 없으면 먼저 발급 필요
        if (!profile?.api_key) {
            return NextResponse.json(
                { error: "API 키를 먼저 발급해주세요." },
                { status: 400 }
            );
        }

        // 4. guardians 테이블에 새 가디언즈 추가
        const { data: guardian, error: insertError } = await supabase
            .from("guardians")
            .insert({
                user_id: user.id,
                guardian_name: guardianName,
                guardian_phone: guardianPhone,
                status: "pending",
                sms_sent: false
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 5. SMS 발송: 가디언즈에게 안내 문자 전송
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afterm.co.kr";
        // 가디언즈 전용 오픈 페이지 링크 (유저 ID 포함)
        const openUrl = `${siteUrl}/guardians/open?uid=${user.id}`;
        const senderName = profile.full_name || user.email?.split("@")[0] || "사용자";
        const smsMessage = `[에프텀] ${senderName}님이 귀하를 데이터 유산 관리자(가디언즈)로 설정했습니다.\n필요 시 아래 링크를 통해 인증해주세요.\n${openUrl}`;

        try {
            const smsResponse = await fetch(`${siteUrl}/api/sms/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: guardianPhone,
                    message: smsMessage
                })
            });

            if (smsResponse.ok) {
                // SMS 발송 성공 시 sms_sent 플래그 업데이트
                await supabase
                    .from("guardians")
                    .update({ sms_sent: true })
                    .eq("id", guardian.id);
            }
        } catch (smsError) {
            // SMS 오류는 가디언즈 등록에 영향을 주지 않습니다
            console.error("[가디언즈 SMS 발송 오류]", smsError);
        }

        return NextResponse.json({ success: true, guardian });
    } catch (error) {
        console.error("[가디언즈 추가 오류]", error);
        return NextResponse.json({ error: "가디언즈 추가 중 오류가 발생했습니다." }, { status: 500 });
    }
}

// 현재 유저의 가디언즈 목록 조회 (GET)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { data: guardians, error } = await supabase
            .from("guardians")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ guardians: guardians || [] });
    } catch (error) {
        console.error("[가디언즈 조회 오류]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
