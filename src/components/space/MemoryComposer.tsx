"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Image as ImageIcon, Mic, Lock, Search } from "lucide-react";

interface MemoryComposerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface FriendSpace {
    id: string;
    handle: string;
    name: string;
}

export function MemoryComposer({ isOpen, onClose, onSuccess }: MemoryComposerProps) {
    const [content, setContent] = useState("");
    const [isSecret, setIsSecret] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mySpace, setMySpace] = useState<any>(null);
    const [friends, setFriends] = useState<FriendSpace[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
    const [showRecipientPicker, setShowRecipientPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchMySpaceAndFriends();
        }
    }, [isOpen]);

    const fetchMySpaceAndFriends = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get my space
        const { data: space } = await supabase
            .from("spaces")
            .select("*")
            .eq("owner_id", user.id)
            .eq("space_type", "personal")
            .single();

        setMySpace(space);

        if (!space) return;

        // Get friends (mutual relationships)
        const { data: relationships } = await supabase
            .from("relationships")
            .select(`
                following_id,
                following:following_id (
                    id,
                    handle,
                    name
                )
            `)
            .eq("follower_id", space.id)
            .eq("status", "accepted");

        const friendsList = (relationships || [])
            .map(r => {
                const f = r.following;
                if (!f || typeof f !== 'object' || !('id' in f)) return null;
                return f as FriendSpace;
            })
            .filter((f): f is FriendSpace => f !== null);

        setFriends(friendsList);
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (!mySpace) {
            alert("Space가 로드되지 않았습니다. 페이지를 새로고침해주세요.");
            return;
        }

        setLoading(true);
        const supabase = createClient();

        // Create memory
        const { error } = await supabase
            .from("memories")
            .insert({
                space_id: mySpace.id,
                writer_id: mySpace.id,
                recipient_id: selectedRecipient,
                content,
                is_secret: isSecret,
                allowed_viewers: []
            });

        setLoading(false);

        if (error) {
            alert("작성 실패: " + error.message);
        } else {
            setContent("");
            setIsSecret(false);
            setSelectedRecipient(null);
            onClose();
            if (onSuccess) onSuccess();
        }
    };

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.handle.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    const selectedFriend = friends.find(f => f.id === selectedRecipient);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-[16px] font-bold">새 글 작성</h2>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || loading}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-[14px] font-semibold rounded-lg transition-colors"
                    >
                        {loading ? "작성중..." : "완료"}
                    </button>
                </div>

                {/* Recipient Selector */}
                <div className="px-4 pt-4">
                    <button
                        onClick={() => setShowRecipientPicker(!showRecipientPicker)}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                        {selectedRecipient ? (
                            <span className="text-[13px] text-blue-600 font-medium">
                                @{mySpace?.handle} → @{selectedFriend?.handle}
                            </span>
                        ) : (
                            <span className="text-[13px] text-gray-500">
                                누구에게 남길까요? (선택)
                            </span>
                        )}
                    </button>

                    {/* Recipient Picker Dropdown */}
                    {showRecipientPicker && (
                        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="친구 검색..."
                                        className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-gray-50 rounded-lg outline-none"
                                    />
                                </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setSelectedRecipient(null);
                                        setShowRecipientPicker(false);
                                        setSearchQuery("");
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 ${!selectedRecipient ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <span className="text-[13px] font-medium">내 이야기</span>
                                </button>
                                {filteredFriends.map((friend) => (
                                    <button
                                        key={friend.id}
                                        onClick={() => {
                                            setSelectedRecipient(friend.id);
                                            setShowRecipientPicker(false);
                                            setSearchQuery("");
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 ${selectedRecipient === friend.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {friend.name[0]}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-[13px] font-medium">{friend.name}</div>
                                            <div className="text-[11px] text-gray-500">@{friend.handle}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="무슨 일이 있었나요?"
                        className="w-full h-40 text-[15px] resize-none outline-none placeholder-gray-400"
                        autoFocus
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 space-y-3">
                    {/* Secret Toggle */}
                    <button
                        onClick={() => setIsSecret(!isSecret)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isSecret ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600"
                            }`}
                    >
                        <Lock className="w-4 h-4" />
                        <span className="text-[13px] font-medium">
                            {isSecret ? "시크릿 모드 (블러 처리됨)" : "공개 모드"}
                        </span>
                    </button>

                    {/* Media Options */}
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
