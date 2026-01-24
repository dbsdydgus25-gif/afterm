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
            // Check if this is a new user or existing user
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Check agreements
            const { data: agreementRows } = await supabase
                .from('user_agreements')
                .select('*')
                .eq('user_id', session.user.id)
                .limit(1);

            const agreements = agreementRows?.[0];
            const hasAgreed = agreements?.terms_agreed && agreements?.privacy_agreed && agreements?.third_party_agreed && agreements?.entrustment_agreed;
            const isPhoneVerified = profile?.phone_verified;
            const hasNickname = profile?.nickname;

            // Prepare response
            let response: NextResponse;

            // Determine where to send the user based on their completion status
            if (!hasAgreed) {
                // Step 1: Need to agree to terms
                response = NextResponse.redirect(`${origin}/auth/agreements`);
            } else if (!isPhoneVerified) {
                // Step 2: Need phone verification
                response = NextResponse.redirect(`${origin}/auth/verify-phone`);
            } else if (!hasNickname) {
                // Step 3: Need to set up profile
                response = NextResponse.redirect(`${origin}/auth/profile-setup`);
            } else {
                // All steps complete, redirect to intended page or home
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
