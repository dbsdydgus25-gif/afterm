import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const personaId = searchParams.get('id');

        if (!personaId) {
            return NextResponse.json({ error: 'Persona ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. 권한 확인 (본인이 만든 페르소나인지)
        const { data: persona, error: fetchError } = await supabase
            .from('ai_personas')
            .select('id, user_id')
            .eq('id', personaId)
            .single();

        if (fetchError || !persona) {
            return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
        }

        if (persona.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. 삭제 (Cascade 설정되어 있으면 메시지도 함께 삭제됨)
        // 만약 Cascade가 안 되어 있다면 수동으로 삭제해야 함.
        // 안전을 위해 chat_messages 먼저 삭제 시도
        await supabase.from('chat_messages').delete().eq('persona_id', personaId);

        const { error: deleteError } = await supabase
            .from('ai_personas')
            .delete()
            .eq('id', personaId);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting persona:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
