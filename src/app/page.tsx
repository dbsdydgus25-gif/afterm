"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";

export default function AppEntryPage() {
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    // Use the same states as the original page to ensure compatibility
    const { message, setMessage, user, plan, setMessageCount } = useMemoryStore();
    const [currentBgIndex, setCurrentBgIndex] = useState(0);

    // Background slideshow logic (Same as original)
    const backgrounds = [
        "bg-gradient-to-br from-orange-50 to-amber-50",
        "bg-gradient-to-br from-blue-50 to-indigo-50",
        "bg-gradient-to-br from-rose-50 to-pink-50",
    ];

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

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleContinue = () => {
        if (!message.trim()) {
            alert("메시지를 입력해주세요.");
            return;
        }
        // Logic from original page:
        // If logged in -> go to /create (to add media)
        // If guest -> go to /login with returnTo

        if (user) {
            router.push('/create');
        } else {
            alert("로그인 후 계속 작성이 가능합니다.");
            router.push('/login?returnTo=/create');
        }
    };

    return (
        <div className="flex flex-col min-h-screen font-sans overflow-hidden relative">

            {/* Splash Screen (White + Logo as requested) */}
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-white"
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
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-blue-600">
                                AFTERM
                            </h1>
                            <p className="mt-2 text-sm text-slate-400 font-medium tracking-wide">
                                당신의 기억을 영원히
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <Header transparentOnTop={true} />

            {/* Main Content (Revealed after Splash) */}
            <motion.div
                className="flex-1 flex flex-col items-center w-full relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: showSplash ? 0 : 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Background (From Original) */}
                <div className="absolute inset-0 z-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBgIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className={`absolute inset-0 ${backgrounds[currentBgIndex]}`}
                        />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-white/40 z-10 backdrop-blur-[1px]"></div>
                </div>

                {/* Hero Content (Centered) */}
                <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center space-y-8">

                    {/* Typography (Scaled down for mobile as requested) */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Promo Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            onClick={() => router.push('/plans')}
                            className="bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors"
                        >
                            <span className="text-[10px] sm:text-xs font-bold text-indigo-600 flex items-center gap-1.5 whitespace-nowrap">
                                🎉 <span className="underline decoration-indigo-300 decoration-2 underline-offset-2">오픈 기념</span> PRO 플랜 3개월 무료 체험!
                            </span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-3"
                        >
                            {/* H1: User complained about "Everything is too big". 
                            Original: text-2xl sm:text-4xl... 
                            New: text-xl sm:text-2xl (Smaller) */}
                            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 leading-snug break-keep drop-shadow-sm whitespace-nowrap">
                                <span className="inline-block mr-1">갑자기 떠나도</span>
                                <span className="text-blue-600 inline-block mr-1">1분이면</span>
                                <span className="inline-block">괜찮아</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-normal break-keep bg-white/50 backdrop-blur-sm py-1 px-3 rounded-full inline-block shadow-sm">
                                소중한 사람들을 위한 마지막 센스, 미리 저장하는 안부인사
                            </p>
                        </motion.div>

                        {/* Core Feature (Card Input) - Exact Logic but Smaller UI */}
                        <div className="w-full space-y-4 animate-fade-in delay-75">
                            <div className="group relative">
                                {/* Reduced glow effect size */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-50 rounded-2xl blur opacity-20 transition duration-500"></div>

                                <div className="relative">
                                    <Textarea
                                        value={message}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 500) {
                                                setMessage(e.target.value);
                                            }
                                        }}
                                        placeholder="이곳에 당신의 이야기를 담아주세요..."
                                        className="w-full min-h-[200px] text-sm leading-relaxed p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-lg resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 text-slate-800 transition-all font-sans"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-medium bg-white/50 px-2 py-1 rounded-full">
                                        {message.length} / 500자
                                    </div>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                onClick={handleContinue}
                                className="w-full h-12 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95"
                            >
                                계속 작성하기
                            </Button>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
