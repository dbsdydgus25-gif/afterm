"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Clock, Settings } from "lucide-react";

interface SpaceHeaderProps {
    space: {
        id: string;
        handle: string;
        name: string;
        bio?: string;
        avatar_url?: string;
    };
    isOwner: boolean;
    relationshipStatus?: 'none' | 'pending' | 'accepted' | 'mutual';
    followerCount: number;
    followingCount: number;
    onFollow?: () => Promise<void>;
    onSettings?: () => void;
}

export function SpaceHeader({
    space,
    isOwner,
    relationshipStatus = 'none',
    followerCount,
    followingCount,
    onFollow,
    onSettings
}: SpaceHeaderProps) {
    const [status, setStatus] = useState(relationshipStatus);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        if (!onFollow) return;
        setLoading(true);
        try {
            await onFollow();
            setStatus(status === 'none' ? 'pending' : 'none');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="max-w-[430px] mx-auto px-4 py-6">
                {/* Profile */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                        {space.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[16px] font-bold text-gray-900">{space.name}</h1>
                        <p className="text-[14px] text-gray-500">@{space.handle}</p>
                    </div>
                    {isOwner ? (
                        <button
                            onClick={onSettings}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5 text-gray-600" />
                        </button>
                    ) : (
                        <button
                            onClick={handleFollow}
                            disabled={loading}
                            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${status === 'none'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : status === 'pending'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                        >
                            {status === 'none' && <><UserPlus className="w-3.5 h-3.5 inline mr-1" />팔로우</>}
                            {status === 'pending' && <><Clock className="w-3.5 h-3.5 inline mr-1" />대기중</>}
                            {status === 'accepted' && <><UserCheck className="w-3.5 h-3.5 inline mr-1" />친구</>}
                        </button>
                    )}
                </div>

                {/* Bio */}
                {space.bio && (
                    <p className="text-[14px] text-gray-700 leading-relaxed mb-4">
                        {space.bio}
                    </p>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-[13px]">
                    <div>
                        <span className="font-semibold text-gray-900">{followerCount}</span>
                        <span className="text-gray-500 ml-1">팔로워</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-900">{followingCount}</span>
                        <span className="text-gray-500 ml-1">팔로잉</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
