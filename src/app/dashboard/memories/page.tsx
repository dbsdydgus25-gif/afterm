"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { ArrowLeft } from "lucide-react";

export default function MyMemoriesPage() {
    const router = useRouter();
    const { user, setMessage, setMessageId, setRecipient } = useMemoryStore();
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = user?.id || session?.user?.id;

            if (!currentUserId) return;

            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false });

            if (data) {
                setMemories(data);
            }
            setLoading(false);
        };

        fetchMessages();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <main className="pt-32 pb-20 px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> 돌아가기
                    </button>
                    <Button onClick={() => router.push('/create')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 text-sm">
                        + 새 기억 남기기
                    </Button>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-8">나의 기억 보관함</h1>

                {memories.length > 0 ? (
                    <div className="space-y-4">
                        {memories.map((mem) => (
                            <div key={mem.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold">D-Day 전송</span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(mem.created_at).toLocaleDateString()} 작성
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            To. {mem.recipient_name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rel = mem.recipient_relationship === 'family' ? '가족' :
                                                    mem.recipient_relationship === 'friend' ? '친구' :
                                                        mem.recipient_relationship === 'lover' ? '연인' :
                                                            mem.recipient_relationship === 'colleague' ? '동료' : '기타';

                                                setMessage(mem.content);
                                                setMessageId(mem.id);
                                                setRecipient({
                                                    name: mem.recipient_name,
                                                    phone: mem.recipient_phone || '',
                                                    relationship: rel
                                                });
                                                router.push('/dashboard/edit');
                                            }}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8"
                                        >
                                            수정
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">삭제</Button>
                                    </div>
                                </div>
                                <p className="text-slate-600 leading-relaxed line-clamp-2">
                                    {mem.content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-slate-900 font-bold text-lg mb-2">아직 남긴 기억이 없습니다.</p>
                        <p className="text-slate-500 mb-6">소중한 사람에게 마음을 전해보세요.</p>
                        <Button onClick={() => router.push('/create')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6 py-3">
                            첫 번째 기억 남기기
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
