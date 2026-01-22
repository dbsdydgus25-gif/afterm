import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session) {
            // Check Provider
            const provider = session.user.app_metadata.provider;
            const identities = session.user.identities || [];
            const isSocial = provider !== 'email' || identities.some((id: any) => id.provider === 'google' || id.provider === 'kakao');

            // If Social Login, force Password Verification
            // But we need to check if they actually HAVE a password? 
            // For now, based on requirements, we assume they do or onboarding sets it.
            // If they are new users (Onboarding not done), they might not have a password yet.
            // But the Verify Page checks auth.
            // Let's redirect to verify IF it's social.
            // WAIT: New users (Sign Up) also come here. They don't have a password set in our custom flow yet (Onboarding sets it).
            // If we send new users to verify-password, they will get stuck?
            // "Verify Password" page calls signInWithPassword.
            // If user has NO password, this fails.

            // Logic:
            // 1. If Social -> Redirect to /auth/verify-password
            // 2. Exception: If they are NEW (no password set in app metadata?), how to know?
            // Actually, Onboarding Step 1 sets the password. 
            // If they are brand new, they go to Onboarding (via AuthProvider check).
            // AuthProvider checks nickname.
            // So: 
            // If we send them to VerifyPassword, and they are new, they can't verify.
            // We should let them go to `next` (which is likely / or /onboarding or /dashboard).
            // Then AuthProvider picks them up.

            // But User Requirement: "When login with Google/Kakao... verify password".
            // This implies EXISTING users.
            // How to distinguish?
            // Profiles table check is async and server side DB call.
            // We can do it here.

            // Allow bypassing verify if they need onboarding (nickname check is good proxy).
            const nickname = session.user.user_metadata.nickname;

            if (isSocial && nickname) {
                return NextResponse.redirect(`${origin}/auth/verify-password?returnTo=${encodeURIComponent(next)}`);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
