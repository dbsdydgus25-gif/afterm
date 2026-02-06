"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Plus, LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Space {
    id: string;
    title: string;
    description: string;
    created_at: string;
    is_public: boolean;
    owner_id: string;
    theme?: any;
}

export default function SpaceDashboard() {
    const router = useRouter();
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchSpaces();
    }, []);

    const fetchSpaces = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);

            // Fetch owned spaces and invited spaces
            // For now, let's just fetch owned spaces for simplicity
            const { data, error } = await supabase
                .from("memorial_spaces")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSpaces(data || []);
        } catch (error) {
            console.error("Error fetching spaces:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">추모 공간 (Memorial Canvas)</h1>
                        <p className="text-slate-500 mt-1">소중한 추억을 함께 기록하는 공간입니다.</p>
                    </div>
                    <Link href="/space/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 shadow-sm">
                            <Plus className="w-5 h-5 mr-1.5" />
                            공간 만들기
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : spaces.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LayoutGrid className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">첫 추모 공간을 만들어보세요</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            직접 공간을 만들고 친구들을 초대하여<br />함께 추억을 채워나갈 수 있습니다.
                        </p>
                        <Link href="/space/create">
                            <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                                지금 시작하기
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {spaces.map((space) => (
                            <Link key={space.id} href={`/space/${space.id}`} className="group relative block">
                                <div className="absolute inset-0 bg-blue-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full transition-transform group-hover:-translate-y-1 duration-200 shadow-sm group-hover:shadow-md">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${space.theme ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                                            🕊️
                                        </div>
                                        {space.is_public ? (
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Public</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Private</span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {space.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                        {space.description || "설명이 없습니다."}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-slate-400">
                                        <Users className="w-3.5 h-3.5 mr-1" />
                                        <span>관리자 (나)</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
