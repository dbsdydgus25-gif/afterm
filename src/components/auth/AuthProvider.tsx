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
                const { data: agreements } = await supabase
                    .from('user_agreements')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                const hasAgreed = agreements?.terms_agreed && agreements?.privacy_agreed && agreements?.third_party_agreed && agreements?.entrustment_agreed;
                const isAgreementsPage = pathname === "/auth/agreements";

                // Whitelist public/auth paths that shouldn't trigger checks
                if (!hasAgreed && !isAgreementsPage && pathname !== "/api/auth/callback" && pathname !== "/login" && pathname !== "/signup" && pathname !== "/") {
                    console.log("Redirecting to Agreements");
                    router.replace("/auth/agreements");
                    // Continue to set user state so the agreements page can access it
                }

                // 3. [NEW] Check Phone Verification
                const isPhoneVerified = profile?.phone_verified;
                const isVerifyPage = pathname === "/auth/verify-phone";

                // Only check phone if agreed (sequential flow)
                if (hasAgreed && !isPhoneVerified && !isVerifyPage && !isAgreementsPage && pathname !== "/api/auth/callback" && pathname !== "/login" && pathname !== "/signup" && pathname !== "/") {
                    console.log("Redirecting to Phone Verification");
                    router.replace("/auth/verify-phone");
                }

                // 4. Check if Onboarding is needed (Nickname)
                const hasNickname = profile?.nickname || session.user.user_metadata?.nickname;

                // Check previous conditions to avoid conflicting redirects
                const isComplianceDone = hasAgreed && isPhoneVerified;

                // Allow access to /onboarding, /api/auth/callback, /logout
                if (isComplianceDone && !hasNickname && pathname !== "/onboarding" && pathname !== "/api/auth/callback") {
                    console.log("Redirecting to onboarding due to missing nickname");

                    // Capture current path and search params as returnTo
                    const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
                    const returnToVal = currentPath === '/' ? '' : `?returnTo=${encodeURIComponent(currentPath)}`;

                    router.replace(`/onboarding${returnToVal}`);
                }

                // If on onboarding page but already has nickname, send to dashboard (or returnTo if exists)
                if (hasNickname && pathname === "/onboarding") {
                    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
                    const returnTo = params.get("returnTo") || "/dashboard";
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
                        bio: profile.bio
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
                const { data: agreements } = await supabase
                    .from('user_agreements')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                const hasAgreed = agreements?.terms_agreed && agreements?.privacy_agreed && agreements?.third_party_agreed && agreements?.entrustment_agreed;
                const isAgreementsPage = pathname === "/auth/agreements";

                // Whitelist public/auth paths that shouldn't trigger checks
                // We mainly want to protect dashboard/settings/recipient/create
                // But generally, once logged in, we want to force this flow unless it's a specific allowed path.
                const isAuthRelated = pathname.startsWith("/auth/") || pathname === "/login" || pathname === "/signup" || pathname === "/";

                if (!hasAgreed && !isAgreementsPage && pathname !== "/api/auth/callback" && pathname !== "/login" && pathname !== "/") {
                    console.log("Redirecting to Agreements");
                    router.replace("/auth/agreements");
                    // We let it proceed to set user slightly, but the redirect will trigger
                }

                // 3. [NEW] Check Phone Verification
                const isPhoneVerified = profile?.phone_verified;
                const isVerifyPage = pathname === "/auth/verify-phone";

                // Only check phone if agreed (sequential flow)
                if (hasAgreed && !isPhoneVerified && !isVerifyPage && !isAgreementsPage && pathname !== "/api/auth/callback" && pathname !== "/login" && pathname !== "/") {
                    console.log("Redirecting to Phone Verification");
                    router.replace("/auth/verify-phone");
                }

                // 4. Check if Onboarding is needed (Nickname)
                // We trust the DB profile first. If profile exists and has nickname, they are done.
                // Fallback to metadata if DB fetch fails (rare) or user is new.
                const hasNickname = profile?.nickname || session.user.user_metadata?.nickname;

                // Check previous conditions to avoid conflicting redirects
                const isComplianceDone = hasAgreed && isPhoneVerified;

                // Allow access to /onboarding, /api/auth/callback, /logout
                if (isComplianceDone && !hasNickname && pathname !== "/onboarding" && pathname !== "/api/auth/callback") {
                    console.log("Redirecting to onboarding due to missing nickname");

                    // Capture current path and search params as returnTo
                    const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
                    const returnToVal = currentPath === '/' ? '' : `?returnTo=${encodeURIComponent(currentPath)}`;

                    router.replace(`/onboarding${returnToVal}`);
                    // Do NOT return here. We must proceed to set the user state so the onboarding page can use it.
                }

                // If on onboarding page but already has nickname, send to dashboard (or returnTo if exists)
                if (hasNickname && pathname === "/onboarding") {
                    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
                    const returnTo = params.get("returnTo") || "/dashboard";
                    router.replace(returnTo);
                }

                // Determine display values (Profile Table > Metadata > Defaults)
                const finalName = profile?.full_name || session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split("@")[0] || "사용자";
                const finalAvatar = profile?.avatar_url || session.user.user_metadata.avatar_url;
                // Determine user plan from profile, fallback to free
                const userPlan = profile?.plan || profile?.subscription_tier || 'free';
                setPlan(userPlan as 'free' | 'pro');


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
                // Force refresh session to get new JWT without 'deleted_at'
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
