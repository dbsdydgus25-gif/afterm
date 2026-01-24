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
            console.log(">>> Redirecting to /onboarding");
            // Redirect all users to onboarding
            // The onboarding page will handle step detection based on user status
            let response = NextResponse.redirect(`${origin}/onboarding`);

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
