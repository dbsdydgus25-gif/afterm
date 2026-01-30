"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";

function CreateForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type');
    const type = (typeParam === 'PERSONAL') ? 'PERSONAL' : 'REMEMBRANCE';

    const supabase = createClient();
    const [name, setName] = useState("");
    const [intro, setIntro] = useState("");
    const [loading, setLoading] = useState(false);

    const title = type === 'PERSONAL' ? "나의 프로필 만들기" : "기억 공간 만들기";
    const subTitle = type === 'PERSONAL'
        ? "나의 이야기를 기록할 공간을 만들어보세요."
        : "소중한 사람을 위한 추억의 공간을 만들어보세요.";
    const nameLabel = type === 'PERSONAL' ? "이름 (닉네임)" : "공간 이름 (고인 이름 등)";
    const namePlaceholder = type === 'PERSONAL' ? "예: 김철수" : "예: 사랑하는 OOO을 기억하며";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            // Create Space
            const { data, error } = await supabase
                .from("life_spaces")
                .insert({
                    owner_id: user.id,
                    name,
                    intro_text: intro,
                    space_type: type,
                    profile_image: null,
                })
                .select()
                .single();

            if (error) throw error;

            // Redirect to Home Feed for both cases
            router.push(`/space`);
            router.refresh();

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
                    <h1 className="font-bold text-slate-900 text-sm">{title}</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-20 md:py-20">
                <div className="text-center mb-10 space-y-2">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {title}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {subTitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{nameLabel}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={namePlaceholder}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">소개글</label>
                        <textarea
                            value={intro}
                            onChange={(e) => setIntro(e.target.value)}
                            placeholder="이 공간에 대한 짧은 소개를 남겨주세요."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-none placeholder:text-slate-300"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full py-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (type === 'PERSONAL' ? "프로필 생성 완료" : "공간 생성 완료")}
                    </Button>

                    {/* Intro text for onboarding */}
                    {type === 'PERSONAL' && (
                        <p className="text-xs text-center text-slate-400 mt-4">
                            프로필은 나중에 언제든지 수정할 수 있습니다.
                        </p>
                    )}
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
