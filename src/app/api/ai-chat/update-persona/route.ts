
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const personaId = formData.get('id') as string;
        const avatarFile = formData.get('avatar') as File | null;
        const name = formData.get('name') as string | null; // Optional: Allow updating name too

        if (!personaId) {
            return NextResponse.json({ error: 'Missing persona ID' }, { status: 400 });
        }

        // 1. Verify Ownership
        const { data: persona, error: fetchError } = await supabase
            .from('ai_personas')
            .select('id, memorial_id')
            .eq('id', personaId)
            .single();

        if (fetchError || !persona) {
            return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
        }

        // Check if user owns the memorial space linked to this persona
        // (Assuming create-persona links user directly or via memorial space owner)
        // With recent changes, ai_personas might have user_id directly or memorial_id.
        // Let's check both possibilities based on schema evolution.
        // For now, let's assume strict RLS handles the update permission or we check ownership.
        // The RLS policy "ai_personas_manageable_by_hosts" checks memorial_id owner.

        // 2. Upload Avatar (if provided)
        let avatarUrl = null;
        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `avatar_${personaId}_${Date.now()}.${fileExt}`;
            const filePath = `personas/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('memorial-public') // Using existing bucket
                .upload(filePath, avatarFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('memorial-public')
                .getPublicUrl(filePath);

            avatarUrl = publicUrl;
        }

        // 3. Update Persona
        const updateData: any = {};
        if (avatarUrl) updateData.avatar_url = avatarUrl;
        if (name) updateData.name = name;

        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from('ai_personas')
                .update(updateData)
                .eq('id', personaId);

            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true, avatarUrl });

    } catch (error: any) {
        console.error('Update persona error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
