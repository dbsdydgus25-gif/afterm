"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Search, ChevronLeft, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function SearchForm() {
    const supabase = createClient();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setHasSearched(true);

        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('title', `%${query}%`)
            .eq('is_public', true) // Only public spaces for now, or all if preferred? User said "Search desired memorial hall name". Assuming public search.
            .limit(20);

        if (error) {
            console.error(error);
        } else {
            setResults(data || []);
        }
        setSearching(false);
    };


    const handleJoin = async (e: React.MouseEvent, spaceId: string) => {
        e.preventDefault(); // Prevent link navigation
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            // Check if already a member
            const { data: member } = await supabase
                .from('space_members')
                .select('id')
                .eq('space_id', spaceId)
                .eq('user_id', user.id)
                .single();

            if (member) {
                // Already member, just navigate (handled by link wrapper usually, but here we alert just in case)
                return;
            }

            // Join as viewer
            const { error } = await supabase
                .from('space_members')
                .insert({
                    space_id: spaceId,
                    user_id: user.id,
                    role: 'viewer',
                    nickname: user.user_metadata.full_name || '방문자',
                    status: 'active'
                });

            if (error) throw error;

            alert("공간을 팔로우했습니다. '참여 중인 공간'에서 확인할 수 있습니다.");
            // Ideally update local state to show 'Participating'
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-slate-200 z-10">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-2">
                    {/* Back button for mobile mainly */}
                    <Link href="/space" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 md:hidden">
                        <ChevronLeft size={24} />
                    </Link>
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="추모관 이름 검색"
                            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                            autoFocus
                        />
                    </form>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-md mx-auto px-4 py-6">
                {!hasSearched && (
                    <div className="text-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="opacity-50" />
                        </div>
                        <p>찾으시는 추모관의<br />이름을 검색해보세요.</p>
                    </div>
                )}

                {searching && (
                    <div className="text-center py-20 text-slate-400">
                        <p>검색 중...</p>
                    </div>
                )}

                {!searching && hasSearched && results.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {results.map((space) => (
                        <Link key={space.id} href={`/space/${space.id}`} className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors shadow-sm relative group">
                            <div className="flex items-center gap-4">
                                {space.theme?.profileImage ? (
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={space.theme.profileImage} objectFit="cover" />
                                        <AvatarFallback>{space.title[0]}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {space.title[0]}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-slate-900">{space.title}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-1">{space.description || "소개가 없습니다."}</p>
                                </div>
                                <button
                                    onClick={(e) => handleJoin(e, space.id)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                                >
                                    팔로우
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchForm />
        </Suspense>
    );
}
