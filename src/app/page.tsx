"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useMemoryStore } from "@/store/useMemoryStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AppEntryPage() {
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const { message, setMessage, files, setFiles, plan, user, setUser } = useMemoryStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Splash Logic
    useEffect(() => {
        const hasShownSplash = sessionStorage.getItem('splash_shown');

        if (hasShownSplash) {
            setShowSplash(false);
        } else {
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem('splash_shown', 'true');
            }, 2000); // 2 seconds splash
            return () => clearTimeout(timer);
        }
    }, []);

    // Message Logic (from /create)
    const handleNext = () => {
        if (!message.trim()) {
            alert("메시지를 입력해주세요.");
            return;
        }

        // If not logged in, we let them proceed to Recipient (or Login)? 
        // Existing logic in /about allowed writing then redirected to login.
        // But /create usually requires auth or handles it in middleware.
        // We'll mimic the "Write First" flow -> Go to Recipient or Login.
        // For app-feel, we push to Recipient, which guards auth?
        // Or if not logged in, push to login?

        if (!user) {
            router.push("/login?returnTo=/recipient");
        } else {
            router.push("/recipient");
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            const newFiles = Array.from(selectedFiles);
            const supabase = createClient();

            const MAX_FILE_SIZE_BASIC = 10 * 1024 * 1024; // 10MB
            const MAX_STORAGE_PRO = 1 * 1024 * 1024 * 1024; // 1GB

            if (plan !== 'pro') {
                for (const file of newFiles) {
                    if (file.size > MAX_FILE_SIZE_BASIC) {
                        alert(`Basic 요금제에서는 10MB 이하의 파일만 업로드할 수 있습니다.\nPro로 업그레이드 해주세요.`);
                        return;
                    }
                }
            }

            if (plan === 'pro' && user?.id) {
                const { data: profile } = await supabase.from('profiles').select('storage_used').eq('id', user.id).single();
                const currentUsage = profile?.storage_used || 0;
                const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);
                const pendingFilesSize = files.reduce((acc, file) => acc + file.size, 0);

                if (currentUsage + pendingFilesSize + newFilesSize > MAX_STORAGE_PRO) {
                    alert(`저장 용량(1GB)을 초과했습니다.`);
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

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans overflow-hidden relative">

            {/* Splash Screen */}
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-blue-600 text-white"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="text-center"
                        >
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
                                AFTERM
                            </h1>
                            <p className="mt-4 text-base md:text-lg text-blue-100 font-medium tracking-wide">
                                당신의 기억을 영원히
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content (Revealed after Splash) */}
            <motion.div
                className="flex-1 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: showSplash ? 0 : 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Minimal Header */}
                <header className="w-full h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100">
                    <span className="text-xl font-black text-blue-600 tracking-tighter">AFTERM</span>
                    <Link href="/about" className="text-xs text-slate-400 font-bold hover:text-blue-600 transition-colors">
                        서비스 소개
                    </Link>
                </header>

                <main className="flex-1 w-full max-w-lg mx-auto p-6 flex flex-col items-center justify-center gap-6">

                    {/* Prompt Text */}
                    <div className="text-center space-y-2 mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                            누구에게 어떤 말을<br />남기고 싶으신가요?
                        </h2>
                        <p className="text-sm text-slate-500">지금 미리 적어두면, 그 날에 전해드립니다.</p>
                    </div>

                    {/* Write Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/5 border border-slate-100 flex flex-col gap-4 relative"
                    >
                        {/* Text Input */}
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="사랑하는 사람에게 전하고 싶은 말을 적어보세요..."
                            className="w-full min-h-[220px] text-lg leading-relaxed border-none focus-visible:ring-0 p-2 resize-none placeholder:text-slate-300 text-slate-800"
                        />

                        {/* File Preview */}
                        {files.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2 -mx-2 px-2 scrollbar-hide">
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative flex-shrink-0 w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">{file.type.startsWith('video') ? '🎥' : '📷'}</span>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                            >
                                <span className="text-xl">📎</span>
                                <span className="text-xs font-bold">사진/영상 추가</span>
                            </button>
                            <span className="text-[10px] text-slate-300">
                                {files.length > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)}MB / ` : ""} {plan === 'pro' ? '1GB' : '10MB'}
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </motion.div>

                    {/* Action Button */}
                    <div className="w-full mt-4">
                        <Button
                            onClick={handleNext}
                            size="lg"
                            className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            다음으로
                        </Button>
                    </div>

                    {/* Footer Nav */}
                    {!user && (
                        <div className="mt-8 flex gap-6 text-sm font-medium text-slate-400">
                            <Link href="/login" className="hover:text-slate-900 transition-colors">로그인</Link>
                            <Link href="/space" className="hover:text-slate-900 transition-colors">둘러보기</Link>
                        </div>
                    )}

                </main>
            </motion.div>
        </div>
    );
}
