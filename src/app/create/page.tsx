"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePage() {
    const router = useRouter();
    const { message, setMessage, files, setFiles, plan, user } = useMemoryStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentCount, setCurrentCount] = useState<number | null>(null);
    const [step, setStep] = useState(0); // 0: Disclaimer, 1: Create
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const fetchCount = async () => {
            if (user?.id) {
                const supabase = createClient();
                // Match the logic in dashboard: Basic users limit applies to non-archived (active) messages
                let query = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

                if (plan !== 'pro') {
                    query = query.eq('archived', false);
                }

                const { count } = await query;
                if (count !== null) setCurrentCount(count);
            }
        };
        fetchCount();

        // Reset step if re-visiting (optional, but good for safety)
        setStep(0);
        setAgreed(false);
    }, [user, plan]);

    const handleNext = () => {
        if (!message.trim()) {
            alert("메시지를 입력해주세요.");
            return;
        }

        // Message Limit Check
        const LIMIT = plan === 'pro' ? 100 : 1;
        if (currentCount !== null && currentCount >= LIMIT) {
            alert(plan === 'pro'
                ? "Pro 요금제의 메시지 보관 한도(100개)를 초과했습니다."
                : "Basic 요금제에서는 메시지를 1개만 보관할 수 있습니다.\n추가 작성을 원하시면 Pro 요금제로 업그레이드 해주세요.");
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
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between sticky top-0 z-50">
                <span className="text-xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => router.push('/')}>AFTERM</span>
                <div className="text-sm font-medium text-slate-500">
                    {step === 0 ? "서비스 이용 안내 (1/3)" : "기억 남기기 (2/3)"}
                </div>
            </header>

            {step === 0 ? (
                // DISCLAIMER STEP
                <main className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col justify-center animate-fade-in">
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">⚖️</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">
                                잠깐! 작성 전 확인해주세요
                            </h1>
                            <p className="text-sm text-slate-500">
                                안전하고 올바른 서비스 이용을 위한 안내입니다.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <span className="text-amber-500">⚠️</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-900">법적 효력 없음</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        본 서비스(AFTERM)를 통해 작성된 메시지, 사진, 영상 등은 <span className="font-bold underline text-slate-800">유언장으로서의 법적 효력을 갖지 않습니다.</span>
                                    </p>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <span className="text-blue-500">ℹ️</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-900">법률 상담 권장</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        법적 구속력이 있는 유언을 남기고자 하시는 경우, 반드시 변호사나 공증인 등 법률 전문가의 도움을 받으시기 바랍니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span className="text-sm font-bold text-slate-700">
                                    위 내용을 충분히 이해하였으며 동의합니다.
                                </span>
                            </label>
                        </div>

                        <Button
                            onClick={() => setStep(1)}
                            disabled={!agreed}
                            className="w-full h-14 text-sm font-bold rounded-xl"
                            size="lg"
                        >
                            확인했습니다
                        </Button>
                    </div>
                </main>
            ) : (
                // WRITE STEP (Original Content)
                <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col gap-6 animate-fade-in">
                    <div className="space-y-1 mt-4">
                        <h1 className="text-lg font-bold text-slate-900">
                            남기고 싶은 이야기를<br />
                            자유롭게 작성해주세요.
                        </h1>
                        <p className="text-xs text-slate-500">사진이나 동영상도 함께 첨부할 수 있습니다.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[350px]">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="사랑하는 사람에게 전하고 싶은 말을 적어보세요..."
                            className="flex-1 w-full p-2 text-sm leading-relaxed resize-none border-none focus-visible:ring-0 placeholder:text-slate-300 text-slate-800"
                        />

                        {/* File List Preview */}
                        {files.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2 mb-2 px-1">
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative flex-shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-2 pr-6 flex items-center gap-2">
                                        <span className="text-lg">{file.type.startsWith('video') ? '🎥' : '📷'}</span>
                                        <div className="max-w-[100px] truncate text-[10px] font-medium text-slate-700">
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

                        <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                                >
                                    <span className="text-lg">📎</span>
                                    <span className="text-xs font-medium">
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
                            <div className="text-[10px] text-slate-300">
                                {files.length > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)}MB / ` : ""} 최대 1GB
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-6">
                        <Button
                            onClick={handleNext}
                            size="lg"
                            className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg"
                        >
                            다음으로
                        </Button>
                    </div>
                </main>
            )}
        </div>
    );
}
