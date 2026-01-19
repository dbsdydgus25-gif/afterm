"use client";

import { Post } from "@/store/useMemorialStore";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PostItemProps {
    post: Post;
}

export function PostItem({ post }: PostItemProps) {
    // Helper to format mock dates that might be simple strings
    const formatDate = (dateStr: string) => {
        try {
            // Check if it's our mock format "YYYY.MM.DD"
            if (dateStr.includes('.')) {
                return dateStr;
            }
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-base font-bold text-slate-500">
                        {post.authorName[0]}
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-slate-900">{post.authorName}</span>
                        <span className="text-xs text-slate-400">{formatDate(post.date)}</span>
                    </div>
                </div>
            </div>

            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span>댓글달기</span>
                </button>
            </div>
        </div>
    );
}
