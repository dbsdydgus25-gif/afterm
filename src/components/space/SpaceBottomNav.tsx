"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SpaceBottomNavProps {
    onCompose?: () => void;
}

export function SpaceBottomNav({ onCompose }: SpaceBottomNavProps) {
    const pathname = usePathname();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvatar = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: space } = await supabase
                    .from('spaces')
                    .select('avatar_url')
                    .eq('owner_id', user.id)
                    .eq('space_type', 'personal')
                    .single();

                if (space) {
                    setAvatarUrl(space.avatar_url);
                }
            }
        };
        fetchAvatar();
    }, []);

    const isActive = (path: string) => {
        if (path === '/space' && pathname === '/space') return true;
        if (path !== '/space' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="max-w-[430px] mx-auto flex items-center justify-around h-16">
                {/* 홈 */}
                <Link
                    href="/space"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/space') && pathname === '/space' ? 'text-blue-600' : 'text-gray-500'
                        }`}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">홈</span>
                </Link>

                {/* 검색 */}
                <Link
                    href="/space/search"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/space/search') ? 'text-blue-600' : 'text-gray-500'
                        }`}
                >
                    <Search className="w-6 h-6" />
                    <span className="text-[10px] font-medium">검색</span>
                </Link>

                {/* 글쓰기 */}
                <button
                    onClick={onCompose}
                    className="flex flex-col items-center gap-1 px-4 py-2 -mt-4"
                >
                    <div className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors">
                        <Plus className="w-7 h-7 text-white" />
                    </div>
                </button>

                {/* 활동 */}
                <Link
                    href="/space/activity"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/space/activity') ? 'text-blue-600' : 'text-gray-500'
                        }`}
                >
                    <Heart className="w-6 h-6" />
                    <span className="text-[10px] font-medium">활동</span>
                </Link>

                {/* 프로필 */}
                <Link
                    href="/space/profile"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/space/profile') || pathname?.includes('/space/') && !pathname?.includes('/space/s') && !pathname?.includes('/space/a') ? 'text-blue-600' : 'text-gray-500'
                        }`}
                >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-4 h-4" />
                        )}
                    </div>
                    <span className="text-[10px] font-medium">프로필</span>
                </Link>
            </div>
        </nav>
    );
}
