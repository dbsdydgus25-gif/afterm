"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

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
                <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-start md:justify-center min-h-screen px-6 pt-24 md:pt-32 pb-24 md:pb-10 text-center space-y-6 md:space-y-8">

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
                            className="space-y-4"
                        >
                            {/* Main Title - Much Larger */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight break-keep drop-shadow-sm">
                                <span className="inline-block mr-2">갑자기 떠나도</span>
                                <span className="text-blue-600 inline-block mr-2">1분이면</span>
                                <span className="inline-block">괜찮아</span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 font-medium tracking-normal break-keep mt-3">
                                소중한 사람들을 위한 마지막 센스, 미리 저장하는 안부인사
                            </p>
                        </motion.div>

                        {/* Core Feature (Card Input) - Larger Textarea */}
                        <div className="w-full space-y-5 animate-fade-in delay-75">
                            <div className="group relative">
                                {/* Glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-50 rounded-2xl blur opacity-20 transition duration-500"></div>

                                <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-lg">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">
                                        To.
                                    </label>
                                    <Textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="당신의 기억을 남겨주세요..."
                                        className="w-full min-h-40 text-base border-slate-200 focus:border-blue-400 rounded-xl resize-none transition-all"
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

            {/* Service Explanation Section */}
            <section className="relative z-10 w-full bg-white py-12 md:py-16 border-t border-slate-100">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-10 space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                            마음이 전달되는 과정
                        </h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            가장 안전하고 확실하게 당신의 메시지를 전달해드립니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center space-y-4 bg-slate-50 p-6 rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">
                                ✍️
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-500">STEP 01</div>
                                <h3 className="text-lg font-bold text-slate-900">기억 저장</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    소중한 사람에게 전하고 싶은 이야기, 사진, 영상을 미리 작성하세요.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center space-y-4 bg-slate-50 p-6 rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">
                                ⏰
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-500">STEP 02</div>
                                <h3 className="text-lg font-bold text-slate-900">자동 모니터링</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    정기적인 안부 확인을 통해 당신의 상태를 체크합니다.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center space-y-4 bg-slate-50 p-6 rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">
                                💌
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-500">STEP 03</div>
                                <h3 className="text-lg font-bold text-slate-900">마음 전달</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    필요한 순간, 당신의 메시지를 소중한 사람에게 안전하게 전달합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Online Memorial Section */}
            <section className="relative z-10 w-full bg-slate-50 py-16 md:py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-3">
                            NEW SERVICE
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            그리운 마음을 <span className="text-blue-600">온라인 추모관</span>에 남겨보세요
                        </h2>
                        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
                            시공간의 제약 없이, 언제 어디서나 고인을 추억할 수 있습니다.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Button
                            onClick={() => router.push('/space')}
                            size="lg"
                            className="h-14 px-8 text-lg bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xl transition-all"
                        >
                            기억 공간 입장하기
                        </Button>
                    </div>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="relative z-10 w-full bg-slate-900 text-white py-16 md:py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            남겨진 사람들에게 <span className="text-blue-400">가장 소중한 선물</span>이 됩니다
                        </h2>
                        <div className="w-16 h-1 bg-blue-500 rounded-full mx-auto mb-6"></div>
                        <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto">
                            AFTERM은 당신의 생애 데이터를 안전하게 보관하고, 지정된 시점에 소중한 사람들에게 전달합니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold mb-2">완벽한 보안</h3>
                            <p className="text-slate-400 text-sm">
                                모든 메시지는 암호화되어 안전하게 보관됩니다.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <div className="text-4xl mb-4">⏰</div>
                            <h3 className="text-xl font-bold mb-2">자동 전달</h3>
                            <p className="text-slate-400 text-sm">
                                지정된 시점에 자동으로 메시지가 전달됩니다.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <div className="text-4xl mb-4">💝</div>
                            <h3 className="text-xl font-bold mb-2">멀티미디어 지원</h3>
                            <p className="text-slate-400 text-sm">
                                텍스트, 사진, 영상 모두 저장 가능합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            <BottomNav />
        </div>
    );
}
