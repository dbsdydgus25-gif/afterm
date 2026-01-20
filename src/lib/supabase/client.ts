import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-project-url') {
        // Return a dummy client or null to prevent build errors when envs are missing
        // This allows the build to pass, but the app won't function correctly without envs
        console.warn('Supabase environment variables are missing. Auth will not work.');
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder-key'
        );
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
