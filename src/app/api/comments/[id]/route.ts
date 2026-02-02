import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.id;

    // Get my space
    const { data: mySpace } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', user.id)
        .eq('space_type', 'personal')
        .single();

    if (!mySpace) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    // Delete comment (only if it's mine)
    const { error } = await supabase
        .from('memory_comments')
        .delete()
        .eq('id', commentId)
        .eq('space_id', mySpace.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
