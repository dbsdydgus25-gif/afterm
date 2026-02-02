"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SpaceHeader } from "@/components/space/SpaceHeader";
import { MemoryCard } from "@/components/space/MemoryCard";

interface Memory {
    id: string;
    content?: string;
    voice_url?: string;
    is_secret: boolean;
    allowed_viewers: string[];
    created_at: string;
    writer: {
        handle: string;
        name: string;
        avatar_url?: string;
    };
}

export default function SpacePage() {
    const params = useParams();
    const router = useRouter();
    // Allow both @username and username (remove @ if present)
    const handle = (params.id as string)?.replace(/^@/, '');

    const [space, setSpace] = useState<any>(null);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [mySpace, setMySpace] = useState<any>(null);
    const [relationship, setRelationship] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.pathname);
                return;
            }

            // Get my space
            const { data: mySpaceData } = await supabase
                .from('spaces')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            setMySpace(mySpaceData);

            // Get target space by handle
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

    const handleSettings = () => {
        router.push('/space/settings');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-[14px] text-gray-400">로딩 중...</div>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-[18px] font-bold text-gray-900 mb-2">공간을 찾을 수 없습니다</h1>
                    <p className="text-[14px] text-gray-500">@{handle}</p>
                </div>
            </div>
        );
    }

    const isOwner = mySpace?.id === space.id;

    return (
        <div className="min-h-screen bg-white">
            <SpaceHeader
                space={space}
                isOwner={isOwner}
                relationshipStatus={
                    isOwner ? 'none' :
                        !relationship ? 'none' :
                            relationship.status
                }
                followerCount={0}
                followingCount={0}
                onFollow={handleFollow}
                onSettings={handleSettings}
            />

            {/* Memories Feed */}
            <div className="max-w-[430px] mx-auto">
                {memories.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-[14px] text-gray-400">아직 기억이 없습니다</p>
                    </div>
                ) : (
                    memories.map((memory) => {
                        const canView =
                            isOwner ||
                            memory.writer.handle === mySpace?.handle ||
                            (!memory.is_secret) ||
                            (memory.is_secret && memory.allowed_viewers.includes(mySpace?.id));

                        return (
                            <MemoryCard
                                key={memory.id}
                                memory={memory}
                                canView={canView}
                                onRequestAccess={() => {
                                    alert('열람 요청 기능은 곧 추가됩니다.');
                                }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
