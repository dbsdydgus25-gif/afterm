"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Sparkles } from "lucide-react";
import { Database } from "@/types/supabase";

function InviteContent() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const token = params.token as string;

    const [status, setStatus] = useState<"checking" | "joining" | "success" | "error">("checking");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const processInvite = async () => {
            if (!token) return;

            try {
                // 1. Verify Token Server-Side
                const res = await fetch('/api/invite/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error("Invite lookup failed:", errorData);
                    setStatus("error");
                    setErrorMsg("유효하지 않거나 만료된 초대 링크입니다.");
                    return;
                }

                const result = await res.json();
                const data = result.data; // Invitation or Space Data

                // Validation
                if (data.type === 'invitation') {
                    if (data.status === 'accepted') {
                        // Already accepted? Just redirect if member check passes below
                        // But strictly it might be an error if using same token for different user?
                        // For now, let's proceed to auth check
                    }
                    if (data.expires_at && new Date(data.expires_at) < new Date()) {
                        setStatus("error");
                        setErrorMsg("초대장 유효기간이 만료되었습니다.");
                        return;
                    }
                }

                // 2. Check Auth
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    // Not logged in -> Redirect to Login
                    const returnTo = `/invite/${token}`;
                    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                    return;
                }

                // 3. Check if already member
                const { data: existingMember } = await supabase
                    .from("space_members")
                    .select("id")
                    .eq("space_id", data.space_id || data.id)
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (existingMember) {
                    // Already member -> Redirect
                    router.push(`/space/${data.space_id || data.id}`);
                    return;
                }

                // 4. Auto-Join Logic (No manual nickname step)
                setStatus("joining");
                const { error: memberError } = await supabase
                    .from("space_members")
                    .insert({
                        space_id: data.space_id || data.id,
                        user_id: user.id,
                        role: data.role || 'viewer',
                        // We do NOT store nickname in space_members anymore if we want global profile
                        // BUT schema might require it? Let's check schema later.
                        // Ideally we use triggers or just null.
                        // For compatibility, we'll store null or the auth name.
                        // User wants "Use global profile", so we rely on users table joins.
                        // However, to satisfy potential NOT NULL constraints or legacy code:
                        nickname: user.user_metadata?.full_name || user.email?.split('@')[0] || '손님',
                        status: 'active'
                    });

                if (memberError) {
                    console.error("Member join error:", memberError);
                    // Ignore duplicate key error just in case race condition
                    if (memberError.code !== '23505') {
                        throw memberError;
                    }
                }

                // 5. Update Invitation Status (if specific invite)
                if (data.type === 'invitation' && data.id) {
                    await supabase
                        .from("invitations")
                        .update({ status: 'accepted' })
                        .eq("id", data.id);
                }

                // 6. Success -> Redirect
                setStatus("success");
                router.push(`/space/${data.space_id || data.id}`);

            } catch (error) {
                console.error("Process invite error:", error);
                setStatus("error");
                setErrorMsg("공간 입장 중 오류가 발생했습니다.");
            }
        };

        processInvite();
    }, [token, supabase, router]);

    if (status === "checking" || status === "joining" || status === "success") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500">
                    {status === "joining" ? "공간에 입장하는 중입니다..." : "초대장을 확인하고 있습니다..."}
                </p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm mx-auto mt-20">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <UserPlus size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">입장할 수 없습니다</h2>
                <p className="text-slate-500 mb-6">{errorMsg}</p>
                <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                    홈으로 돌아가기
                </Button>
            </div>
        );
    }

    return null; // Should not reach here
}

export default function InvitePage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Suspense fallback={<div>Loading...</div>}>
                <InviteContent />
            </Suspense>
        </div>
    );
}
