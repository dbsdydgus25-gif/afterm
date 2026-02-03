import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, pin } = body;

        if (!id || !pin) {
            return NextResponse.json({ error: "ID and PIN are required" }, { status: 400 });
        }

        // Use SERVICE_ROLE key to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch vault item including sensitive data
        const { data, error } = await supabase
            .from('vault_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Vault not found" }, { status: 404 });
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin, data.pin_hash);

        if (!isValid) {
            return NextResponse.json({ error: "PIN mismatch" }, { status: 401 });
        }

        // Return data for client-side decryption
        // Note: We return password_encrypted. Client will decrypt it using the PIN.
        return NextResponse.json({
            success: true,
            vault: {
                id: data.id,
                platform_name: data.platform_name,
                custom_platform: data.custom_platform,
                account_id: data.account_id,
                password_encrypted: data.password_encrypted,
                request_type: data.request_type,
                notes: data.notes,
                recipient_name: data.recipient_name,
                pin_hint: data.pin_hint
            }
        });

    } catch (error: any) {
        console.error("Vault verify error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
