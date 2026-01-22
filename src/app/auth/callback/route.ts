import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    // 1. Determine Redirect Target (Priority: Cookie > Query Param > Default)
    // Read from cookies() for server-side consistent access
    const cookieStore = await cookies();
    const cookieReturnTo = cookieStore.get('auth_return_to')?.value;
    let next = decodeURIComponent(cookieReturnTo || searchParams.get("next") || "/");

    // Ensure next starts with / to prevent open redirect vulnerabilities (basic check)
    if (!next.startsWith("/")) next = "/";

    if (code) {
        const supabase = await createClient();
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session) {
            // Check Provider
            const provider = session.user.app_metadata.provider;
            const identities = session.user.identities || [];
            const isSocial = provider !== 'email' || identities.some((id: any) => id.provider === 'google' || id.provider === 'kakao');

            // Fetch Profile (Source of Truth)
            // Note: exchangeCodeForSession sets cookies for *response*. 
            // The current 'supabase' client might not have the session set effectively for RLS if not refreshed.
            // But usually @supabase/ssr handles this. 
            // If this fails often, we might need to rely on metadata or bypass RLS (if we had admin key).
            const { data: profile } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('id', session.user.id)
                .single();

            const hasNickname = profile?.nickname;

            // Prepare response object
            let response: NextResponse;

            if (isSocial && hasNickname) {
                // Existing Social User -> Force Verify
                response = NextResponse.redirect(`${origin}/auth/verify-password?returnTo=${encodeURIComponent(next)}`);
            } else {
                // New User or Email User -> Go to Target
                response = NextResponse.redirect(`${origin}${next}`);
            }

            // Cleanup Cookie
            if (cookieReturnTo) {
                response.cookies.delete('auth_return_to');
            }

            return response;
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
