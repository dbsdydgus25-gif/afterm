"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Invitation {
    id: string;
    token: string;
    space_id: string;
    inviter_id: string;
    role: string;
    created_at: string;
    status: string;
    memorial_spaces: {
        title: string;
        theme: any;
    };
    users: {
        email: string;
        user_metadata: any;
    };
}

export default function ActivityPage() {
    const router = useRouter();
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Fetch pending invitations for my email
            const { data, error } = await supabase
                .from("invitations")
                .select(`
                    *,
                    memorial_spaces (
                        title,
                        theme
                    ),
                    users:inviter_id (
                        email,
                        user_metadata
                    )
                `)
                .eq("email", user.email)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setInvites(data || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (invite: Invitation) => {
        setProcessingId(invite.id);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // 1. Add Member
            const { error: memberError } = await supabase
                .from("space_members")
                .insert({
                    space_id: invite.space_id,
                    user_id: user.id,
                    role: invite.role,
                    nickname: user.user_metadata?.full_name || '멤버',
                    status: 'active'
                });

            if (memberError) throw memberError;

            // 2. Update Invitation
            await supabase
                .from("invitations")
                .update({ status: 'accepted' })
                .eq("id", invite.id);

            // 3. UI Update
            setInvites(prev => prev.filter(i => i.id !== invite.id));
            alert("초대를 수락했습니다.");
            router.refresh();

        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (invite: Invitation) => {
        if (!confirm("초대를 거절하시겠습니까?")) return;
        setProcessingId(invite.id);
        const supabase = createClient();

        try {
            await supabase
                .from("invitations")
                .update({ status: 'expired' })
                .eq("id", invite.id);

            setInvites(prev => prev.filter(i => i.id !== invite.id));
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="font-sans min-h-screen bg-slate-50">
            <div className="flex items-center justify-between px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">활동 및 알림</h1>
                    <p className="text-slate-500 mt-1">도착한 초대와 소식을 확인하세요.</p>
                </div>
            </div>

            <div className="px-6 pb-20 max-w-2xl">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
                    </div>
                ) : invites.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Bell className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500">새로운 알림이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="font-bold text-slate-900 mb-2 text-lg">초대 요청 {invites.length}건</h2>
                        {invites.map((invite) => (
                            <div key={invite.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl shrink-0">
                                        💌
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">
                                            '{invite.memorial_spaces.title}' 공간 초대
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">
                                            <span className="font-medium text-slate-700">{invite.users?.user_metadata?.full_name || invite.users?.email}</span>
                                            님이 회원님을 초대했습니다.
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true, locale: ko })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={() => handleDecline(invite)}
                                        disabled={!!processingId}
                                        variant="outline"
                                        className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-slate-50"
                                    >
                                        거절
                                    </Button>
                                    <Button
                                        onClick={() => handleAccept(invite)}
                                        disabled={!!processingId}
                                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100"
                                    >
                                        {processingId === invite.id ? <Loader2 className="animate-spin" /> : "수락"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Placeholder for other notifications */}
                {/* 
                <div className="mt-10 pt-10 border-t border-slate-100">
                    <h2 className="font-bold text-slate-400 mb-4 text-sm uppercase tracking-wider">이전 알림</h2>
                    <p className="text-slate-400 text-sm">최근 활동 내역이 없습니다.</p>
                </div> 
                */}
            </div>
        </div>
    );
}
