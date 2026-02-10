"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, Users, Heart, ArrowRight, Grid, List } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";

type Space = Database['public']['Tables']['memorial_spaces']['Row'];

interface JoinedSpace extends Space {
    role: string;
}

export default function SpaceDashboard() {
    const router = useRouter();
    const [mySpaces, setMySpaces] = useState<Space[]>([]);
    const [joinedSpaces, setJoinedSpaces] = useState<JoinedSpace[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAllMySpaces, setShowAllMySpaces] = useState(false);
    const [showAllJoined, setShowAllJoined] = useState(false);

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

            // 1. Valid My Spaces (Owned)
            const { data: ownedData, error: ownedError } = await supabase
                .from("memorial_spaces")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });

            if (ownedError) throw ownedError;
            setMySpaces(ownedData || []);

            // 2. Joined Spaces (Guest)
            const { data: memberData, error: memberError } = await supabase
                .from("space_members")
                .select(`
                    role,
                    memorial_spaces (*)
                `)
                .eq("user_id", user.id)
                .neq("role", "host") // Exclude where I am host
                .order("joined_at", { ascending: false });

            if (memberError) throw memberError;

            // Transform data structure
            const joinedList = memberData?.map((item: any) => ({
                ...item.memorial_spaces,
                role: item.role
            })).filter(space => space !== null) || [];

            setJoinedSpaces(joinedList);

        } catch (error) {
            console.error("Error fetching spaces:", error);
        } finally {
            setLoading(false);
        }
    };

    const SpaceCard = ({ space, isHost }: { space: Space | JoinedSpace, isHost: boolean }) => (
        <Link href={`/space/${space.id}`} className="group relative block w-[220px] md:w-[280px] shrink-0 snap-start">
            {/* Wallet Card Style */}
            <div className="relative h-[300px] md:h-[360px] bg-white rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                {/* Cover Image Half */}
                <div className="h-[160px] md:h-[200px] w-full bg-slate-100 relative overflow-hidden">
                    {(space.theme as any)?.backgroundImage ? (
                        <img src={(space.theme as any).backgroundImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>

                {/* Content Half */}
                <div className="p-4 md:p-6 relative">
                    {/* Floating Profile Image */}
                    <div className="absolute -top-8 md:-top-10 left-4 md:left-6 w-14 h-14 md:w-16 md:h-16 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center">
                        {(space.theme as any)?.profileImage ? (
                            <img src={(space.theme as any).profileImage} alt={space.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl">🕊️</span>
                        )}
                    </div>

                    <div className="mt-6 md:mt-8">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {space.title}
                        </h3>
                        <p className="text-[11px] md:text-xs text-slate-500 line-clamp-2">
                            {space.description || "소중한 추억을 함께 기록하는 공간"}
                        </p>
                    </div>

                    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
                        {isHost ? (
                            <span className="bg-slate-900 text-white text-[9px] md:text-[10px] uppercase font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-md">
                                Owner
                            </span>
                        ) : (
                            <span className="bg-blue-50 text-blue-600 text-[9px] md:text-[10px] uppercase font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full">
                                Guest
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="font-sans min-h-screen bg-slate-50 pb-20">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-8 lg:px-12">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">추모 공간</h1>
                        <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">기억을 잇고 마음을 나누는 곳</p>
                    </div>
                    <Link href="/space/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-5 md:h-12 md:px-6 shadow-lg shadow-blue-200 transition-transform hover:scale-105 active:scale-95 font-bold text-sm md:text-base">
                            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                            <span className="hidden md:inline">새 공간 만들기</span>
                            <span className="md:hidden">만들기</span>
                        </Button>
                    </Link>
                </div>

                <div className="space-y-12">
                    {loading ? (
                        <div className="px-5 lg:px-12 flex gap-4 overflow-hidden">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-[220px] md:w-[280px] h-[300px] md:h-[360px] bg-white rounded-[20px] md:rounded-[24px] animate-pulse shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Section 1: My Spaces */}
                            <section>
                                <div className="px-5 lg:px-12 flex items-center justify-between mb-5">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <div className="w-1.5 h-6 md:w-2 md:h-8 bg-slate-900 rounded-full" />
                                        내가 만든 공간
                                        <span className="bg-slate-100 text-slate-500 text-[10px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">{mySpaces.length}</span>
                                    </h2>
                                    {mySpaces.length > 0 && (
                                        <button
                                            onClick={() => setShowAllMySpaces(!showAllMySpaces)}
                                            className="text-xs md:text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                        >
                                            {showAllMySpaces ? <><Grid size={14} className="md:w-4 md:h-4" /> 카드 보기</> : <><LayoutGrid size={14} className="md:w-4 md:h-4" /> 모두 보기</>}
                                        </button>
                                    )}
                                </div>

                                {mySpaces.length === 0 ? (
                                    <div className="mx-5 lg:mx-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8 md:p-12 text-center h-56 md:h-64 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 md:mb-4">
                                            <Plus className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium mb-5 md:mb-6 text-sm md:text-base">
                                            첫 번째 추모 공간을 만들어보세요.
                                        </p>
                                        <Link href="/space/create">
                                            <Button variant="outline" className="rounded-xl h-10 md:h-11 px-6 md:px-8 border-slate-200 hover:bg-slate-50 font-bold text-sm md:text-base">
                                                시작하기
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className={`px-5 lg:px-12 ${showAllMySpaces ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8' : 'flex gap-4 lg:gap-6 overflow-x-auto pb-6 snap-x scrollbar-hide'}`}>
                                        {mySpaces.map((space) => (
                                            <SpaceCard key={space.id} space={space} isHost={true} />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Section 2: Joined Spaces */}
                            <section>
                                <div className="px-5 lg:px-12 flex items-center justify-between mb-5">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <div className="w-1.5 h-6 md:w-2 md:h-8 bg-blue-100 rounded-full" />
                                        참여 중인 공간
                                        <span className="bg-slate-100 text-slate-500 text-[10px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">{joinedSpaces.length}</span>
                                    </h2>
                                    {joinedSpaces.length > 0 && (
                                        <button
                                            onClick={() => setShowAllJoined(!showAllJoined)}
                                            className="text-xs md:text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                        >
                                            {showAllJoined ? <><Grid size={14} className="md:w-4 md:h-4" /> 카드 보기</> : <><LayoutGrid size={14} className="md:w-4 md:h-4" /> 모두 보기</>}
                                        </button>
                                    )}
                                </div>

                                {joinedSpaces.length === 0 ? (
                                    <div className="mx-5 lg:mx-12 bg-slate-100 rounded-3xl border border-transparent p-8 md:p-12 text-center h-40 md:h-48 flex flex-col items-center justify-center">
                                        <Heart className="w-6 h-6 md:w-8 md:h-8 text-slate-300 mb-2" />
                                        <p className="text-slate-400 text-xs md:text-sm">
                                            아직 초대받은 공간이 없습니다.
                                        </p>
                                    </div>
                                ) : (
                                    <div className={`px-5 lg:px-12 ${showAllJoined ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8' : 'flex gap-4 lg:gap-6 overflow-x-auto pb-6 snap-x scrollbar-hide'}`}>
                                        {joinedSpaces.map((space) => (
                                            <SpaceCard key={space.id} space={space} isHost={false} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>

            {/* Horizontal Scroll Styles */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
