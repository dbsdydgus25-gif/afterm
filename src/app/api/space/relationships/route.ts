import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetSpaceId } = await req.json();

    // Get current user's PERSONAL space (not memorial)
    const { data: mySpace } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', user.id)
        .eq('space_type', 'personal')
        .single();

    if (!mySpace) {
        return NextResponse.json({ error: 'Personal space not found' }, { status: 404 });
    }

    // Allow following own memorial spaces
    // (same owner_id but different space_id is OK)


    if (action === 'follow') {
        // Prevent following the exact same space (personal following personal)
        // But allow personal space to follow memorial spaces of same owner
        if (mySpace.id === targetSpaceId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Create follow request (pending)
        const { data, error } = await supabase
            .from('relationships')
            .insert({
                follower_id: mySpace.id,
                following_id: targetSpaceId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            // Check if already following
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Already following or request pending' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, relationship: data });
    }

    if (action === 'accept') {
        // Accept follow request
        const { data, error } = await supabase
            .from('relationships')
            .update({ status: 'accepted' })
            .eq('follower_id', targetSpaceId)
            .eq('following_id', mySpace.id)
            .eq('status', 'pending')
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, isMutual: true });
    }

    if (action === 'unfollow') {
        // Delete relationship
        const { error } = await supabase
            .from('relationships')
            .delete()
            .eq('follower_id', mySpace.id)
            .eq('following_id', targetSpaceId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await req.json();

    const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', requestId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
