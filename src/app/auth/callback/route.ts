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
            // Update last_active_at
            await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', session.user.id);

            // Check if user has completed onboarding
            // Use user_metadata which is available in the session and bypasses RLS latency/issues
            const userMetadata = session.user.user_metadata;

            // PRIMARY CHECK: onboarding_completed flag (most reliable for existing users)
            const isOnboardingComplete = userMetadata?.onboarding_completed === true;

            console.log(">>> Profile Status (from metadata):", isOnboardingComplete ? "Complete" : "Incomplete");
            console.log("Metadata:", userMetadata);

            let targetUrl = "/";

            if (!isOnboardingComplete) {
                // If new user (incomplete), redirect to SIGNUP page to set password & complete profile
                // Pass email and verification flag
                // 소셜 로그인 정보는 onboarding 페이지에서 직접 조회하므로 여기서는 사용하지 않음

                targetUrl = `/onboarding`;
            } else {
                // Existing user
                targetUrl = next;

                // Safety: Avoid onboarding loop for complete users
                if (targetUrl.includes("/onboarding")) {
                    targetUrl = "/";
                }
            }

            console.log(">>> Redirecting to:", targetUrl);
            const response = NextResponse.redirect(`${origin}${targetUrl}`);

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
