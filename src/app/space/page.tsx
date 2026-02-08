"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, Users, Heart } from "lucide-react";
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
            // We fetch memberships where role is NOT host
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
            })).filter(space => space !== null) || []; // Filter out nulls if space was deleted

            setJoinedSpaces(joinedList);

        } catch (error) {
            console.error("Error fetching spaces:", error);
        } finally {
            setLoading(false);
        }
    };

    const SpaceCard = ({ space, isHost }: { space: Space | JoinedSpace, isHost: boolean }) => (
        <Link href={`/space/${space.id}`} className="group relative block h-full">
            <div className="absolute inset-0 bg-blue-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full transition-transform group-hover:-translate-y-1 duration-200 shadow-sm group-hover:shadow-md flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-slate-100`}>
                        {/* Use theme image if available, else emoji placeholder */}
                        {(space.theme as any)?.profileImage ? (
                            <img src={(space.theme as any).profileImage} alt={space.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl">🕊️</span>
                        )}
                    </div>
                    {isHost ? (
                        <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-1 rounded-full">
                            Owner
                        </span>
                    ) : (
                        <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-1 rounded-full">
                            Guest
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {space.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] flex-1">
                    {space.description || "설명이 없습니다."}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-slate-400">
                    {isHost ? (
                        <>
                            <Users className="w-3.5 h-3.5 mr-1" />
                            <span>공간 관리</span>
                        </>
                    ) : (
                        <>
                            <Heart className="w-3.5 h-3.5 mr-1" />
                            <span>추모 참여 중</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );

    return (
        <div className="font-sans min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-10">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">추모 공간</h1>
                        <p className="text-slate-500 mt-1 text-sm">소중한 추억을 함께 기록하는 공간입니다.</p>
                    </div>
                    <Link href="/space/create">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-5 shadow-lg shadow-slate-200">
                            <Plus className="w-5 h-5 mr-1.5" />
                            공간 만들기
                        </Button>
                    </Link>
                </div>

                <div className="px-6 pb-20 space-y-12">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-56 bg-white rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Section 1: My Spaces */}
                            <section>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-slate-400" />
                                    내가 만든 공간
                                    <span className="ml-2 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{mySpaces.length}</span>
                                </h2>

                                {mySpaces.length === 0 ? (
                                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center h-64 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <LayoutGrid className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm mb-4">
                                            아직 생성한 공간이 없습니다.<br />
                                            직접 공간을 만들고 소중한 사람들을 초대해보세요.
                                        </p>
                                        <Link href="/space/create">
                                            <Button variant="outline" className="rounded-xl h-10 px-6 border-slate-200">
                                                지금 만들기
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {mySpaces.map((space) => (
                                            <SpaceCard key={space.id} space={space} isHost={true} />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Section 2: Joined Spaces */}
                            <section>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <Heart className="w-5 h-5 mr-2 text-slate-400" />
                                    참여 중인 공간
                                    <span className="ml-2 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{joinedSpaces.length}</span>
                                </h2>

                                {joinedSpaces.length === 0 ? (
                                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center h-40 flex flex-col items-center justify-center">
                                        <p className="text-slate-400 text-sm">
                                            아직 초대받은 공간이 없습니다.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </div>
    );
}
