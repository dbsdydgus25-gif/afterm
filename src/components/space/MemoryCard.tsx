"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Lock } from "lucide-react";

interface MemoryCardProps {
    memory: {
        id: string;
        content?: string;
        voice_url?: string;
        is_secret: boolean;
        created_at: string;
        writer: {
            handle: string;
            name: string;
            avatar_url?: string;
        };
    };
    canView: boolean;
    onRequestAccess?: () => void;
}

export function MemoryCard({ memory, canView, onRequestAccess }: MemoryCardProps) {
    const isBlurred = memory.is_secret && !canView;

    return (
        <div className="border-b border-gray-100 py-4 px-4 hover:bg-blue-50/20 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {memory.writer.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-gray-900 truncate">
                            {memory.writer.name}
                        </span>
                        <span className="text-[12px] text-gray-400">@{memory.writer.handle}</span>
                    </div>
                </div>
                <time className="text-[12px] text-gray-400">
                    {format(new Date(memory.created_at), 'M월 d일', { locale: ko })}
                </time>
            </div>

            {/* Content */}
            <div className="pl-10">
                {isBlurred ? (
                    <div className="relative">
                        <div className="backdrop-blur-xl bg-white/40 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center justify-center gap-2 text-blue-500">
                                <Lock className="w-4 h-4" />
                                <span className="text-[13px] font-medium">시크릿 메모리</span>
                            </div>
                            {onRequestAccess && (
                                <button
                                    onClick={onRequestAccess}
                                    className="mt-3 w-full text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-lg transition-colors shadow-sm"
                                >
                                    열람 요청하기
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {memory.content && (
                            <p className="text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {memory.content}
                            </p>
                        )}
                        {memory.voice_url && (
                            <audio
                                src={memory.voice_url}
                                controls
                                className="mt-2 w-full max-w-sm h-10"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
