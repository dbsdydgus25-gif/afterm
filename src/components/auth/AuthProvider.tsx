"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMemoryStore } from "@/store/useMemoryStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser } = useMemoryStore();
    const supabase = createClient();

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    name: session.user.user_metadata.full_name || session.user.user_metadata.name || "사용자",
                    email: session.user.email || "",
                });
            } else {
                setUser(null);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    name: session.user.user_metadata.full_name || session.user.user_metadata.name || "사용자",
                    email: session.user.email || "",
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser, supabase]);

    return <>{children}</>;
}
