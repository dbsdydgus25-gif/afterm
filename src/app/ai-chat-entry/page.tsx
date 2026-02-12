"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, MessageCircle } from "lucide-react";

export default function AiChatEntryPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const checkSpaces = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login?next=/ai-chat-entry");
                    return;
                }

                // Check if user has any spaces
                const { data: members, error } = await supabase
                    .from("space_members")
                    .select("space_id")
                    .eq("user_id", user.id)
                    .limit(1);

                if (members && members.length > 0) {
                    // Redirect to the first space's AI chat
                    router.replace(`/space/${members[0].space_id}/ai-chat`);
                } else {
                    // No spaces, show creation UI
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error checking spaces:", error);
                setLoading(false);
            }
        };

        checkSpaces();
    }, [router, supabase]);

    const createTestSpace = async () => {
        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            // 1. Create Memorial Space
            const { data: space, error: spaceError } = await supabase
                .from("memorial_spaces")
                .insert({
                    owner_id: user.id,
                    title: "AI 채팅 테스트 공간",
                    description: "AI 추모 채팅 기능을 테스트하기 위해 생성된 공간입니다.",
                    is_public: false,
                    theme: {
                        color: 'blue',
                        profileImage: "",
                        backgroundImage: ""
                    }
                })
                .select()
                .single();

            if (spaceError) throw spaceError;

            // 2. Add Host Member
            const { error: memberError } = await supabase
                .from("space_members")
                .insert({
                    space_id: space.id,
                    user_id: user.id,
                    role: 'host',
                    nickname: user.user_metadata?.name || 'Host',
                    status: 'active'
                });

            if (memberError) throw memberError;

            // Redirect to AI Chat Setup
            router.replace(`/space/${space.id}/ai-chat/setup`);

        } catch (error: any) {
            console.error("Error creating test space:", error);
            alert(`공간 생성 실패: ${error.message}`);
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">추모 공간을 확인하고 있습니다...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    <MessageCircle size={32} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">AI 추모 채팅 시작하기</h1>
                    <p className="text-slate-500 leading-relaxed">
                        아직 생성된 추모 공간이 없습니다.<br />
                        AI 채팅 기능을 체험해보기 위해<br />
                        <strong>테스트용 공간</strong>을 생성하시겠습니까?
                    </p>
                </div>

                <div className="pt-4 space-y-3">
                    <Button
                        onClick={createTestSpace}
                        disabled={creating}
                        className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                공간 생성 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                네, 생성하고 시작할래요
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="w-full text-slate-400 hover:text-slate-600"
                    >
                        나중에 하기
                    </Button>
                </div>
            </div>
        </div>
    );
}
