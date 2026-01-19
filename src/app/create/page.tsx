"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePage() {
    const router = useRouter();
    const { message, setMessage } = useMemoryStore();
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

                    <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                                <span className="text-xl">📷</span>
                                <span className="text-sm font-medium">사진/동영상</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        alert("파일이 선택되었습니다. (데모 기능)");
                                    }
                                }}
                            />
                        </div>
                        <div className="text-xs text-slate-300">
                            최대 500MB
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
