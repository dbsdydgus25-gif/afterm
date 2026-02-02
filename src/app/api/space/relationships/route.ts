import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetSpaceId } = await req.json();

    // Get current user's space
    const { data: mySpace } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!mySpace) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    if (action === 'follow') {
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

        // Check if mutual
        const { data: reverse } = await supabase
            .from('relationships')
            .select('status')
            .eq('follower_id', mySpace.id)
            .eq('following_id', targetSpaceId)
            .single();

        const isMutual = reverse?.status === 'accepted';

        return NextResponse.json({ success: true, isMutual });
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
