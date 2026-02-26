"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { HeroPill } from "@/components/ui/hero-pill";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RiskAwarenessSection } from "@/components/home/RiskAwarenessSection";
import { NewsSection } from "@/components/home/NewsSection";
import { FloatingKakaoButton } from "@/components/common/FloatingKakaoButton";
import { Mail, Send, ArrowRight } from "lucide-react";

// 래디풀 아이콘 데이터
const FLOATING_ICONS = [
    { id: 1, emoji: "📧", x: "6%", y: "18%", d: 3.8 },
    { id: 2, emoji: "💳", x: "14%", y: "68%", d: 5.2 },
    { id: 3, emoji: "☁️", x: "22%", y: "35%", d: 4.5 },
    { id: 4, emoji: "🎬", x: "80%", y: "22%", d: 3.5 },
    { id: 5, emoji: "🔐", x: "88%", y: "62%", d: 5.0 },
    { id: 6, emoji: "💌", x: "72%", y: "42%", d: 4.2 },
    { id: 7, emoji: "📱", x: "4%", y: "52%", d: 4.8 },
    { id: 8, emoji: "🎵", x: "90%", y: "82%", d: 3.9 },
    { id: 9, emoji: "🗂️", x: "35%", y: "82%", d: 4.3 },
    { id: 10, emoji: "🌐", x: "62%", y: "12%", d: 5.1 },
    // 서비스 로고 (텍스트 기반)
    { id: 11, emoji: "N", x: "18%", y: "12%", d: 4.4, isText: true, color: "#03C75A" },
    { id: 12, emoji: "G", x: "48%", y: "88%", d: 3.7, isText: true, color: "#EA4335" },
    { id: 13, emoji: "Y", x: "82%", y: "44%", d: 4.9, isText: true, color: "#FF0000" },
];

// Placeholder 롤링 데이터
const PLACEHOLDERS = [
    "나의 디지털 유산 찾고 관리해줘",
    "내 유언장 작성해줘",
    "내 구독 중인 서비스 목록 알려줘",
    "소중한 사람엔게 남길 메시지 써줘",
];


