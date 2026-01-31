"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePage() {
    const router = useRouter();
    const { message, setMessage, files, setFiles, plan, user } = useMemoryStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // In a real app, we would check for authentication here
    // useEffect(() => { if (!user) router.push('/'); }, []);

    const handleNext = () => {
        if (!message.trim()) {
            alert("메시지를 입력해주세요.");
            return;
        }
        router.push("/recipient");
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            const newFiles = Array.from(selectedFiles);
            const supabase = createClient();

            // Plan Constraints
            const MAX_FILE_SIZE_BASIC = 10 * 1024 * 1024; // 10MB
            const MAX_STORAGE_PRO = 1 * 1024 * 1024 * 1024; // 1GB

            // 1. Basic Plan Check: Per File Limit
            if (plan !== 'pro') {
                for (const file of newFiles) {
                    if (file.size > MAX_FILE_SIZE_BASIC) {
                        alert(`Basic 요금제에서는 10MB 이하의 파일만 업로드할 수 있습니다.\n파일 '${file.name}'의 크기가 제한을 초과했습니다.\n\n대용량 업로드를 원하시면 Pro 요금제로 업그레이드 해주세요.`);
                        return;
                    }
                }
            }

            // 2. Pro Plan Check: Total Storage Limit
            if (plan === 'pro' && user?.id) {
                // Fetch current usage
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('storage_used')
                    .eq('id', user.id)
                    .single();

                const currentUsage = profile?.storage_used || 0;
                const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);
                const pendingFilesSize = files.reduce((acc, file) => acc + file.size, 0); // Already staged files

                if (currentUsage + pendingFilesSize + newFilesSize > MAX_STORAGE_PRO) {
                    alert(`저장 용량(1GB)을 초과하여 업로드할 수 없습니다.\n현재 사용량: ${(currentUsage / (1024 * 1024)).toFixed(1)}MB`);
                    return;
                }
            }

            setFiles([...files, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    // Calculate total size
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header (Simplified) */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between sticky top-0 z-50">
                <span className="text-xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => router.push('/')}>AFTERM</span>
                <div className="text-sm font-medium text-slate-500">기억 남기기 (1/2)</div>
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col gap-8">
                <div className="space-y-2 mt-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        남기고 싶은 이야기를<br />
                        자유롭게 작성해주세요.
                    </h1>
                    <p className="text-slate-500">사진이나 동영상도 함께 첨부할 수 있습니다.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[400px]">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="사랑하는 사람에게 전하고 싶은 말을 적어보세요..."
                        className="flex-1 w-full p-4 text-lg leading-relaxed resize-none border-none focus-visible:ring-0 placeholder:text-slate-300 text-slate-800"
                    />

                    {/* File List Preview */}
                    {files.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-2 mb-2 px-1">
                            {files.map((file, idx) => (
                                <div key={idx} className="relative flex-shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-2 pr-6 flex items-center gap-2">
                                    <span className="text-xl">{file.type.startsWith('video') ? '🎥' : '📷'}</span>
                                    <div className="max-w-[100px] truncate text-xs font-medium text-slate-700">
                                        {file.name}
                                    </div>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="absolute right-1 top-1 text-slate-400 hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                                <span className="text-xl">📎</span>
                                <span className="text-sm font-medium">
                                    파일 추가
                                </span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                        <div className="text-xs text-slate-300">
                            {files.length > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)}MB / ` : ""} 최대 1GB
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-6">
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20"
                    >
                        다음으로
                    </Button>
                </div>
            </main>
        </div>
    );
}
