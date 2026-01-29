
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MemoryComposer } from "@/components/space/MemoryComposer";
import { MemoryCard } from "@/components/space/MemoryCard";
import { Button } from "@/components/ui/button";
import { Settings, Share, ChevronLeft } from "lucide-react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SpaceDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Debugging: Wrap in try-catch to identify the 500 error cause
    let space = null;
    let memories = [];
    let isOwner = false;
    let errorDebug = null;

    try {
        // 1. Fetch Space Info
        const { data: spaceData, error: spaceError } = await supabase
            .from("life_spaces")
            .select("*")
            .eq("id", id)
            .single();

        if (spaceError || !spaceData) {
            console.error("Space Error:", spaceError);
            // notFound(); // Don't call notFound inside try catch for now, let's see errors
            if (spaceError) throw new Error(`Space Fetch Error: ${spaceError.message}`);
            return <div className="p-10 text-center">Space Not Found (ID: {id})</div>;
        }
        space = spaceData;

        // 2. Fetch Memories
        const { data: memoriesData, error: memoriesError } = await supabase
            .from("memories")
            .select("*")
            .eq("space_id", id)
            .order("memory_date", { ascending: false });

        if (memoriesError) {
            console.error("Memories Error:", memoriesError);
            throw new Error(`Memories Fetch Error: ${memoriesError.message}`);
        }
        memories = memoriesData || [];

        isOwner = user?.id === space.owner_id;

    } catch (err: any) {
        console.error("CRITICAL ERROR:", err);
        return (
            <div className="p-10 text-red-500 bg-white">
                <h1 className="text-xl font-bold mb-4">Server Error Debugging</h1>
                <pre className="bg-slate-100 p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}
                </pre>
                <p className="mt-4">
                    Message: {err?.message || "Unknown error"}
                </p>
                <p>Space ID: {id}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

            {/* Mobile Navigation Header */}
            <header className="md:hidden fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
                <div className="flex items-center justify-between h-14 px-4">
                    <Link href="/space" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-slate-900 truncate px-4 text-center text-sm">
                        {space.name}
                    </h1>
                    <div className="flex gap-1">
                        <button className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                            <Share size={20} />
                        </button>
                        {isOwner && (
                            <button className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                                <Settings size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto pt-20 md:pt-10 pb-32 px-4 md:px-0">

                {/* Space Intro Card */}
                <section className="bg-white rounded-2xl p-8 mb-8 border border-slate-200 text-center space-y-4 shadow-sm">
                    <div className="w-24 h-24 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-3xl ring-4 ring-white shadow-sm">
                        {/* Profile Image Logic: If exists use img, else emoji/initial */}
                        {space.profile_image ? (
                            <img src={space.profile_image} alt={space.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span className="text-blue-500">
                                {space.space_type === 'PERSONAL' ? '👤' : '🕊️'}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{space.name}</h2>
                        <p className="text-slate-500 text-sm md:text-base leading-relaxed break-keep px-4">
                            {space.intro_text || (space.space_type === 'PERSONAL'
                                ? "나의 소중한 기록들을 모아두는 공간입니다."
                                : "우리가 사랑했던 순간들을 기억합니다.")}
                        </p>
                    </div>

                    {/* Stats or simple decoration line */}
                    <div className="w-10 h-1 bg-slate-100 mx-auto rounded-full mt-6"></div>
                </section>

                {/* Composer */}
                <section className="mb-10">
                    <MemoryComposer spaceId={space.id} spaceType={space.space_type} />
                </section>


                {/* Timeline */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="font-bold text-slate-800 text-lg">Memories</h3>
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-full">{memories?.length || 0}개의 기록</span>
                    </div>

                    {(!memories || memories.length === 0) ? (
                        <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p>아직 기록된 추억이 없습니다.</p>
                            <p className="text-sm mt-1">첫 번째 기억을 남겨보세요.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {memories.map((memory) => (
                                <MemoryCard
                                    key={memory.id}
                                    memory={memory}
                                    isOwner={isOwner}
                                    isAuthor={user?.id === memory.author_id}
                                />
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
