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

    const [status, setStatus] = useState<"checking" | "ready" | "joining" | "success" | "error">("checking");
    const [errorMsg, setErrorMsg] = useState("");
    const [inviteData, setInviteData] = useState<any>(null);
    const [nickname, setNickname] = useState("");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkInvite = async () => {
            // 1. Try fetching as Invitation Token
            const { data: inviteDataRaw } = await supabase
                .rpc('get_invitation_by_token', { lookup_token: token })
                .maybeSingle();

            const invite = inviteDataRaw as any;

            if (invite) {
                // Scenario A: Valid Invitation Token
                if (invite.status !== 'pending') {
                    setStatus("error");
                    setErrorMsg("이미 사용되었거나 만료된 초대장입니다.");
                    return;
                }
                if (new Date(invite.expires_at) < new Date()) {
                    setStatus("error");
                    setErrorMsg("초대장 유효기간이 만료되었습니다.");
                    return;
                }
                setInviteData(invite);
            } else {
                // Scenario B: Try as Space ID (Generic Link)
                const { data: spaceDataRaw } = await supabase
                    .rpc('get_space_for_invite', { lookup_id: token })
                    .maybeSingle();

                const space = spaceDataRaw as any;

                if (space) {
                    setInviteData({
                        space_id: space.id,
                        space_title: space.title,
                        status: 'active', // Generic links don't expire in this simplified flow
                        role: 'viewer', // Default role
                        inviter_email: null // No specific inviter
                    });
                } else {
                    console.error("Invite/Space lookup failed");
                    setStatus("error");
                    setErrorMsg("유효하지 않거나 만료된 초대 링크입니다.");
                    return;
                }
            }

            // (Validation logic moved above)

            setInviteData(invite);

            // 2. Check Auth
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in -> Redirect to Login
                const returnTo = `/invite/${token}`;
                router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                return;
            }

            setUser(user);

            // 3. Check if already member
            const { data: existingMember } = await supabase
                .from('space_members')
                .select('id')
                .eq('space_id', invite ? invite.space_id : token) // token acts as space_id in generic case
                .eq('user_id', user.id)
                .single();

            if (existingMember) {
                // Already member -> Redirect
                router.push(`/space/${invite ? invite.space_id : token}`);
                return;
            }

            // Ready to accept
            setStatus("ready");
        };

        if (token) {
            checkInvite();
        }
    }, [token, supabase, router]);

    const handleAccept = async () => {
        if (!user || !inviteData) return;
        setStatus("joining");

        try {
            // 1. Add Member
            const { error: memberError } = await supabase
                .from("space_members")
                .insert({
                    space_id: inviteData.space_id,
                    user_id: user.id,
                    role: inviteData.role || 'viewer',
                    nickname: nickname || user.user_metadata?.full_name || '손님',
                    status: 'active'
                });

            if (memberError) throw memberError;

            // 2. Update Invitation Status
            await supabase
                .from("invitations")
                .update({ status: 'accepted' })
                .eq("id", inviteData.id);

            // 3. Redirect
            setStatus("success");
            router.push(`/space/${inviteData.space_id}`);

        } catch (error) {
            console.error("Join error:", error);
            setStatus("error");
            setErrorMsg("공간 입장 중 오류가 발생했습니다.");
        }
    };

    if (status === "checking") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500">초대장을 확인하고 있습니다...</p>
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

    // Ready State
    return (
        <div className="max-w-md mx-auto px-6 py-20">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">
                        '{inviteData?.space_title}'<br />공간에 초대되셨습니다.
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {inviteData?.inviter_email ? `${inviteData.inviter_email}님이 보낸 초대장입니다.` : "소중한 추억을 함께 나누세요."}
                    </p>
                </div >

                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">이 공간에서 사용할 별명</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="예: 막내 손녀, 친구 철수"
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                    <p className="text-xs text-slate-400">미입력 시 기본 이름으로 입장합니다.</p>
                </div>

                <Button
                    onClick={handleAccept}
                    disabled={status === "joining"}
                    className="w-full py-7 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-200"
                >
                    {status === "joining" ? <Loader2 className="animate-spin" /> : "초대 수락하고 입장하기"}
                </Button>
            </div >
        </div >
    );
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
