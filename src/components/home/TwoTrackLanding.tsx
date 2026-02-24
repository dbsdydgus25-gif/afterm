"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Search, Shield, Star } from "lucide-react";

export default function TwoTrackLanding() {
    const [showSplash, setShowSplash] = useState(true);
    const [hovered, setHovered] = useState<"a" | "b" | null>(null);

    useEffect(() => {
        const hasShown = sessionStorage.getItem("splash_shown_2");
        if (hasShown) {
            setShowSplash(false);
        } else {
            const t = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("splash_shown_2", "true");
            }, 1800);
            return () => clearTimeout(t);
        }
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Splash */}
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="text-center"
                        >
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-blue-600">
                                AFTERM
                            </h1>
                            <p className="mt-3 text-sm text-slate-400 font-medium tracking-widest">
                                삶의 이후를 준비합니다
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-5">
                    <span className="text-xl font-black tracking-tighter text-blue-600">AFTERM</span>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                            로그인
                        </Link>
                        <Link href="/manage" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-bold transition-colors">
                            시작하기
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <main className="pt-16 min-h-screen flex flex-col">
                {/* Title Section */}
                <div className="text-center px-5 pt-16 pb-10 md:pt-24 md:pb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.9, duration: 0.6 }}
                    >
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-wide">
                            🇰🇷 국내 최초 웰다잉 통합 플랫폼
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                            당신은 어떤 도움이<br />
                            <span className="text-blue-600">필요하신가요?</span>
                        </h2>
                        <p className="mt-4 text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                            두 가지 트랙 중 하나를 선택하세요.<br />
                            각각 최적화된 서비스를 제공합니다.
                        </p>
                    </motion.div>
                </div>

                {/* Two Track Cards */}
                <div className="flex-1 px-5 pb-16 max-w-4xl mx-auto w-full">
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.1, duration: 0.7 }}
                    >
                        {/* Card A - 생전 관리 */}
                        <Link href="/manage" className="block">
                            <motion.div
                                onHoverStart={() => setHovered("a")}
                                onHoverEnd={() => setHovered(null)}
                                whileTap={{ scale: 0.98 }}
                                className="relative overflow-hidden rounded-3xl p-7 md:p-8 min-h-[280px] md:min-h-[360px] flex flex-col justify-between cursor-pointer
                                    bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
                                    shadow-2xl shadow-blue-200 border border-blue-500/20
                                    transition-all duration-300 hover:shadow-blue-300 hover:-translate-y-1"
                            >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-2 block">Track A — 생전 준비</span>
                                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                                        개인 웰다잉<br />관리
                                    </h3>
                                </div>

                                <div className="relative z-10">
                                    <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6">
                                        안전한 금고에 나의 마지막 메시지와<br />
                                        데이터 유산을 보관하세요.
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {["유언 메시지", "디지털 유산", "AI 추모", "지인 전달"].map((tag) => (
                                            <span key={tag} className="text-[11px] bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-blue-200">무료로 시작하기</span>
                                        <motion.div
                                            animate={{ x: hovered === "a" ? 5 : 0 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <ArrowRight className="w-5 h-5 text-blue-600" />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>

                        {/* Card B - 사후 지원금 */}
                        <Link href="/estate" className="block">
                            <motion.div
                                onHoverStart={() => setHovered("b")}
                                onHoverEnd={() => setHovered(null)}
                                whileTap={{ scale: 0.98 }}
                                className="relative overflow-hidden rounded-3xl p-7 md:p-8 min-h-[280px] md:min-h-[360px] flex flex-col justify-between cursor-pointer
                                    bg-white border-2 border-slate-100
                                    shadow-xl shadow-slate-100
                                    transition-all duration-300 hover:border-blue-200 hover:shadow-blue-100 hover:-translate-y-1"
                            >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full -translate-y-1/2 translate-x-1/2" />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-5">
                                        <Search className="w-6 h-6 text-green-600" />
                                    </div>
                                    <span className="text-green-600 text-xs font-bold tracking-widest uppercase mb-2 block">Track B — 사후 청구</span>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-3">
                                        사망 환급금/<br />지원금 찾기
                                    </h3>
                                </div>

                                <div className="relative z-10">
                                    <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-5">
                                        사망진단서 한 장으로 유가족이 받을 수 있는
                                        <strong className="text-slate-800"> 숨은 지원금</strong>을 찾아드려요.
                                    </p>

                                    {/* Social proof */}
                                    <div className="bg-green-50 rounded-2xl p-3.5 mb-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-xs font-bold text-slate-700">평균 환급 예상액</span>
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <span className="text-2xl font-black text-green-700">240만원</span>
                                            <span className="text-xs text-slate-400 mb-1 font-medium">이상</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">국민연금·지자체 지원금·보험 환급 포함</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">지금 바로 무료 조회</span>
                                        <motion.div
                                            animate={{ x: hovered === "b" ? 5 : 0 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                            className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <ArrowRight className="w-5 h-5 text-white" />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        className="mt-10 flex flex-wrap items-center justify-center gap-6 text-slate-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5, duration: 0.6 }}
                    >
                        {[
                            { icon: "🔒", text: "보안 암호화 저장" },
                            { icon: "🏛️", text: "공공기관 데이터 연계" },
                            { icon: "📋", text: "전문 법무 검토" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-2">
                                <span className="text-base">{item.icon}</span>
                                <span className="text-xs font-medium">{item.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
