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
                { error: `회원 탈퇴 처리 중 오류가 발생했습니다. (Archive Failed: ${archiveError.message})` },
                { status: 500 }
            );
        }

        // 5. Soft Delete: Mark as deleted in user_metadata
        // We do NOT ban the user, so they can login to restore the account.
        // The frontend (AuthProvider) will check this metadata and block access/show restore modal.

        const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    deleted_at: new Date().toISOString()
                }
            }
        );

        if (updateError) {
            console.error("Soft Delete Error:", updateError);
            return NextResponse.json(
                { error: "회원 탈퇴 처리 실패 (Metadata Update Error)" },
                { status: 500 }
            );
        }

        // 6. Sign Out from Session is handled by the client usually, but we can do it here too just in case?
        // Actually, for the API flow, we don't need to sign out on server side if client handles it.
        // But let's proceed to success.

        // Note: We don't sign out server-side using 'supabase.auth.signOut()' because we are in an API route context
        // and it might not clear the client cookie fully without response headers.
        // The client-side 'WithdrawModal' handles the router.push and state clear.

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Withdraw Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
