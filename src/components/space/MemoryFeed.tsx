"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Lock } from "lucide-react";

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

interface MemoryFeedProps {
    memories: Memory[];
    mySpaceId: string;
}

export function MemoryFeed({ memories, mySpaceId }: MemoryFeedProps) {
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

                return (
                    <div key={memory.id} className="border-b border-gray-100 py-4 px-4">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {memory.writer.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[14px] font-semibold text-gray-900">
                                        {memory.writer.name}
                                    </span>
                                    <span className="text-[12px] text-gray-400">
                                        @{memory.writer.handle}
                                    </span>
                                </div>
                            </div>
                            <time className="text-[12px] text-gray-400">
                                {format(new Date(memory.created_at), 'M월 d일', { locale: ko })}
                            </time>
                        </div>

                        {/* Content */}
                        <div className="pl-10">
                            {!canView ? (
                                <div className="backdrop-blur-xl bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                        <Lock className="w-4 h-4" />
                                        <span className="text-[13px] font-medium">시크릿 메모리</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {memory.content}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
