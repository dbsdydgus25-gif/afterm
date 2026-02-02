"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Lock, Unlock, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Memory {
    id: string;
    content?: string;
    voice_url?: string;
    is_secret: boolean;
    allowed_viewers: string[];
    recipient_id?: string;
    created_at: string;
    writer: {
        handle: string;
        name: string;
        avatar_url?: string;
    };
    recipient?: {
        handle: string;
        name: string;
    };
}

interface MemoryFeedProps {
    memories: Memory[];
    mySpaceId: string;
}

export function MemoryFeed({ memories, mySpaceId }: MemoryFeedProps) {
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [comments, setComments] = useState<Record<string, any[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});

    const toggleComments = async (memoryId: string) => {
        const newExpanded = new Set(expandedComments);

        if (newExpanded.has(memoryId)) {
            newExpanded.delete(memoryId);
        } else {
            newExpanded.add(memoryId);

            // Fetch comments if not loaded
            if (!comments[memoryId]) {
                const supabase = createClient();
                const { data } = await supabase
                    .from('memory_comments')
                    .select(`
                        *,
                        writer:writer_id (
                            handle,
                            name
                        )
                    `)
                    .eq('memory_id', memoryId)
                    .order('created_at', { ascending: true });

                setComments({ ...comments, [memoryId]: data || [] });
            }
        }

        setExpandedComments(newExpanded);
    };

    const handleAddComment = async (memoryId: string) => {
        const content = newComment[memoryId]?.trim();
        if (!content) return;

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: mySpace } = await supabase
            .from('spaces')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        const { data, error } = await supabase
            .from('memory_comments')
            .insert({
                memory_id: memoryId,
                writer_id: mySpace.id,
                content
            })
            .select(`
                *,
                writer:writer_id (
                    handle,
                    name
                )
            `)
            .single();

        if (!error && data) {
            setComments({
                ...comments,
                [memoryId]: [...(comments[memoryId] || []), data]
            });
            setNewComment({ ...newComment, [memoryId]: '' });
        }
    };

    const handleRequestAccess = async (memoryId: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('blur_access_requests')
            .insert({
                memory_id: memoryId,
                requester_id: mySpaceId,
                status: 'pending'
            });

        if (error) {
            if (error.code === '23505') {
                alert('이미 열람 요청을 보냈습니다');
            } else {
                alert('요청 실패: ' + error.message);
            }
        } else {
            alert('열람 요청을 보냈습니다!');
        }
    };

    if (memories.length === 0) {
        return (
            <div className="py-20 text-center">
                <p className="text-[14px] text-gray-400">아직 글이 없습니다</p>
                <p className="text-[12px] text-gray-400 mt-1">+ 버튼을 눌러 첫 글을 작성해보세요</p>
            </div>
        );
    }

    return (
        <div>
            {memories.map((memory) => {
                const canView = !memory.is_secret || memory.allowed_viewers.includes(mySpaceId);
                const isExpanded = expandedComments.has(memory.id);
                const memoryComments = comments[memory.id] || [];

                return (
                    <div key={memory.id} className="border-b border-gray-100 py-4 px-4">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {memory.writer.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-semibold text-gray-900">
                                        @{memory.writer.handle}
                                    </span>
                                    {memory.recipient_id && (
                                        <>
                                            <span className="text-[12px] text-gray-400">→</span>
                                            <span className="text-[13px] font-semibold text-blue-600">
                                                @{memory.recipient?.handle}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <time className="text-[12px] text-gray-400">
                                {format(new Date(memory.created_at), 'M월 d일', { locale: ko })}
                            </time>
                        </div>

                        {/* Content */}
                        <div className="pl-10">
                            {!canView ? (
                                <div className="relative bg-gray-100 rounded-lg p-6 overflow-hidden">
                                    {/* Blur Effect */}
                                    <div className="absolute inset-0 backdrop-blur-md bg-white/30"></div>
                                    <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                                        <Lock className="w-6 h-6 text-gray-500" />
                                        <span className="text-[13px] font-medium text-gray-700">시크릿 메모리</span>
                                        <button
                                            onClick={() => handleRequestAccess(memory.id)}
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Unlock className="w-3.5 h-3.5" />
                                            열람 요청
                                        </button>
                                    </div>
                                    {/* Blurred background text */}
                                    <div className="absolute inset-0 p-6 text-[14px] text-gray-400 blur-sm select-none">
                                        이것은 시크릿 메모리입니다. 작성자의 승인이 필요합니다...
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {memory.content}
                                </p>
                            )}

                            {/* Comments Toggle */}
                            <button
                                onClick={() => toggleComments(memory.id)}
                                className="mt-3 flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>댓글 {memoryComments.length}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {/* Comments Section */}
                            {isExpanded && (
                                <div className="mt-3 space-y-2">
                                    {memoryComments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                {comment.writer.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[11px] font-semibold text-gray-900">
                                                    @{comment.writer.handle}
                                                </div>
                                                <p className="text-[12px] text-gray-700">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Comment */}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={newComment[memory.id] || ''}
                                            onChange={(e) => setNewComment({ ...newComment, [memory.id]: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(memory.id)}
                                            placeholder="댓글 입력..."
                                            className="flex-1 px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => handleAddComment(memory.id)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-lg transition-colors"
                                        >
                                            작성
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
