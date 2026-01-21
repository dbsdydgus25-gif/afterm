import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');
        const supabase = createClient();

        // Check matching code that hasn't expired
        const { data, error } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('phone', cleanPhone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 400 });
        }

        // Delete used code (optional, but good for security to prevent replay)
        await supabase.from('verification_codes').delete().eq('id', data.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
