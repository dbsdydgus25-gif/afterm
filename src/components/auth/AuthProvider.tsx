"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMemoryStore } from "@/store/useMemoryStore";
import { RestoreModal } from "@/components/auth/RestoreModal";
import { usePathname, useRouter } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setPlan } = useMemoryStore();
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [deletedAt, setDeletedAt] = useState<string>("");
    const [isRestoring, setIsRestoring] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const supabase = createClient();

        // Check active session
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            handleUserSession(session);
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsRestoreModalOpen(false);
                router.replace("/"); // Force redirect on sign out event
            } else {
                handleUserSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser]); // Removed pathname dependency to avoid race conditions during redirect

    const handleUserSession = async (session: any) => {
        if (session?.user) {
            // Check for Soft Delete
            const deleted = session.user.user_metadata?.deleted_at;
            if (deleted) {
                // If deleted, do NOT set user in store (blocks access)
                setDeletedAt(deleted);
                setIsRestoreModalOpen(true);
            } else {
                // Normal User
                const supabase = createClient();

                // 1. FETCH PROFILE from 'profiles' table FIRST (Source of Truth)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // 2. [NEW] Check Legal Agreements
                const { data: agreementRows } = await supabase
                    .from('user_agreements')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .limit(1);

                const agreements = agreementRows?.[0];

                const hasAgreed = agreements?.terms_agreed && agreements?.privacy_agreed && agreements?.third_party_agreed && agreements?.entrustment_agreed;
                const isAgreementsPage = pathname === "/auth/agreements";

                // Whitelist public/auth paths that shouldn't trigger checks
                // [FIX] Removed "/" from whitelist. Logged-in users MUST complete onboarding even on home page.
                const isAuthPath = pathname.startsWith("/auth/") || pathname.startsWith("/api/auth/");

                if (!hasAgreed && !isAuthPath) {
                    console.log("Redirecting to Agreements (Agreements missing)");
                    router.replace("/auth/agreements");
                    return; // Stop further checks
                }

                // [FIX] Forwarding: If agreed but still on agreement page, move forward
                if (hasAgreed && isAgreementsPage) {
                    console.log("Agreements done, forwarding to phone verify");
                    router.replace("/auth/verify-phone");
                    return;
                }

                // 3. [NEW] Check Phone Verification
                const isPhoneVerified = profile?.phone_verified;

                // Only check phone if agreed (sequential flow)
                // [FIX] Allow /onboarding because it contains fallback verification UI or Profile setup
                if (hasAgreed && !isPhoneVerified && !isAuthPath && pathname !== "/onboarding") {
                    console.log("Redirecting to Phone Verification");
                    router.replace("/auth/verify-phone");
                    return; // Stop further checks
                }

                // 4. Check if Onboarding is needed (Nickname)
                const hasNickname = profile?.nickname || session.user.user_metadata?.nickname;

                const isComplianceDone = hasAgreed && isPhoneVerified;

                // Allow access to /onboarding, /api/auth/callback, /logout
                if (isComplianceDone && !hasNickname && !isAuthPath && pathname !== "/onboarding") {
                    console.log("Redirecting to onboarding due to missing nickname");
                    const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
                    const returnToVal = currentPath === '/' ? '' : `?returnTo=${encodeURIComponent(currentPath)}`;
                    router.replace(`/onboarding${returnToVal}`);
                    return;
                }

                // If on onboarding page but already has nickname, send to dashboard (or returnTo if exists)
                // [MODIFIED] Final Step: If compliance is ALL done, and user is still on an auth/onboarding page, send to MAIN (/).
                if (hasNickname && (pathname === "/onboarding" || pathname === "/auth/verify-phone" || pathname === "/auth/agreements" || pathname === "/signup" || pathname === "/login")) {
                    console.log("Onboarding complete, redirecting to Main");
                    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
                    // Priority: returnTo > '/' (Main)
                    const returnTo = params.get("returnTo") || "/";
                    router.replace(returnTo);
                }

                // Determine display values (Profile Table > Metadata > Defaults)
                const finalName = profile?.full_name || session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split("@")[0] || "사용자";
                const finalAvatar = profile?.avatar_url || session.user.user_metadata.avatar_url;

                const finalMetadata = {
                    ...session.user.user_metadata,
                    ...(profile ? {
                        full_name: profile.full_name,
                        nickname: profile.nickname,
                        avatar_url: profile.avatar_url,
                        bio: profile.bio,
                        phone_verified: profile.phone_verified
                    } : {})
                };

                setUser({
                    id: session.user.id,
                    name: finalName,
                    email: session.user.email!,
                    image: finalAvatar,
                    user_metadata: finalMetadata,
                    app_metadata: session.user.app_metadata
                });
                setIsRestoreModalOpen(false);

                // 3. Set Plan
                const userPlan = profile?.plan || profile?.subscription_tier || 'free';
                setPlan(userPlan as 'free' | 'pro');
            }
        } else {
            setUser(null);
            setIsRestoreModalOpen(false);

            // Clear verification on logout
            if (typeof window !== 'undefined') sessionStorage.removeItem('auth_verified');
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const res = await fetch("/api/auth/restore", { method: "POST" });
            if (!res.ok) throw new Error("복구 실패");

            const supabase = createClient();
            const { error } = await supabase.auth.refreshSession();
            if (error) throw error;

            alert("계정이 성공적으로 복구되었습니다!");
            setIsRestoreModalOpen(false);
            window.location.reload();
        } catch (error) {
            alert("계정 복구 중 오류가 발생했습니다.");
            console.error(error);
        } finally {
            setIsRestoring(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setIsRestoreModalOpen(false);
        setUser(null);
        if (typeof window !== 'undefined') sessionStorage.removeItem('auth_verified');
        router.push("/");
    };

    return (
        <>
            {children}
            <RestoreModal
                isOpen={isRestoreModalOpen}
                deletedAt={deletedAt}
                onRestore={handleRestore}
                onLogout={handleLogout}
                isRestoring={isRestoring}
            />
        </>
    );
}
