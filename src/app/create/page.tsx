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

    // Check if there are unsaved changes
    const hasChanges = message.trim().length > 0 || files.length > 0;

    // 1. Browser Level Warning (Refresh/Close)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges && step === 1) { // Only warn in writing step
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges, step]);

    // 2. In-App Navigation Warning (Header Logo)
    const handleExit = () => {
        if (hasChanges && step === 1) {
            if (confirm("작성 중인 내용은 저장되지 않습니다. 정말 나가시겠습니까?")) {
                router.push('/');
            }
        } else {
            router.push('/');
        }
    };

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
            const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB Limit for Everyone

            // Calculate current total size
            const currentTotalSize = files.reduce((acc, file) => acc + file.size, 0);
            const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);

            if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
                alert(`한 메시지당 첨부 파일 용량은 총 10MB로 제한됩니다.\n현재: ${(currentTotalSize / (1024 * 1024)).toFixed(1)}MB / 추가: ${(newFilesSize / (1024 * 1024)).toFixed(1)}MB`);
                return;
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
                <span className="text-xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={handleExit}>AFTERM</span>
                <div className="text-sm font-medium text-slate-500">
                    {step === 0 ? "서비스 이용 안내 (1/3)" : "기억 남기기 (2/3)"}
                </div>
            </header>

            {step === 0 ? (
                // SIMPLE CONSENT STEP
                <main className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col justify-center animate-fade-in">
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-xl font-bold text-slate-900">
                                안전한 정보 저장을 위해<br />아래 내용을 확인해주세요
                            </h1>
                            <p className="text-sm text-slate-500">
                                올바른 서비스 이용을 위한 기본 안내입니다.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <ul className="text-sm text-slate-600 leading-relaxed space-y-3 list-disc pl-4 marker:text-slate-300">
                                <li>
                                    본 서비스(AFTERM)를 통해 작성된 메시지 형식은 <strong className="text-slate-800">유언장으로서의 법적 효력이 없습니다.</strong>
                                </li>
                                <li>
                                    법적 구속력이 있는 유언을 남기고자 하시는 경우, 전문가의 도움을 받으시기 바랍니다.
                                </li>
                            </ul>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-200 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm font-bold text-slate-700">
                                    작성 정보 저장 전 동의 사항을 확인했습니다.
                                </span>
                            </label>
                        </div>

                        <Button
                            onClick={() => setStep(1)}
                            disabled={!agreed}
                            className={`w-full h-14 text-sm font-bold rounded-xl transition-all ${agreed ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 text-slate-400'}`}
                            size="lg"
                        >
                            {agreed ? '작성 시작하기' : '안내 사항에 동의해주세요'}
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
                                {files.length > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)}MB / ` : ""} 최대 10MB
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-6">
                        <Button
                            onClick={handleNext}
                            size="lg"
                            className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                        >
                            다음으로
                        </Button>
                    </div>
                </main>
            )}
        </div>
    );
}
