import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        if (!username || username.length < 3) {
            return NextResponse.json({ available: false, error: 'Username too short' });
        }

        // Validate format (alphanumeric, dot, underscore)
        const validRegex = /^[a-zA-Z0-9._]+$/;
        if (!validRegex.test(username)) {
            return NextResponse.json({ available: false, error: 'Invalid characters' });
        }

        const supabase = await createClient();

        // Query profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found" which is good
            console.error('Username check error:', error);
            return NextResponse.json({ available: false, error: 'Database error' });
        }

        if (data) {
            return NextResponse.json({ available: false, message: 'Username taken' });
        }

        return NextResponse.json({ available: true });

    } catch (error) {
        return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
    }
}
