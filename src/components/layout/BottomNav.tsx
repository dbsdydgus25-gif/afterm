"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // useRouter added
import { Home, Search, Plus, User, FileText, Heart, Globe, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter(); // router hook
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Filter paths where BottomNav should NOT be shown
    const hideOnPaths = ['/login', '/signup', '/onboarding', '/create/write'];
    const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));

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
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname?.startsWith(path)) return true;
        return false;
    };

    // Special handler for "Create" button
    const handleCreateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // You can add login check here if needed, or let the page handle it
        router.push('/create');
    };

    if (shouldHide) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] pb-safe">
            <div className="max-w-[430px] mx-auto flex items-center justify-around h-16">
                {/* 홈 */}
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/') && pathname === '/' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">홈</span>
                </Link>

                {/* 기억남기기 (중앙 강조 버튼) */}
                <button
                    onClick={handleCreateClick}
                    className="flex flex-col items-center gap-1 px-4 py-2 -mt-6"
                >
                    <div className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors ring-4 ring-white">
                        <Plus className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 mt-1">남기기</span>
                </button>

                {/* 커뮤니티 */}
                <Link
                    href="/community"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/community') ? 'text-blue-600' : 'text-gray-500'}`}
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-[10px] font-medium">커뮤니티</span>
                </Link>

                {/* 온라인추모관 */}
                <Link
                    href="/space"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/space') && !isActive('/space/profile') ? 'text-blue-600' : 'text-gray-500'}`}
                >
                    <Globe className="w-6 h-6" />
                    <span className="text-[10px] font-medium">추모관</span>
                </Link>

                {/* 내 정보 */}
                <Link
                    href="/space/profile"
                    className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive('/space/profile') ? 'text-blue-600' : 'text-gray-500'}`}
                >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border border-gray-200">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                    <span className="text-[10px] font-medium">내정보</span>
                </Link>
            </div>
        </nav>
    );
}