export default function HomePageClient() {
    const router = useRouter();
    const { user, plan } = useMemoryStore();

    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [targetPlan, setTargetPlan] = useState<"free" | "pro">("pro");
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // 타이핑 후킹 멘트 상태
    const HOOK_TEXTS = ["나의 웰다잉 관리는", "나의 디지털 유산 확인", "나의 메시지, 데이터 관리", "나의 이후를 준비하는 것"];
    const [hookIdx, setHookIdx] = useState(0);
    const [hookCharIdx, setHookCharIdx] = useState(0);
    const [hookDeleting, setHookDeleting] = useState(false);
    const [hookText, setHookText] = useState("");

    // 타이핑 효과
    useEffect(() => {
        const current = HOOK_TEXTS[hookIdx];
        let t: NodeJS.Timeout;
        if (!hookDeleting && hookCharIdx < current.length) {
            t = setTimeout(() => { setHookText(current.slice(0, hookCharIdx + 1)); setHookCharIdx(c => c + 1); }, 80);
        } else if (!hookDeleting && hookCharIdx === current.length) {
            t = setTimeout(() => setHookDeleting(true), 1800);
        } else if (hookDeleting && hookCharIdx > 0) {
            t = setTimeout(() => { setHookText(current.slice(0, hookCharIdx - 1)); setHookCharIdx(c => c - 1); }, 40);
        } else if (hookDeleting && hookCharIdx === 0) {
            setHookDeleting(false);
            setHookIdx(i => (i + 1) % HOOK_TEXTS.length);
        }
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hookCharIdx, hookDeleting, hookIdx]);

    // Placeholder 롤링
    useEffect(() => {
        const iv = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3000);
        return () => clearInterval(iv);
    }, []);


    const handleSubscribe = (planName: "Standard" | "Pro", price: string) => {
        if (!user) { router.push('/login?returnTo=/'); return; }
        const newPlan = planName === "Pro" ? "pro" : "free";
        setTargetPlan(newPlan);
        router.push('/plans');
    };

    // AI 입력 제출 핸들러 → 로그인 체크 후 /ai-assistant로
    const handleAiSubmit = () => {
        const trimmed = inputValue.trim();
        if (trimmed.length < 10) { setInputError("최소 10자 이상 입력해주세요."); return; }
        if (trimmed.length > 100) { setInputError("최대 100자입니다."); return; }
        setInputError("");

        if (!user) {
            // 로그인 페이지로 이동, 돌아온 후 메시지를 복원하기 위해 pending 파라미터 전달
            router.push(`/login?returnTo=/ai-assistant&pending=${encodeURIComponent(trimmed)}`);
            return;
        }
        router.push(`/ai-assistant?q=${encodeURIComponent(trimmed)}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSubmit(); }
    };

    return (
        <div className="flex flex-col min-h-screen font-sans relative">

            {/* Header */}
            <Header transparentOnTop={false} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center w-full relative">
                {/* Background - Soft Dynamic Blur Effect */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute top-40 -right-20 w-[30rem] h-[30rem] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
                </div>

                {/* ══════════════════════════════════════════════
                    BLOCK 1: AI 유산 어시스턴트 (타이핑 후킹 + 입력창)
                ════════════════════════════════════════════════ */}
                <section className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
                    {/* 플로팅 아이콘 - Block 1 전용 (min-h-screen 내 퍼센트 좌표) */}
                    {FLOATING_ICONS.map((icon) => (
                        <motion.div
                            key={icon.id}
                            className="absolute pointer-events-none hidden sm:block"
                            style={{ left: icon.x, top: icon.y }}
                            animate={{ y: [0, -12, 0], opacity: [0.35, 0.65, 0.35] }}
                            transition={{ duration: icon.d, repeat: Infinity, ease: "easeInOut", delay: icon.id * 0.3 }}
                        >
                            {(icon as { isText?: boolean }).isText ? (
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg"
                                    style={{ backgroundColor: (icon as { color?: string }).color }}
                                >
                                    {icon.emoji}
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-lg border border-slate-100">
                                    {icon.emoji}
                                </div>
                            )}
                        </motion.div>
                    ))}

                    <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center gap-8 text-center">
                        {/* 타이핑 후킹 멘트 */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="h-14 sm:h-16 flex items-center justify-center w-full">
                                <span className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                    {hookText}
                                    <span className="inline-block w-0.5 h-8 sm:h-11 bg-blue-600 ml-1 animate-pulse align-middle" />
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">AFTERM AI와 함께 시작해보세요</p>
                        </motion.div>

                        {/* 프롬프트 입력 창 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="w-full"
                        >
                            <div className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/70 border-2 transition-all duration-200 ${inputError ? "border-red-400" : "border-slate-200 focus-within:border-blue-400 focus-within:shadow-blue-100/60"
                                }`}>
                                {/* Placeholder 롤링 */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={placeholderIdx}
                                        className="absolute left-4 top-4 pointer-events-none text-slate-300 text-sm font-medium"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: inputValue ? 0 : 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        예: {PLACEHOLDERS[placeholderIdx]}
                                    </motion.div>
                                </AnimatePresence>
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                                    onKeyDown={handleKeyDown}
                                    rows={3}
                                    maxLength={100}
                                    className="w-full pt-5 pb-14 px-4 bg-transparent text-slate-900 text-sm resize-none focus:outline-none placeholder-transparent"
                                    placeholder=" "
                                />
                                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3">
                                    <span className={`text-xs font-medium ${inputValue.length > 0 && inputValue.length < 10 ? "text-amber-500" : "text-slate-300"
                                        }`}>
                                        {inputValue.length}/100{inputValue.length > 0 && inputValue.length < 10 && " (최소 10자)"}
                                    </span>
                                    <button
                                        onClick={handleAiSubmit}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${inputValue.trim().length >= 10
                                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 hover:-translate-y-0.5"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        AI로 시작하기
                                    </button>
                                </div>
                            </div>
                            {inputError && <p className="mt-2 text-center text-xs text-red-500">{inputError}</p>}

                            {/* 하단 배지 */}
                            <div className="flex flex-wrap gap-2 justify-center mt-5">
                                {[
                                    { icon: "⚡", text: "1분이면 내 디지털 유산을 확인할 수 있어요" },
                                    { icon: "✨", text: "깔끔하게 정리하는 내 유산" },
                                    { icon: "📱", text: "모바일도 가능해요" },
                                ].map((b, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-slate-200 rounded-full text-[11px] font-semibold text-blue-600 shadow-sm whitespace-nowrap">
                                        <span>{b.icon}</span>{b.text}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════
                    BLOCK 2: 1분이면 괜찮아 + 메시지 남기기 / 데이터 유산
                ════════════════════════════════════════════════ */}
                <section className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 py-20 bg-white border-t border-slate-100">
                    <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center gap-10">
                        {/* 프로모 배너 */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            onClick={() => router.push('/plans')}
                            className="cursor-pointer"
                        >
                            <HeroPill
                                href="/plans"
                                label="PRO 플랜 3개월 무료 체험!"
                                announcement="🎉 오픈 기념"
                                className="shadow-sm hover:shadow-md transition-shadow bg-blue-50/50 backdrop-blur-sm border border-blue-200/50"
                            />
                        </motion.div>

                        {/* 타이틀 */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="space-y-4"
                        >
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.2] break-keep drop-shadow-sm">
                                <span className="block mb-2 md:mb-3 text-slate-800">갑자기 떠나도</span>
                                <span className="text-blue-600 inline-block relative">
                                    1분이면
                                    <svg className="absolute w-[110%] h-3 sm:h-4 -bottom-1 -left-[5%] text-blue-300/40" viewBox="0 0 100 20" preserveAspectRatio="none">
                                        <path d="M0 15 Q 50 20 100 5 L 100 20 L 0 20 Z" fill="currentColor" />
                                    </svg>
                                </span>{" "}
                                <span className="inline-block relative z-10">괜찮아</span>
                            </h2>
                            <p className="text-sm sm:text-lg text-slate-500 font-medium tracking-normal break-keep max-w-lg">
                                소중한 사람들을 위한 마지막 센스,<br className="hidden sm:block" /> 미리 저장하는 특별한 안부인사
                            </p>
                        </motion.div>

                        {/* 2버튼: 메시지 남기기 + 데이터 유산 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="w-full"
                        >
                            <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-[480px] mx-auto">
                                {/* 메시지 남기기 */}
                                <button
                                    onClick={() => router.push('/create')}
                                    className="group relative bg-white/80 backdrop-blur-md p-5 md:p-8 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex flex-col items-center text-center space-y-3 md:space-y-4">
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-100/80 to-blue-50/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-blue-100/50">
                                            <span className="text-2xl md:text-4xl">💌</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm md:text-xl font-bold text-slate-800 tracking-tight mb-1 md:mb-2">메시지 남기기</h3>
                                            <p className="text-[10px] md:text-sm text-slate-500 leading-relaxed max-w-[120px] md:max-w-[160px] mx-auto hidden sm:block">소중한 마음을 전하세요</p>
                                        </div>
                                    </div>
                                </button>

                                {/* 디지털 유산 */}
                                <button
                                    onClick={() => router.push('/vault/create')}
                                    className="group relative bg-white/80 backdrop-blur-md p-5 md:p-8 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex flex-col items-center text-center space-y-3 md:space-y-4">
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-100/80 to-emerald-50/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100/50">
                                            <span className="text-2xl md:text-4xl">🔐</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm md:text-xl font-bold text-slate-800 tracking-tight mb-1 md:mb-2">디지털 유산</h3>
                                            <p className="text-[10px] md:text-sm text-slate-500 leading-relaxed max-w-[120px] md:max-w-[160px] mx-auto hidden sm:block">계정 정보를 보관하세요</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

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
                                    <span className="text-5xl font-black text-slate-900">{billingCycle === 'monthly' ? '100원' : '1,000원'}</span>
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
                                        onClick={() => handleSubscribe("Pro", billingCycle === 'monthly' ? "100원" : "1,000원")}
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
                                메시지 남기기
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

            </div>

            <Footer />
            <FloatingKakaoButton />
        </div >
    );
}

