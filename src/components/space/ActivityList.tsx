"use client";

import { useState } from "react";
import { UserCheck, UserX, Trash2, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ActivityRequest {
    id: string;
    follower_id: string;
    created_at: string;
    follower: {
        handle: string;
        name: string;
        avatar_url?: string;
    };
}

interface MyComment {
    id: string;
    memory_id: string;
    content: string;
    created_at: string;
    memory: {
        id: string;
        content: string;
        space: {
            handle: string;
            name: string;
        };
    };
}

interface ActivityListProps {
    requests: ActivityRequest[];
    myComments: MyComment[];
    mySpaceId: string;
}

export function ActivityList({ requests: initialRequests, myComments: initialComments, mySpaceId }: ActivityListProps) {
    const [activeTab, setActiveTab] = useState<'requests' | 'activity'>('requests');
    const [requests, setRequests] = useState(initialRequests);
    const [comments, setComments] = useState(initialComments);
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAccept = async (requestId: string, followerId: string) => {
        setProcessing(requestId);

        await fetch("/api/space/relationships", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "accept",
                targetSpaceId: followerId
            })
        });

        setRequests(requests.filter(r => r.id !== requestId));
        setProcessing(null);
    };

    const handleReject = async (requestId: string) => {
        setProcessing(requestId);

        const response = await fetch("/api/space/relationships", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId })
        });

        if (response.ok) {
            setRequests(requests.filter(r => r.id !== requestId));
        }

        setProcessing(null);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

        setProcessing(commentId);

        const response = await fetch(`/api/comments/${commentId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            setComments(comments.filter(c => c.id !== commentId));
        }

        setProcessing(null);
    };

    return (
        <div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 sticky top-[73px] bg-white z-10">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-3 text-[13px] font-semibold transition-colors relative ${activeTab === 'requests' ? 'text-blue-600' : 'text-gray-500'
                        }`}
                >
                    팔로우 요청
                    {requests.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full">
                            {requests.length}
                        </span>
                    )}
                    {activeTab === 'requests' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-3 text-[13px] font-semibold transition-colors relative ${activeTab === 'activity' ? 'text-blue-600' : 'text-gray-500'
                        }`}
                >
                    내 활동
                    {comments.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-gray-400 text-white text-[10px] rounded-full">
                            {comments.length}
                        </span>
                    )}
                    {activeTab === 'activity' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
            </div>

            {/* Follow Requests Tab */}
            {activeTab === 'requests' && (
                <div className="p-4">
                    {requests.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-[14px] text-gray-400">새로운 팔로우 요청이 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((request) => (
                                <div key={request.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[16px] font-bold">
                                        {request.follower.name[0]}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-semibold text-gray-900">
                                            {request.follower.name}
                                        </div>
                                        <div className="text-[13px] text-gray-500">
                                            @{request.follower.handle}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(request.id, request.follower_id)}
                                            disabled={processing === request.id}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                                        >
                                            <UserCheck className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            disabled={processing === request.id}
                                            className="p-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                                        >
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Activity Tab */}
            {activeTab === 'activity' && (
                <div className="p-4">
                    {comments.length === 0 ? (
                        <div className="py-20 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-[14px] text-gray-400">남긴 댓글이 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/space/${comment.memory.space.handle}`}
                                                className="text-[13px] font-semibold text-gray-900 hover:text-blue-600"
                                            >
                                                {comment.memory.space.name}
                                            </Link>
                                            <p className="text-[12px] text-gray-500">
                                                @{comment.memory.space.handle}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            disabled={processing === comment.id}
                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                            title="댓글 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="mb-2 p-2 bg-gray-50 rounded text-[12px] text-gray-600 line-clamp-2">
                                        {comment.memory.content}
                                    </div>

                                    <div className="text-[13px] text-gray-900">
                                        "{comment.content}"
                                    </div>

                                    <div className="text-[11px] text-gray-400 mt-1">
                                        {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
