"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Home, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

interface ActivityItem {
    type: 'invite' | 'join' | 'comment' | 'like';
    id: string;
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

export default function ActivityPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
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

            // 1. Fetch Invites (Pending)
            const { data: invites } = await supabase
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

            // 2. Fetch Member Joins (Legacy method - keep for now or replace?)
            // Let's keep it to show past joins not in activity_logs
            const { data: myMemberships } = await supabase
                .from("space_members")
                .select("space_id")
                .eq("user_id", user.id);

            const mySpaceIds = myMemberships?.map(m => m.space_id) || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let joinEvents: any[] = [];
            if (mySpaceIds.length > 0) {
                const { data: joins } = await supabase
                    .from("space_members")
                    .select(`
                        *,
                        memorial_spaces (
                            title
                        ),
                        users:user_id (
                            email,
                            user_metadata
                        )
                    `)
                    .in("space_id", mySpaceIds)
                    .neq("user_id", user.id)
                    .order("joined_at", { ascending: false })
                    .limit(20);

                joinEvents = joins || [];
            }

            // 3. Fetch New Activity Logs (Comments, Likes)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let logEvents: any[] = [];
            if (mySpaceIds.length > 0) {
                const { data: logs } = await supabase
                    .from("activity_logs")
                    .select(`
                        *,
                        users:actor_id (
                            email,
                            user_metadata
                        ),
                        memorial_spaces (
                            title
                        )
                    `)
                    .in("space_id", mySpaceIds)
                    .neq("actor_id", user.id) // Don't notify my own actions
                    .order("created_at", { ascending: false })
                    .limit(30);

                logEvents = logs || [];
            }

            // Combine & Sort
            const combined: ActivityItem[] = [
                ...(invites || []).map(i => ({ type: 'invite' as const, id: i.id, created_at: i.created_at, data: i })),
                ...joinEvents.map(j => ({ type: 'join' as const, id: j.id, created_at: j.joined_at, data: j })),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...logEvents.map(l => ({ type: l.type as any, id: l.id, created_at: l.created_at, data: l }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setActivities(combined);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAccept = async (invite: any) => {
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
                    nickname: user.user_metadata?.full_name || '멤버', // Use global name
                    status: 'active'
                });

            if (memberError) {
                // Ignore if already member
                if (memberError.code !== '23505') throw memberError;
            }

            // 2. Update Invitation
            await supabase
                .from("invitations")
                .update({ status: 'accepted' })
                .eq("id", invite.id);

            alert("초대를 수락했습니다.");
            // Refresh logic - manually filter out
            setActivities(prev => prev.filter(item => item.id !== invite.id));
            router.refresh();

        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        } finally {
            setProcessingId(null);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDecline = async (invite: any) => {
        if (!confirm("초대를 거절하시겠습니까?")) return;
        setProcessingId(invite.id);
        const supabase = createClient();

        try {
            await supabase
                .from("invitations")
                .update({ status: 'expired' })
                .eq("id", invite.id);

            setActivities(prev => prev.filter(item => item.id !== invite.id));
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="font-sans min-h-screen bg-slate-50">
            <div className="flex items-center justify-between px-6 py-6 bg-white border-b border-slate-100 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-900">활동 및 알림</h1>
                <Link href="/space">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 gap-1">
                        <Home size={18} />
                        <span className="text-xs font-bold">공간 홈</span>
                    </Button>
                </Link>
            </div>

            <div className="px-6 py-6 max-w-2xl mx-auto">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center mt-10">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Bell className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500">새로운 알림이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
                                {item.type === 'invite' ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                💌
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">
                                                    &apos;{item.data.memorial_spaces?.title}&apos; 공간 초대
                                                </h3>
                                                <p className="text-slate-600 text-sm mt-0.5">
                                                    <span className="font-bold text-slate-800">{item.data.users?.user_metadata?.full_name || item.data.users?.email}</span>
                                                    님이 회원님을 초대했습니다.
                                                </p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ko })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto pl-14 sm:pl-0">
                                            <Button
                                                onClick={() => handleDecline(item.data)}
                                                disabled={!!processingId}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none h-9 text-xs"
                                            >
                                                거절
                                            </Button>
                                            <Button
                                                onClick={() => handleAccept(item.data)}
                                                disabled={!!processingId}
                                                size="sm"
                                                className="flex-1 sm:flex-none h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {processingId === item.data.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "수락"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'join' ? 'bg-green-50 text-green-600' :
                                            item.type === 'comment' ? 'bg-blue-50 text-blue-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                            {item.type === 'join' && <UserPlus size={18} />}
                                            {item.type === 'comment' && <div className="text-lg">💬</div>}
                                            {item.type === 'like' && <div className="text-lg">❤️</div>}
                                        </div>
                                        <div>
                                            <p className="text-slate-800 text-sm">
                                                <span className="font-bold">{item.data.users?.user_metadata?.full_name || item.data.users?.email || item.data.nickname}</span>
                                                님이
                                                <Link href={`/space/${item.data.space_id}`} className="font-bold text-blue-600 hover:underline mx-1">
                                                    &apos;{item.data.memorial_spaces?.title}&apos;
                                                </Link>
                                                공간에
                                                {item.type === 'join' && " 참여했습니다."}
                                                {item.type === 'comment' && " 댓글을 남겼습니다."}
                                                {item.type === 'like' && " 공감을 표시했습니다."}
                                            </p>
                                            {item.type === 'comment' && item.data.content && (
                                                <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                                    &quot;{item.data.content}...&quot;
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ko })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
