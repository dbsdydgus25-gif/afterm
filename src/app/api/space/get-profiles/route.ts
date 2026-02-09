
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { userIds } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, nickname, avatar_url')
            .in('id', userIds);

        if (error) {
            console.error("Admin Profile Fetch Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
