"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMemoryStore } from "@/store/useMemoryStore";
import { RestoreModal } from "@/components/auth/RestoreModal";
import { usePathname, useRouter } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setPlan, setBillingCycle } = useMemoryStore();
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

    // Heartbeat for Dead Man's Switch (Update last_active_at every minute)
    useEffect(() => {
        const updateActivity = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', session.user.id);
            }
        };

        // Run immediately on mount
        updateActivity();

        // Run every minute
        const interval = setInterval(updateActivity, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUserSession = async (session: any) => {
        // [BUG FIX] If no session, always clear user immediately
        if (!session || !session.user) {
            setUser(null);
            setIsRestoreModalOpen(false);
            return;
        }

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
            // Wrap in try-catch to handle 406 or other DB errors smoothly
            let profile = null;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle(); // Use maybeSingle to avoid 406 on empty

                if (error) {
                    console.error("Profile fetch error:", error);
                } else {
                    profile = data;
                }
            } catch (err) {
                console.error("Profile fetch exception:", err);
            }

            // Check if user has completed onboarding
            // [BUG FIX] 기존 가입자(이미 프로필에 전화번호와 이름이 있는 경우)는 온보딩을 완료한 것으로 간주
            const hasCompletedOnboarding = 
                session.user.user_metadata?.onboarding_completed === true || 
                (profile && profile.full_name && profile.phone);

            // Whitelist: Auth pages and onboarding itself
            const isAuthOrOnboarding = pathname.startsWith("/auth/") || pathname.startsWith("/onboarding") || pathname.startsWith("/api/") || pathname.startsWith("/_next");

            // Force incomplete users to onboarding globally
            if (!hasCompletedOnboarding && !isAuthOrOnboarding) {
                console.log("Incomplete onboarding, redirecting to /onboarding");
                router.replace("/onboarding");
            }

            // If user has completed onboarding but is still on signup/login pages
            if (hasCompletedOnboarding && (pathname === "/signup" || pathname === "/login")) {
                console.log("Onboarding complete, redirecting to Main");
                const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
                const returnTo = params.get("returnTo") || "/";
                router.replace(returnTo);
            }

            // [BUG FIX] Name fallback added to ensure onboarding flow can proceed.
            // If no name is found (e.g., brand new email signup), use email prefix or default to prevent infinite loading in onboarding.
            let finalName = profile?.full_name || session.user.user_metadata.full_name || session.user.user_metadata.name;
            const finalAvatar = profile?.avatar_url || session.user.user_metadata.avatar_url;

            if (!finalName) {
                finalName = session.user.email?.split('@')[0] || "사용자";
            }

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

            // Set Plan & Billing Cycle
            const userPlan = profile?.plan || profile?.subscription_tier || 'free';
            const userBillingCycle = profile?.billing_cycle || 'monthly';

            setPlan(userPlan as 'free' | 'pro');
            setBillingCycle(userBillingCycle as 'monthly' | 'yearly');
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
