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

                // Fetch PROFILE from 'profiles' table (Source of Truth)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // Check if user has completed onboarding (has nickname)
                const hasNickname = profile?.nickname || session.user.user_metadata?.nickname;

                // Whitelist: Auth pages and onboarding itself
                // Force incomplete users to onboarding on ALL pages except auth/onboarding
                const isAuthOrOnboarding = pathname.startsWith("/auth/") || pathname === "/onboarding" || pathname.startsWith("/api/") || pathname.startsWith("/_next");

                // Force incomplete users to onboarding globally
                if (!hasNickname && !isAuthOrOnboarding) {
                    console.log("Incomplete onboarding, redirecting to /onboarding");
                    router.replace("/onboarding");
                    return;
                }



                // If user has completed onboarding but is still on signup/login pages, redirect to home
                // Don't interfere with onboarding page - it handles its own logic
                if (hasNickname && (pathname === "/signup" || pathname === "/login")) {
                    console.log("Onboarding complete, redirecting to Main");
                    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
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

                // Set Plan
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
