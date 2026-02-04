"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function RiskAwarenessSection() {
    const [counts, setCounts] = useState({
        accounts: 1420580,
        fees: 8940000000
    });

    // Carousel state
    const targets = ["1인 가구", "고위험군", "환우분들"];
    const [targetIndex, setTargetIndex] = useState(0);

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

    // Carousel interval
    useEffect(() => {
        const interval = setInterval(() => {
            setTargetIndex(prev => (prev + 1) % targets.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Format numbers
    const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

    return (
        <section className="w-full bg-slate-900 py-20 px-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">

                {/* Left: Typography & Carousel */}
                <div className="space-y-8 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-4">
                            예고 없는 부재,<br />
                            <span className="text-slate-400 text-2xl md:text-4xl">남겨진 것들은 어떻게 될까요?</span>
                        </h2>
                    </motion.div>

                    <div className="h-16 flex items-center justify-center md:justify-start">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={targetIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-blue-400 text-2xl md:text-3xl font-bold"
                            >
                                {targets[targetIndex]}에게 꼭 필요합니다
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
                        디지털 자산은 법적 절차가 복잡하여 유가족이 접근하기 가장 어려운 영역입니다.
                        미리 정리하지 않으면 소중한 추억도, 금전적 가치도 영구히 소실될 수 있습니다.
                    </p>
                </div>

                {/* Right: Data Visualization */}
                <div className="space-y-6">
                    {/* Card 1: Abandoned Accounts */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                            <AlertTriangle className="w-16 h-16 text-yellow-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                <AlertTriangle className="w-3 h-3" /> Risk
                            </span>
                            <span className="text-slate-400 text-sm">연간 방치되는 디지털 계정</span>
                        </div>
                        <div className="text-4xl md:text-5xl font-mono text-white font-bold tracking-tight">
                            {formatNumber(counts.accounts)}
                            <span className="text-lg text-slate-500 ml-2 font-sans font-normal">건 +</span>
                        </div>
                    </div>

                    {/* Card 2: Wasted Fees */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                <AlertTriangle className="w-3 h-3" /> Risk
                            </span>
                            <span className="text-slate-400 text-sm">주인 없이 결제되는 구독료</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-mono text-white font-bold tracking-tight">
                            ₩ {formatNumber(counts.fees)}
                            <span className="text-lg text-slate-500 ml-2 font-sans font-normal">원 +</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-right">
                            * 2024년 국내 디지털 유산 관련 추산치
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
