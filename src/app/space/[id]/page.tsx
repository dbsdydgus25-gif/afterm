"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Settings, UserPlus, Clock, Users, Share2, Edit2, Layout, UserCog } from "lucide-react";
import { MemoryFeed } from "@/components/space/MemoryFeed";
import { SpaceSwitcher } from "@/components/space/SpaceSwitcher";
import Link from "next/link";

export default function UserSpacePage() {
    const params = useParams();
    const router = useRouter();
    const handle = (params.id as string)?.replace(/^@/, '');

    const [space, setSpace] = useState<any>(null);
    const [memories, setMemories] = useState<any[]>([]);
    const [mySpace, setMySpace] = useState<any>(null);
    const [relationship, setRelationship] = useState<any>(null);
    const [friendCount, setFriendCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/login?returnTo=/space/' + handle;
                return;
            }

            // Get my space
            const { data: mySpaceData } = await supabase
                .from('spaces')
                .select('*')
                .eq('owner_id', user.id)
                .eq('space_type', 'personal')
                .single();

            setMySpace(mySpaceData);

            // Get target space
            const { data: spaceData } = await supabase
                .from('spaces')
                .select('*')
                .eq('handle', handle)
                .single();

            setSpace(spaceData);

            if (!spaceData) {
                setLoading(false);
                return;
            }

            // Get friend count
            const { count } = await supabase
                .from('relationships')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', spaceData.id)
                .eq('status', 'accepted');

            setFriendCount(count || 0);

            // Get relationship
            if (mySpaceData && mySpaceData.id !== spaceData.id) {
                const { data: rel } = await supabase
                    .from('relationships')
                    .select('*')
                    .eq('follower_id', mySpaceData.id)
                    .eq('following_id', spaceData.id)
                    .single();

                setRelationship(rel);
            }

            // Get memories
            const { data: memoriesData } = await supabase
                .from('memories')
                .select(`
                    *,
                    writer:writer_id (
                        handle,
                        name,
                        avatar_url
                    )
                `)
                .eq('space_id', spaceData.id)
                .order('created_at', { ascending: false });

            setMemories(memoriesData || []);
            setLoading(false);
        };

        if (handle) {
            fetchData();
        }
    }, [handle]);

    const handleFollow = async () => {
        await fetch('/api/space/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: relationship ? 'unfollow' : 'follow',
                targetSpaceId: space.id
            })
        });
        window.location.reload();
    };

    const handleShare = () => {
        const url = `https://afterm.co.kr/space/${space.handle}`;
        navigator.clipboard.writeText(url);
        alert('프로필 링크가 복사되었습니다!');
    };

    if (loading) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
                <div className="text-[14px] text-gray-400">로딩 중...</div>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-[18px] font-bold text-gray-900 mb-2">공간을 찾을 수 없습니다</h1>
                    <p className="text-[14px] text-gray-500">@{handle}</p>
                </div>
            </div>
        );
    }

    const isOwner = mySpace?.id === space.id;

    return (
        <div className="max-w-[430px] mx-auto min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    {isOwner ? (
                        <SpaceSwitcher currentSpaceId={space.id} />
                    ) : (
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile */}
                <div className="px-4 pb-4">
                    <div className="flex items-start gap-4 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                            {space.name[0]}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-[15px] font-bold text-gray-900">{space.name}</h1>
                            <p className="text-[13px] text-gray-500">@{space.handle}</p>
                        </div>
                        {!isOwner && (
                            <button
                                onClick={handleFollow}
                                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${!relationship
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : relationship.status === 'pending'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                            >
                                {!relationship && <><UserPlus className="w-3 h-3 inline mr-1" />팔로우</>}
                                {relationship?.status === 'pending' && <><Clock className="w-3 h-3 inline mr-1" />대기중</>}
                                {relationship?.status === 'accepted' && <><Users className="w-3 h-3 inline mr-1" />친구</>}
                            </button>
                        )}
                    </div>

                    {space.bio && (
                        <p className="text-[13px] text-gray-700 leading-relaxed mb-3">
                            {space.bio}
                        </p>
                    )}

                    {isOwner && (
                        <div className="grid grid-cols-3 gap-2 mb-4 pt-1">
                            <Link href="/space/settings?tab=profile" className="flex flex-col items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
                                <span className="text-[12px] font-semibold text-gray-900">프로필 편집</span>
                            </Link>
                            <Link href="/space/settings?tab=pages" className="flex flex-col items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
                                <span className="text-[12px] font-semibold text-gray-900">페이지</span>
                            </Link>
                            <Link href="/space/settings?tab=settings" className="flex flex-col items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
                                <span className="text-[12px] font-semibold text-gray-900">계정</span>
                            </Link>
                        </div>
                    )}

                    <div className="text-[12px]">
                        <span className="font-semibold text-gray-900">{friendCount}</span>
                        <span className="text-gray-500 ml-1">친구</span>
                    </div>
                </div>
            </div>

            {/* Memories */}
            <MemoryFeed memories={memories} mySpaceId={mySpace?.id || ''} />
        </div>
    );
}
