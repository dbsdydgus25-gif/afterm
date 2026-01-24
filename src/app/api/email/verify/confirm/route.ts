import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const identifier = `email:${email}`;
        const supabase = await createClient();

        // Check matching code that hasn't expired
        const { data, error } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('phone', identifier)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 400 });
        }

        // Delete used code
        await supabase.from('verification_codes').delete().eq('id', data.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
