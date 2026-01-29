
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Memory {
    id: string;
    content: string;
    image_url?: string;
    memory_date: string; // or Date
    type: "MY" | "FRIEND";
    author_id: string; // simpler for now, ideally extended with author profile
    created_at: string;
}

interface MemoryCardProps {
    memory: Memory;
    isOwner: boolean; // Is the viewer the owner of the space?
    isAuthor: boolean; // Is the viewer the author of this memory?
    onDelete?: (id: string) => void;
}

export function MemoryCard({ memory, isOwner, isAuthor, onDelete }: MemoryCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const dateStr = format(new Date(memory.memory_date), "yyyy년 M월 d일", { locale: ko });

    // Clean content for display (handle multiline)
    const content = memory.content;
    const isLongText = content.length > 150;
    const displayContent = isExpanded ? content : content.slice(0, 150) + (isLongText ? "..." : "");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 hover:shadow-md transition-shadow"
        >
            {/* Header */}
            <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${memory.type === 'MY' ? 'bg-slate-800' : 'bg-blue-500'}`}></div>
                    <div>
                        <div className="text-sm font-bold text-slate-900">
                            {memory.type === 'MY' ? '나의 기록' : '친구가 남긴 기억'}
                        </div>
                        <div className="text-xs text-slate-400">{dateStr}</div>
                    </div>
                </div>

                {(isOwner || isAuthor) && (
                    <div className="relative group">
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                            <MoreHorizontal size={20} />
                        </button>
                        {/* Dropdown for delete (Simple implementation) */}
                        <div className="absolute right-0 mt-1 w-24 bg-white border border-slate-100 shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                                onClick={() => onDelete?.(memory.id)}
                                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 size={12} /> 삭제
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image (if exists) */}
            {memory.image_url && (
                <div className="relative w-full aspect-video bg-slate-50 border-b border-slate-100">
                    {/* In real app, use Next/Image with remote patterns allowed, for now using img tag for broader compatibility if patterns not set */}
                    <img
                        src={memory.image_url}
                        alt="Memory"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Content */}
            <div className="px-6 py-5">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {displayContent}
                </p>
                {isLongText && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-400 text-xs mt-2 hover:text-blue-600 font-medium"
                    >
                        {isExpanded ? "접기" : "더 보기"}
                    </button>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-3 border-t border-slate-50 flex gap-4 text-slate-400">
                <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors text-sm group">
                    <Heart size={18} className="group-hover:fill-current" />
                    {/* <span>좋아요</span> */}
                </button>
                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors text-sm">
                    <MessageCircle size={18} />
                    {/* <span>댓글</span> */}
                </button>
                <button className="flex items-center gap-1.5 hover:text-slate-800 transition-colors ml-auto">
                    <Share2 size={18} />
                </button>
            </div>
        </motion.div>
    );
}
