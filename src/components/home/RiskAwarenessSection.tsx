"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function RiskAwarenessSection() {
    const [counts, setCounts] = useState({
        accounts: 1420580,
        fees: 8940000000
    });

    // Live counter effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCounts(prev => ({
                accounts: prev.accounts + Math.floor(Math.random() * 3),
                fees: prev.fees + Math.floor(Math.random() * 15000)
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Format numbers
    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

    return (
        <section className="w-full bg-slate-900 py-12 md:py-20 px-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-blue-500 rounded-full blur-[80px] md:blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-indigo-500 rounded-full blur-[80px] md:blur-[128px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-24 items-center">

                {/* Left: Typography & Static Text */}
                <div className="space-y-6 md:space-y-8 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                            예고 없는 부재,<br />
                            <span className="text-slate-400 text-2xl md:text-4xl">남겨진 것들은 어떻게 될까요?</span>
                        </h2>
                    </motion.div>

                    <div className="flex items-center justify-center md:justify-start">
                        <div className="text-blue-400 text-2xl md:text-3xl font-bold leading-relaxed">
                            복잡한 디지털 자산의<br />
                            법적 절차와 정리
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
                        유가족이 접근하기 가장 어려운 영역입니다.
                        미리 정리하지 않으면 소중한 추억도, 금전적 가치도 영구히 소실될 수 있습니다.
                    </p>
                </div>

                {/* Right: Data Visualization */}
                <div className="space-y-6">
                    {/* Card 1: Abandoned Accounts */}
                    <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500 shadow-xl">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                            <AlertTriangle className="w-24 h-24 text-yellow-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/30">
                                <AlertTriangle className="w-3 h-3" /> Risk
                            </div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Digital Waste</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-4xl md:text-6xl font-mono text-white font-black tracking-tighter">
                                {formatNumber(counts.accounts)}
                            </div>
                            <div className="text-slate-500 text-sm font-medium">연간 방치되는 디지털 계정 수</div>
                        </div>
                    </div>

                    {/* Card 2: Wasted Fees */}
                    <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition-all duration-500 shadow-xl">
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/30">
                                <AlertTriangle className="w-3 h-3" /> Risk
                            </div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Financial Loss</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl md:text-5xl font-mono text-white font-black tracking-tighter flex items-baseline gap-2">
                                <span className="text-xl md:text-2xl text-slate-500 font-normal underline decoration-red-500/50 decoration-2">₩</span>
                                {formatNumber(counts.fees)}
                            </div>
                            <div className="text-slate-500 text-sm font-medium">주인 없이 결제되는 연간 구독료</div>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-4 italic">
                            * 2024년 국내 디지털 유산 및 휴면 계정 관련 추산치
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
