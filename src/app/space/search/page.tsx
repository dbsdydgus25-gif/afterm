"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    id: string;
    handle: string;
    name: string;
    avatar_url?: string;
    isFriend?: boolean;
}

export default function SpaceSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            const supabase = createClient();

            const { data } = await supabase
                .from("spaces")
                .select("id, handle, name, avatar_url")
                .or(`handle.ilike.%${query}%,name.ilike.%${query}%`)
                .limit(20);

            setResults(data || []);
            setLoading(false);
        };

        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="max-w-[430px] mx-auto min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="사용자 검색..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-[15px] outline-none focus:bg-gray-200 transition-colors"
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            <div className="p-4">
                {loading && (
                    <div className="text-center py-10 text-gray-400 text-[14px]">
                        검색 중...
                    </div>
                )}

                {!loading && query && results.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-[14px]">
                        검색 결과가 없습니다
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="space-y-2">
                        {results.map((user) => (
                            <Link
                                key={user.id}
                                href={`/space/${user.handle}`}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[16px] font-bold">
                                    {user.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[15px] font-semibold text-gray-900">
                                        {user.name}
                                    </div>
                                    <div className="text-[13px] text-gray-500">
                                        @{user.handle}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!query && (
                    <div className="text-center py-20 text-gray-400 text-[14px]">
                        사용자를 검색해보세요
                    </div>
                )}
            </div>
        </div>
    );
}
