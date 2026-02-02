"use client";

import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";

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

interface ActivityListProps {
    requests: ActivityRequest[];
    mySpaceId: string;
}

export function ActivityList({ requests: initialRequests, mySpaceId }: ActivityListProps) {
    const [requests, setRequests] = useState(initialRequests);
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

        // Delete the pending request
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

    if (requests.length === 0) {
        return (
            <div className="py-20 text-center">
                <p className="text-[14px] text-gray-400">새로운 활동이 없습니다</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                팔로우 요청
            </h2>

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
    );
}
