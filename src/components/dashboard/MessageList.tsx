"use client";

import { Button } from "@/components/ui/button";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Message {
    id: string;
    content: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_relationship: string;
    created_at: string;
    file_path?: string;
    type?: "text" | "image" | "voice" | "video";
}

interface MessageListProps {
    messages: Message[];
    loading: boolean;
    imageUrls: { [key: string]: string };
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onCreateNew: () => void;
}

export function MessageList({
    messages,
    loading,
    imageUrls,
    onEdit,
    onDelete,
    onCreateNew
}: MessageListProps) {

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse h-32" />
                ))}
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <div className="text-5xl mb-4 grayscale opacity-50">📭</div>
                <p className="text-slate-900 font-bold text-lg mb-2">남겨진 기억이 없습니다.</p>
                <p className="text-slate-500 mb-6 text-sm">소중한 사람에게 마음을 미리 전해보세요.</p>
                <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-3">
                    첫 번째 기억 남기기
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((mem) => (
                <div
                    key={mem.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${mem.type === 'image' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                {mem.type === 'image' ? 'PHOTO' : 'TEXT'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                {format(new Date(mem.created_at), 'yyyy.MM.dd', { locale: ko })}
                            </span>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                            <Button onClick={() => onEdit(mem)} variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-blue-600 text-xs font-bold">
                                수정
                            </Button>
                            <Button onClick={() => onDelete(mem.id)} variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold">
                                삭제
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Thumbnail if image exists */}
                        {mem.file_path && imageUrls[mem.id] && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                                <img src={imageUrls[mem.id]} alt="memory" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                                To. {mem.recipient_name}
                                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {mem.recipient_relationship === 'family' ? '가족' :
                                        mem.recipient_relationship === 'friend' ? '친구' :
                                            mem.recipient_relationship === 'lover' ? '연인' :
                                                mem.recipient_relationship}
                                </span>
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                {mem.content}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            <div className="pt-4 flex justify-center">
                <Button onClick={onCreateNew} variant="outline" className="text-slate-500 border-slate-200 hover:bg-slate-50 font-medium text-sm">
                    + 새 기억 추가하기
                </Button>
            </div>
        </div>
    );
}
