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

            // ERROR: The supabase client here uses OLD cookies... (DB RLS issue)
            // FIX: Use 'created_at' to detect NEW users, and 'user_metadata.nickname' to detect ONBOARDED users.
            // This avoids DB calls in the callback which can be flaky due to RLS/Cookie timing.

            const createdAt = new Date(session.user.created_at).getTime();
            const now = Date.now();
            const isNewUser = (now - createdAt) < 60 * 1000; // Created within last 60 seconds
            const hasNickname = session.user.user_metadata.nickname;

            // Prepare response object
            let response: NextResponse;

            // Only force verification if:
            // 1. Social Login
            // 2. Not a brand new user (Just signed up)
            // 3. Has a nickname (Means they finished onboarding and presumably set a password)
            if (isSocial && !isNewUser && hasNickname) {
                // Existing Social User -> Force Verify
                response = NextResponse.redirect(`${origin}/auth/verify-password?returnTo=${encodeURIComponent(next)}`);
            } else {
                // New User or Incomplete-Onboarding User -> Go to Target (AuthProvider will handle Onboarding redirect)
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
