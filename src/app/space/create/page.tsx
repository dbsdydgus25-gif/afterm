"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";

function CreateForm() {
    const router = useRouter();
    const supabase = createClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            // Create Memorial Space
            const { data, error } = await supabase
                .from("memorial_spaces")
                .insert({
                    owner_id: user.id,
                    title,
                    description,
                    is_public: false, // Default to private
                    theme: { color: 'blue' } // Default theme
                })
                .select()
                .single();

            if (error) throw error;

            // Also add self as Host in space_members
            if (data) {
                await supabase
                    .from("space_members")
                    .insert({
                        space_id: data.id,
                        user_id: user.id,
                        role: 'host',
                        status: 'active'
                    });

                router.push(`/space/${data.id}`);
                router.refresh();
            }

        } catch (error) {
            console.error("Error creating space:", error);
            alert("공간 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden">
                <div className="flex items-center justify-between h-14 px-4">
                    <Link href="/space" className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-slate-900 text-sm">기억 공간 만들기</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-20 md:py-20">
                <div className="text-center mb-10 space-y-2">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        새로운 추모 공간
                    </h1>
                    <p className="text-slate-500 text-sm">
                        지금 바로 소중한 사람을 위한 추억의 공간을 만들어보세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">공간 이름</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: 사랑하는 OOO을 기억하며"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">소개글</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="이 공간에 대한 짧은 소개를 남겨주세요."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-none placeholder:text-slate-300"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="w-full py-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "공간 생성 완료"}
                    </Button>
                </form>
            </main>
        </div>
    );
}

// Wrap in Suspense to avoid de-opt
export default function CreateSpacePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateForm />
        </Suspense>
    );
}
