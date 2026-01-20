import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // 1. Verify User Session
        const supabase = await createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reason, confirmEmail } = await request.json();

        // 2. Validate Email Confirmation
        // (Ensure the user typed their email correctly to confirm intent)
        if (confirmEmail !== user.email) {
            return NextResponse.json(
                { error: "이메일이 일치하지 않습니다." },
                { status: 400 }
            );
        }

        // 3. Admin Client Setup (Service Role Key Required)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!supabaseUrl) {
            console.error("Error: NEXT_PUBLIC_SUPABASE_URL is missing");
            return NextResponse.json(
                { error: "서버 설정 오류: Supabase URL이 없습니다." },
                { status: 500 }
            );
        }

        if (!serviceRoleKey) {
            console.error("Error: SUPABASE_SERVICE_ROLE_KEY is missing");
            // Check if it's empty string
            return NextResponse.json(
                { error: "서버 설정 오류: Service Role Key가 없습니다. (환경변수 확인 필요)" },
                { status: 500 }
            );
        }

        const adminAuthClient = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );
        // 4. Archive User Data to 'deleted_users'
        const { error: archiveError } = await adminAuthClient
            .from("deleted_users")
            .insert({
                id: user.id,
                email: user.email,
                reason: reason,
            });

        if (archiveError) {
            console.error("Archive Error:", archiveError);
            // Continue even if archive fails? Or stop? 
            // Generally better to stop or log heavily. Let's stop to be safe.
            return NextResponse.json(
                { error: "회원 탈퇴 처리 중 오류가 발생했습니다. (Archive Failed)" },
                { status: 500 }
            );
        }

        // 5. Delete User from Supabase Auth (This cascades to public tables if foreign keys are set up with cascading delete)
        // NOTE: In our schema, we should ensure 'on delete cascade' is set for user_id fields in posts/memorials.
        // However, if we want to keep the content anonymized (as requested "delete from existing members"), 
        // usually cascade delete removes it.
        // If the user wants to keep content but anonymize, that's different.
        // The request said "기존 회원에선 삭제되고" which implies full removal or at least removal from auth system.

        const { error: deleteError } = await adminAuthClient.auth.admin.deleteUser(
            user.id
        );

        if (deleteError) {
            console.error("Delete Error:", deleteError);
            return NextResponse.json(
                { error: "회원 삭제 실패" },
                { status: 500 }
            );
        }

        // 6. Sign Out from Session
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Withdraw Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
