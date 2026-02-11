"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { RiskAwarenessSection } from "@/components/home/RiskAwarenessSection";
import { NewsSection } from "@/components/home/NewsSection";
import { FloatingKakaoButton } from "@/components/common/FloatingKakaoButton";

export default function HomePageClient() {
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const { user, plan } = useMemoryStore();

    // States for service sections
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [targetPlan, setTargetPlan] = useState<"free" | "pro">("pro");

    const handleSubscribe = (planName: "Standard" | "Pro", price: string) => {
        if (!user) {
            router.push('/login?returnTo=/');
            return;
        }
        const newPlan = planName === "Pro" ? "pro" : "free";
        setTargetPlan(newPlan);
        router.push('/plans');
    };

    useEffect(() => {
        const hasShownSplash = sessionStorage.getItem('splash_shown');

        if (hasShownSplash) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowSplash(false);
        } else {
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem('splash_shown', 'true');
            }, 2000); // 2 seconds splash
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen font-sans relative">

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
            <Header transparentOnTop={false} />

            {/* Main Content */}
            <motion.div
                className="flex-1 flex flex-col items-center w-full relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: showSplash ? 0 : 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Background (Static Blue) - Full Screen */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
                    {/* Optimized: removed backdrop-blur for mobile performance */}
                    <div className="absolute inset-0 bg-white/40 z-0 pointer-events-none"></div>
                </div>

                {/* 1. Hero Content (Centered) - Optimized Spacing */}
                <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center justify-center px-6 pt-52 md:pt-40 pb-52 md:pb-20 text-center space-y-6 md:space-y-10 min-h-[85vh] md:min-h-screen">
                    {/* Typography */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
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
                            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 leading-snug break-keep drop-shadow-sm whitespace-nowrap">
                                <span className="inline-block mr-1">갑자기 떠나도</span>
                                <span className="text-blue-600 inline-block mr-1">1분이면</span>
                                <span className="inline-block">괜찮아</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-normal break-keep inline-block mt-2">
                                소중한 사람들을 위한 마지막 센스, 미리 저장하는 안부인사
                            </p>
                        </motion.div>

                        {/* Core Feature - Two Options */}
                        <div className="w-full space-y-4 animate-fade-in delay-75">
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                {/* Option 1: Memory Message */}
                                <button
                                    onClick={() => router.push('/create')}
                                    className="group relative bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 active:scale-[0.98]"
                                >
                                    <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                            <span className="text-xl md:text-2xl">💌</span>
                                        </div>
                                        <h3 className="text-sm md:text-lg font-bold text-slate-900">
                                            기억 남기기
                                        </h3>
                                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed hidden md:block">
                                            소중한 사람들에게<br />전할 마음을 남겨보세요
                                        </p>
                                    </div>
                                </button>

                                {/* Option 2: Digital Vault */}
                                <button
                                    onClick={() => router.push('/vault/create')}
                                    className="group relative bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-slate-200 hover:border-emerald-400 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 active:scale-[0.98]"
                                >
                                    <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                            <span className="text-xl md:text-2xl">🔐</span>
                                        </div>
                                        <h3 className="text-sm md:text-lg font-bold text-slate-900">
                                            디지털 유산
                                        </h3>
                                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed hidden md:block">
                                            계정 정보를 안전하게<br />보관하고 전달하세요
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Left Behind Section (Gift) */}
                <section className="w-full bg-slate-900 text-white py-12 md:py-32 overflow-hidden relative">
                    <div className="hidden md:block absolute top-0 right-0 w-1/2 h-full bg-blue-900/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-center">

                            {/* Text Content */}
                            <div className="md:col-span-5 space-y-8 md:space-y-10 text-left">
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="space-y-4 md:space-y-6"
                                >
                                    <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
                                        남겨진 사람들에게<br />
                                        <span className="text-blue-400">가장 소중한 선물</span>이<br />
                                        됩니다.
                                    </h2>
                                    <div className="w-16 h-1.5 bg-blue-500 rounded-full"></div>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                                    className="text-[13px] md:text-lg text-slate-400 leading-snug md:leading-relaxed break-keep"
                                >
                                    AFTERM(에프텀)은 당신의 생애 데이터를 안전하게 보관하고,<br className="block md:hidden" />
                                    지정된 시점에 소중한 사람들에게 전달합니다.
                                </motion.p>
                            </div>

                            {/* Visual Mockups */}
                            <div className="md:col-span-7 relative flex justify-center md:justify-end perspective-1000">
                                <div className="relative w-full max-w-md">
                                    <div className="hidden md:block absolute -inset-10 bg-blue-500/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>

                                    <div className="grid gap-6">
                                        {/* Card 1 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                            className="bg-slate-800/80 border border-slate-700/50 p-6 rounded-2xl md:w-[90%] md:translate-x-0 transform transition shadow-xl"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl">🎉</div>
                                                    <div>
                                                        <span className="block text-xs text-indigo-400 mb-0.5">To. 친구들에게</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed pl-3 border-l-2 border-slate-700">
                                                &quot;내 장례식은 파티였음 좋겠음, 클럽 노래 틀고 즐기다가 가~&quot;
                                            </p>
                                        </motion.div>

                                        {/* Card 2 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                                            className="bg-slate-800/95 border border-blue-500/30 p-8 rounded-2xl md:w-[105%] md:-translate-x-8 transform transition z-10 shadow-xl"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">📺</div>
                                                    <div>
                                                        <span className="block text-sm text-blue-400/80 mb-0.5">To. 내 동생</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-blue-50 text-base leading-relaxed pl-3 border-l-2 border-slate-700">
                                                &quot;이번 생 재밌었다 넷플, 티빙 계정 남긴다. 나머지는 너가 내 ^^&quot;
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. How It Works Section */}
                <section className="w-full bg-white py-12 md:py-24 border-b border-slate-100 relative z-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-xs font-bold tracking-wide">HOW IT WORKS</span>
                            <h2 className="text-xl md:text-4xl font-bold text-slate-900 leading-tight">
                                마음이 전달되는 과정
                            </h2>
                            <p className="text-slate-500 text-[11px] md:text-lg leading-normal md:leading-relaxed tracking-tighter w-full">
                                가장 안전하고 확실하게 당신의 메시지를 전달해드립니다.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10"></div>

                            {/* Step 1 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center text-center space-y-6 bg-white p-6 rounded-3xl"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center text-4xl shadow-lg shadow-blue-100 mb-2 relative group hover:scale-105 transition-transform duration-300">
                                    <span className="relative z-10">✍️</span>
                                    <div className="absolute inset-0 bg-blue-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 mb-1">STEP 01</div>
                                    <h3 className="text-xl font-bold text-slate-900">기억 저장</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        소중한 사람에게 전하고 싶은 이야기,<br />
                                        사진, 영상을 미리 작성하세요.<br />
                                        모든 데이터는 암호화되어 안전하게 저장됩니다.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Step 2 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="flex flex-col items-center text-center space-y-6 bg-white p-6 rounded-3xl"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-4xl shadow-lg shadow-indigo-100 mb-2 relative group hover:scale-105 transition-transform duration-300">
                                    <span className="relative z-10">🔒</span>
                                    <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 mb-1">STEP 02</div>
                                    <h3 className="text-xl font-bold text-slate-900">안전 보관</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        당신이 지정한 순간이 올 때까지<br />
                                        메시지는 철저히 비공개로 보관됩니다.<br />
                                        클라우드 서버에서 영구적으로 관리됩니다.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Step 3 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="flex flex-col items-center text-center space-y-6 bg-white p-6 rounded-3xl"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-amber-50 flex items-center justify-center text-4xl shadow-lg shadow-amber-100 mb-2 relative group hover:scale-105 transition-transform duration-300">
                                    <span className="relative z-10">📬</span>
                                    <div className="absolute inset-0 bg-amber-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 mb-1">STEP 03</div>
                                    <h3 className="text-xl font-bold text-slate-900">전달 및 열람</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        지정된 시점에 수신인에게 알림이 전송됩니다.<br />
                                        수신인은 본인 인증(휴대폰)을 거친 후<br />
                                        당신의 메시지를 열람할 수 있습니다.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 4. Unexpected Absence (Risk Awareness) */}
                <div className="bg-slate-900 w-full">
                    <RiskAwarenessSection />
                </div>

                {/* 5. 5. Well-dying Trends (News Section) */}
                <NewsSection />

                {/* 6. Online Memorial Section */}
                <section className="w-full bg-slate-100/50 py-16 md:py-24 relative overflow-hidden z-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent opacity-60"></div>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.8 }}
                                className="order-2 md:order-1 relative"
                            >
                                {/* Mockup / Visual */}
                                <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                            <img src="https://api.dicebear.com/9.x/adventurer/svg?seed=Grandma" alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">보고싶은 할머니</div>
                                            <div className="text-xs text-slate-500">2024.12.25 영면</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-xl rounded-tl-none">
                                            <p className="text-slate-600 text-sm leading-relaxed">
                                                &quot;할머니, 오늘 첫눈이 왔어요. 할머니가 좋아하시던 군고구마 냄새가 나니까 더 보고싶네요.. 사랑해요.&quot;
                                            </p>
                                            <div className="mt-2 text-xs text-slate-400 font-medium">손녀 지민이가</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                                        <Link href="/space" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                            디지털 추모관 입장하기 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                        </Link>
                                    </div>
                                </div>
                                {/* Decorative Elements */}
                                <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="order-1 md:order-2 space-y-8"
                            >
                                <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide">
                                    NEW SERVICE
                                </div>
                                <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                                    그리운 마음을<br />
                                    <span className="text-blue-600">온라인 추모관</span>에 남겨보세요.
                                </h2>
                                <p className="text-[11px] md:text-lg text-slate-500 leading-normal md:leading-relaxed tracking-tighter w-full">
                                    시공간의 제약 없이, 언제 어디서나 고인을 추억할 수 있습니다.<br />
                                    소중한 분을 위한 디지털 공간을 만들고, 가족 친지들과 함께<br />
                                    따뜻한 메시지를 나누세요.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={() => window.open('/space', '_blank')}
                                        size="lg"
                                        className="px-8 h-14 text-lg bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                                    >
                                        디지털 추모관 입장하기
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 7. Plans Section */}
                <section className="w-full bg-slate-50 py-16 md:py-24 relative z-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="mb-10 md:mb-16 space-y-4"
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-sm font-bold tracking-wide mb-2">PRICING</span>
                            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                                당신을 위한 최적의 플랜을 선택하세요.
                            </h2>
                            <p className="text-slate-500 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed break-keep">
                                에프텀은 당신의 소중한 메시지를 안전하게 보관하고, 지정된 시점에 전달합니다.
                            </p>
                        </motion.div>

                        {/* Billing Cycle Toggle */}
                        <div className="flex justify-center mb-16">
                            <div className="bg-white p-1 rounded-full inline-flex relative border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setBillingCycle("monthly")}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === "monthly"
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-900"
                                        }`}
                                >
                                    월간 결제
                                </button>
                                <button
                                    onClick={() => setBillingCycle("yearly")}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === "yearly"
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-900"
                                        }`}
                                >
                                    연간 결제
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${billingCycle === 'yearly' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                                        17%
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                            {/* Basic Plan */}
                            <div className="rounded-3xl p-10 border border-slate-200 bg-white relative hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Basic</h3>
                                <div className="text-4xl font-black text-slate-900 mb-8">무료</div>

                                <ul className="space-y-4 mb-10 w-full max-w-xs text-left mx-auto">
                                    <li className="flex items-center gap-3 text-slate-600 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center flex-shrink-0">✓</div>
                                        메시지 전송: 딱 1개 전송
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center flex-shrink-0">✓</div>
                                        저장공간: 10mb (텍스트 위주)
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center flex-shrink-0">✓</div>
                                        디지털 유산: 1개 보관
                                    </li>
                                </ul>

                                <div className="w-full mt-auto">
                                    <Button
                                        onClick={() => router.push('/plans')}
                                        className="w-full py-7 rounded-xl text-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold shadow-sm"
                                    >
                                        {plan === 'free' ? "현재 이용 중" : "Basic으로 변경"}
                                    </Button>
                                </div>
                            </div>

                            {/* Pro Plan */}
                            <div className="rounded-3xl p-10 border-2 border-blue-500/20 bg-blue-50/30 relative hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center transform md:-translate-y-4">
                                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 rounded-bl-xl rounded-tr-2xl text-sm font-bold">Popular</div>

                                {/* Promo Badge */}
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg animate-bounce whitespace-nowrap z-10 rotate-[-2deg]">
                                    🎁 3개월 무료 체험 진행 중!
                                </div>

                                <h3 className="text-2xl font-bold text-blue-900 mb-2">PRO</h3>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-5xl font-black text-slate-900">{billingCycle === 'monthly' ? '990원' : '9,900원'}</span>
                                    <span className="text-slate-500 font-medium text-lg">/{billingCycle === 'monthly' ? '월' : '년'}</span>
                                </div>

                                <ul className="space-y-4 mb-10 w-full max-w-xs text-left mx-auto">
                                    <li className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs text-center flex-shrink-0">✓</div>
                                        메시지 전송: 최대 100개
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs text-center flex-shrink-0">✓</div>
                                        저장공간: 1GB (사진, 영상, 음성)
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs text-center flex-shrink-0">✓</div>
                                        디지털 유산: 10개 보관
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs text-center flex-shrink-0">✓</div>
                                        발송 날짜 지정 가능
                                    </li>
                                </ul>

                                <div className="w-full mt-auto">
                                    <Button
                                        onClick={() => handleSubscribe("Pro", billingCycle === 'monthly' ? "990원" : "9,900원")}
                                        disabled={plan === 'pro'}
                                        className="w-full py-7 rounded-xl text-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20"
                                    >
                                        {plan === 'pro' ? "이미 이용 중입니다" : "3개월 무료 체험 시작하기"}
                                    </Button>
                                    <p className="mt-3 text-xs text-slate-500 font-medium">
                                        * 언제든지 해지 가능합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 8. Final CTA Section */}
                <section className="w-full bg-white py-16 md:py-24 px-6 text-center border-t border-slate-100 relative z-10">
                    <div className="max-w-3xl mx-auto space-y-10">
                        <h2
                            className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight"
                        >
                            당신의 이후를 위해<br />준비합니다.
                        </h2>
                        <div
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Button
                                onClick={() => router.push('/create')}
                                size="lg"
                                className="px-10 h-16 text-xl bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                            >
                                기억 남기기
                            </Button>
                            <Button
                                onClick={() => router.push('/vault/create')}
                                variant="outline"
                                size="lg"
                                className="px-10 h-16 text-xl border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-2xl"
                            >
                                디지털 유산 보관
                            </Button>
                        </div>
                    </div>
                </section>

            </motion.div>

            <Footer />
            <BottomNav />
            <FloatingKakaoButton />
        </div >
    );
}

