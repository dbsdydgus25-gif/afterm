import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from "@/lib/error";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Use SERVICE_ROLE key to bypass RLS for checking existence
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch only safe metadata
        const { data, error } = await supabase
            .from('vault_items')
            .select('id, recipient_name, pin_hint')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ exists: false }, { status: 404 });
        }

        return NextResponse.json({
            exists: true,
            hint: data.pin_hint,
            recipientName: data.recipient_name
        });

    } catch (error: unknown) {
        console.error("Vault check error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
