import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from "@/lib/error";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Try to find invitation by token OR code
        // We use .or() syntax properly: "token.eq.VALUE,code.eq.VALUE"
        const { data: invite, error: _inviteError } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .or(`token.eq.${token},code.eq.${token}`)
            .maybeSingle();

        if (invite) {
            // Found specific invitation

            // Fetch Space Title
            const { data: space } = await supabaseAdmin
                .from('memorial_spaces')
                .select('title')
                .eq('id', invite.space_id)
                .single();

            // Fetch Inviter Email
            let inviterEmail = "";
            if (invite.inviter_id) {
                const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(invite.inviter_id);
                inviterEmail = user?.email || "";
            }

            return NextResponse.json({
                success: true,
                data: {
                    ...invite,
                    space_title: space?.title || "추모 공간",
                    inviter_email: inviterEmail,
                    type: 'invitation'
                }
            });
        }

        // 2. If not found as invitation, try as generic Space ID Link
        // Check if token is a valid UUID to prevent query error
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

        if (isUUID) {
            const { data: space } = await supabaseAdmin
                .from('memorial_spaces')
                .select('id, title, theme')
                .eq('id', token)
                .maybeSingle();

            if (space) {
                return NextResponse.json({
                    success: true,
                    data: {
                        space_id: space.id,
                        space_title: space.title,
                        status: 'active',
                        role: 'viewer',
                        inviter_email: null,
                        type: 'generic'
                    }
                });
            }
        }

        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    } catch (error: unknown) {
        console.error("Invite verification error:", error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
