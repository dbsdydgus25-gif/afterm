import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetUserId } = await req.json();

    // Prevent self-follow
    if (user.id === targetUserId) {
        return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    if (action === 'follow') {
        // Create follow request
        const { data, error } = await supabase
            .from('user_follows')
            .insert({
                follower_user_id: user.id,
                following_user_id: targetUserId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Already following or request pending' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, follow: data });
    }

    if (action === 'accept') {
        // Accept follow request
        const { data, error } = await supabase
            .from('user_follows')
            .update({ status: 'accepted' })
            .eq('follower_user_id', targetUserId)
            .eq('following_user_id', user.id)
            .eq('status', 'pending')
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, follow: data });
    }

    if (action === 'unfollow') {
        // Delete follow
        const { error } = await supabase
            .from('user_follows')
            .delete()
            .eq('follower_user_id', user.id)
            .eq('following_user_id', targetUserId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'followers' | 'following'

    if (type === 'followers') {
        // Get users who follow me
        const { data, error } = await supabase
            .from('user_follows')
            .select(`
                *,
                follower:follower_user_id (
                    id,
                    email
                )
            `)
            .eq('following_user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ follows: data });
    }

    if (type === 'following') {
        // Get users I follow
        const { data, error } = await supabase
            .from('user_follows')
            .select(`
                *,
                following:following_user_id (
                    id,
                    email
                )
            `)
            .eq('follower_user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ follows: data });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
}
