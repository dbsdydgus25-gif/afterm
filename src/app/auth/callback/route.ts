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

        console.log("=== AUTH CALLBACK ===");
        console.log("Session:", session?.user?.id);
        console.log("Error:", error);

        if (!error && session) {
            // Check if user has completed onboarding
            // Use user_metadata which is available in the session and bypasses RLS latency/issues
            const userMetadata = session.user.user_metadata;
            // Social login provides full_name, so we MUST NOT use it as a completion flag.
            // Only 'nickname' proves they finished our onboarding.
            const hasNickname = !!userMetadata?.nickname;

            console.log(">>> Profile Status (from metadata):", hasNickname ? "Complete" : "Incomplete");

            let targetUrl = hasNickname ? next : "/onboarding";

            // If completed but target is onboarding, force home to prevent loops
            if (hasNickname && targetUrl.includes("/onboarding")) {
                targetUrl = "/";
            }

            console.log(">>> Redirecting to:", targetUrl);
            let response = NextResponse.redirect(`${origin}${targetUrl}`);

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
