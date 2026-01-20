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

        // 2. Admin Client Setup
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: "Server Configuration Error" },
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

        // 3. Remove 'deleted_at' from user_metadata to restore account
        const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    deleted_at: null
                }
            }
        );

        if (updateError) {
            return NextResponse.json(
                { error: "계정 복구 실패" },
                { status: 500 }
            );
        }

        // 4. Ideally, we should also remove the entry from 'deleted_users' table if we want to keep it clean,
        // or update a 'restored_at' column. For now, let's delete the archive row to signify full restoration.
        await adminAuthClient.from("deleted_users").delete().eq("id", user.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Restore Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
