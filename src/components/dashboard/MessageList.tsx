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
    status?: string;
    is_unlocked?: boolean;
    message_attachments?: { file_type: string }[];
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
            {messages.map((mem) => {
                const isOpened = mem.is_unlocked === true;

                return (
                    <div
                        key={mem.id}
                        className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer ${isOpened ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200'
                            }`}
                        onClick={() => {
                            if (isOpened) {
                                window.location.href = `/view/${mem.id}/auth`;
                            }
                        }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    // Determine type from attachments or legacy field
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    let type = (mem as any).file_type || mem.type || 'text';

                                    // Check attachments if available
                                    if (mem.message_attachments && mem.message_attachments.length > 0) {
                                        const types = mem.message_attachments.map(a => a.file_type);
                                        if (types.some(t => t.includes('video'))) type = 'video';
                                        else if (types.some(t => t.includes('image'))) type = 'image';
                                        else if (types.some(t => t.includes('audio') || t.includes('voice'))) type = 'voice';
                                        else type = 'text'; // Fallback if attachment has weird type
                                    }

                                    let label = 'TEXT';
                                    let style = 'bg-blue-50 text-blue-600';

                                    if (type.includes('image')) {
                                        label = '사진';
                                        style = 'bg-indigo-50 text-indigo-600';
                                    } else if (type.includes('video')) {
                                        label = '영상';
                                        style = 'bg-rose-50 text-rose-600';
                                    } else if (type.includes('audio') || type.includes('voice')) {
                                        label = '음성';
                                        style = 'bg-emerald-50 text-emerald-600';
                                    } else {
                                        label = '텍스트';
                                    }

                                    return (
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${style}`}>
                                            {label}
                                        </span>
                                    );
                                })()}
                                <span className="text-xs text-slate-400 font-medium">
                                    {format(new Date(mem.created_at), 'yyyy.MM.dd', { locale: ko })}
                                </span>
                                {isOpened && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                                        📬 열람됨
                                    </span>
                                )}
                            </div>

                            {!isOpened ? (
                                <div className="flex gap-1 absolute right-4 top-4 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                                    <Button onClick={(e) => { e.stopPropagation(); onEdit(mem); }} variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-blue-600 text-xs font-bold px-2">
                                        수정
                                    </Button>
                                    <div className="w-px h-4 bg-slate-200 my-auto"></div>
                                    <Button onClick={(e) => { e.stopPropagation(); onDelete(mem.id); }} variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold px-2">
                                        삭제
                                    </Button>
                                </div>
                            ) : (
                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1 absolute right-4 top-4">
                                    👁️ 읽기 전용
                                </span>
                            )}
                        </div>

                        <div className="flex gap-4">
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
                );
            })}

            {/* Button Removed */}
        </div>
    );
}
