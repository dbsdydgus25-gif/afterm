
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

    // 1. Fetch Space Info
    const { data: space, error: spaceError } = await supabase
        .from("life_spaces")
        .select("*")
        .eq("id", id)
        .single();

    if (spaceError || !space) {
        notFound();
    }

    // 2. Fetch Memories
    const { data: memories, error: memoriesError } = await supabase
        .from("memories")
        .select("*")
        .eq("space_id", id)
        .order("memory_date", { ascending: false }); // Latest memories first

    const isOwner = user?.id === space.owner_id;

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-stone-200">

            {/* Navigation Header */}
            <header className="fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md border-b border-stone-100/50 transition-all">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/space" className="p-2 -ml-2 text-stone-500 hover:text-stone-800 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-stone-800 truncate px-4 text-center text-sm md:text-base">
                        {space.name}
                    </h1>
                    <div className="flex gap-1">
                        <button className="p-2 text-stone-400 hover:text-stone-800 transition-colors">
                            <Share size={20} />
                        </button>
                        {isOwner && (
                            <button className="p-2 text-stone-400 hover:text-stone-800 transition-colors">
                                <Settings size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto pt-20 pb-32 px-4 md:px-0">

                {/* Space Intro Card */}
                <section className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-stone-100 text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-[#F5F0E6] flex items-center justify-center text-3xl shadow-inner">
                        {/* Profile Image Logic: If exists use img, else emoji/initial */}
                        {space.profile_image ? (
                            <img src={space.profile_image} alt={space.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span>🌿</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-stone-900">{space.name}</h2>
                        <p className="text-stone-500 text-sm md:text-base leading-relaxed break-keep px-4">
                            {space.intro_text || (space.space_type === 'PERSONAL'
                                ? "나의 소중한 기록들을 모아두는 공간입니다."
                                : "우리가 사랑했던 순간들을 기억합니다.")}
                        </p>
                    </div>

                    {/* Stats or simple decoration line */}
                    <div className="w-10 h-1 bg-stone-100 mx-auto rounded-full mt-6"></div>
                </section>

                {/* Composer */}
                <section className="mb-10">
                    <MemoryComposer spaceId={space.id} spaceType={space.space_type} onSuccess={() => {
                        // In a server component we can't easily revalidate without a server action.
                        // For MVP, we might rely on router.refresh() inside the client component or just simple reload.
                        // We'll handle this in the client component 'onSuccess' prop via `router.refresh()`.
                        // (Wait, `MemoryComposer` accepts onSuccess but `router` is needed there).
                        // Actually `MemoryComposer` needs `useRouter` to refresh.
                    }} />
                </section>


                {/* Timeline */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="font-bold text-stone-800 text-lg">Memories</h3>
                        <span className="text-xs text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded-full">{memories?.length || 0}개의 기록</span>
                    </div>

                    {(!memories || memories.length === 0) ? (
                        <div className="py-20 text-center text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
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
