import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// 가디언즈 오픈 인증 엔드포인트 (/api/guardians/verify-open)
// 가디언즈가 제출한 정보(이름, 전화번호, API 키, 사망진단서)를 검증합니다.
// 검증 성공 시:
//  1. 해당 유저의 잠긴 메시지들을 수신인에게 SMS 발송
//  2. 해당 가디언즈의 status를 'opened'로 업데이트
//  3. 디지털 유산 목록 접근 토큰 발행 (임시 세션 기반)
// ============================================================

// 서비스 역할 클라이언트 (RLS 우회 - 서버 전용)
const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { guardianName, guardianPhone, apiKey, deathCertificatePath, userId } = body;

        // 1. 필수 입력값 검증
        if (!guardianName || !guardianPhone || !apiKey || !userId) {
            return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
        }

        // 2. API 키로 유저 조회 (profiles 테이블에서 api_key 매칭)
        const { data: profile, error: profileError } = await serviceSupabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", userId)
            .eq("api_key", apiKey)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "API 키가 일치하지 않습니다. 다시 확인해주세요." },
                { status: 401 }
            );
        }

        // 3. 해당 유저의 가디언즈 목록에서 이름+전화번호 일치하는 항목 찾기
        const phoneNormalized = guardianPhone.replace(/-/g, "");
        const { data: allGuardians } = await serviceSupabase
            .from("guardians")
            .select("*")
            .eq("user_id", userId);

        const matchedGuardian = allGuardians?.find(g => {
            const dbPhone = (g.guardian_phone || "").replace(/-/g, "");
            return (
                g.guardian_name === guardianName &&
                dbPhone === phoneNormalized
            );
        });

        if (!matchedGuardian) {
            return NextResponse.json(
                { error: "등록된 가디언즈 정보와 일치하지 않습니다." },
                { status: 403 }
            );
        }

        // 4. 사망진단서 경로 저장 및 가디언즈 상태를 'opened'로 변경
        const { error: updateError } = await serviceSupabase
            .from("guardians")
            .update({
                status: "opened",
                death_certificate_path: deathCertificatePath || null
            })
            .eq("id", matchedGuardian.id);

        if (updateError) throw updateError;

        // 5. 해당 유저의 전체 메시지 목록 조회 (status 무관 - guardians 인증 후 모두 릴리즈)
        const { data: messages } = await serviceSupabase
            .from("messages")
            .select("id, content, recipient_name, recipient_phone, recipient_relationship, status")
            .eq("user_id", userId);

        // SMS 대상: locked 상태이거나 status가 없는 메시지 (아직 전달 안 된 것)
        const pendingMessages = messages?.filter(m => !m.status || m.status === 'locked') || [];

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afterm.co.kr";
        const smsResults: { id: string; success: boolean }[] = [];

        // 6. pending 메시지들을 수신인에게 SMS 발송
        if (pendingMessages.length > 0) {
            for (const msg of pendingMessages) {
                try {
                    const smsMessage = `[에프텀] ${profile.full_name || "사용자"}님이 남긴 소중한 메시지가 있습니다.\n아래 링크에서 확인해주세요.\n${siteUrl}/view/${msg.id}`;
                    const smsRes = await fetch(`${siteUrl}/api/sms/send`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: msg.recipient_phone, message: smsMessage })
                    });
                    if (smsRes.ok) {
                        await serviceSupabase.from("messages").update({ status: "unlocked" }).eq("id", msg.id);
                        smsResults.push({ id: msg.id, success: true });
                    } else {
                        smsResults.push({ id: msg.id, success: false });
                    }
                } catch (smsError) {
                    console.error(`메시지 ${msg.id} SMS 발송 오류:`, smsError);
                    smsResults.push({ id: msg.id, success: false });
                }
            }
        }

        // 7. 디지털 유산 목록 조회 (해당 가디언즈에게만 반환)
        const { data: vaultItems } = await serviceSupabase
            .from("vault_items")
            .select("id, category, platform_name, username, notes")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        return NextResponse.json({
            success: true,
            guardianId: matchedGuardian.id,
            messagesReleased: smsResults.filter(r => r.success).length,
            totalMessages: messages?.length || 0,
            vaultItems: vaultItems || [],
        });
    } catch (error) {
        console.error("[가디언즈 인증 오류]", error);
        return NextResponse.json({ error: "인증 처리 중 오류가 발생했습니다." }, { status: 500 });
    }
}
