"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string, mediaFile: File | null) => void;
    memorialName: string;
}

export function CreatePostModal({ isOpen, onClose, onSubmit, memorialName }: CreatePostModalProps) {
    const [content, setContent] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = () => {
        if (!content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        onSubmit(content, mediaFile);

        // Reset
        setContent("");
        setMediaFile(null);
        setPreviewUrl(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">게시물 작성하기</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <Textarea
                        placeholder={`${memorialName}님과의 소중한 추억을 남겨주세요...`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[150px] border-none text-lg resize-none p-0 focus-visible:ring-0 placeholder:text-slate-300 text-slate-800 leading-relaxed"
                    />

                    {/* Image Preview */}
                    {previewUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 mt-2">
                            <img src={previewUrl} alt="Preview" className="w-full max-h-60 object-cover bg-slate-100" />
                            <button
                                onClick={() => {
                                    setMediaFile(null);
                                    setPreviewUrl(null);
                                }}
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="border rounded-xl p-3 flex items-center justify-between mt-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <span className="text-sm font-medium text-slate-600">게시물에 추가</span>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                <span className="text-lg">🖼️</span>
                                <span className="text-xs font-bold">사진/동영상</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <Button
                        onClick={handleSubmit}
                        className={`w-full py-6 text-lg font-bold rounded-xl transition-all ${content.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed hidden-disabled'
                            }`}
                        disabled={!content.trim()}
                    >
                        게시하기
                    </Button>
                </div>
            </div>
        </div>
    );
}
