"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { PlanConfirmModal } from "@/components/payment/PlanConfirmModal";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PlansPageClient() {
    const router = useRouter();
    const { plan, billingCycle: currentBillingCycle } = useMemoryStore();
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [targetPlan, setTargetPlan] = useState<"free" | "pro">("pro");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [remainingDays, setRemainingDays] = useState<number | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();

    const handleSubscribe = async (planName: string, price: string) => {
        const newPlan = planName === "Pro" ? "pro" : "free";
        setTargetPlan(newPlan);
        setIsPlanModalOpen(true);
    };

    const handlePlanChange = async () => {
        try {
            const res = await fetch('/api/plan/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetPlan, billingCycle })
            });

            const data = await res.json();
            if (data.success) {
                if (data.cancelled) {
                    setRemainingDays(data.remainingDays);
                    setEndDate(data.endDate);
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert(data.message);
                    window.location.reload();
                }
            } else {
                alert(data.error || "플랜 변경 중 오류가 발생했습니다.");
            }
        } catch (error) {
            alert("플랜 변경 중 오류가 발생했습니다.");
        }
    };

    const isPro = plan === 'pro';

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />

            {/* TOP FIXED BANNER for 3-MONTH PROMO */}
            <div className="fixed top-20 left-0 w-full bg-indigo-600 text-white z-40 py-2 shadow-md animate-slide-down">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs md:text-sm font-bold flex items-center justify-center gap-2">
                    <span>🎉 오픈 기념 PRO 3개월 무료!</span>
                    <span className="bg-white text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">Limited</span>
                </div>
            </div>

            <main className="pt-36 pb-20 px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="mb-12 space-y-3">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-wide mb-2">PRICING</span>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        최적의 플랜을 선택하세요<br className="sm:hidden" />
                    </h1>
                    <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
                        소중한 메시지를 안전하게 보관하고 전달합니다.
                    </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-slate-100 p-1 rounded-full inline-flex relative">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${billingCycle === "monthly"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            월간 결제
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${billingCycle === "yearly"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            연간 결제
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                17%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Basic Plan */}
                    <div className="rounded-2xl p-6 border border-slate-200 bg-white relative hover:shadow-lg transition-all duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Basic</h3>
                        <div className="text-3xl font-extrabold text-slate-900 mb-4">무료</div>
                        <ul className="space-y-3 mb-6 text-left pl-2">
                            <li className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] text-center">✓</span>
                                메시지 전송: 딱 1개 전송
                            </li>
                            <li className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] text-center">✓</span>
                                디지털 유산: 1개
                            </li>
                            <li className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] text-center">✓</span>
                                저장공간: 10mb (텍스트 위주)
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSubscribe("Basic", "무료")}
                            disabled={!isPro}
                            className="w-full py-5 rounded-lg text-sm bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 font-bold shadow-sm disabled:opacity-50"
                        >
                            {!isPro ? "현재 이용 중" : "Basic으로 변경"}
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-2xl p-6 border border-blue-100 bg-blue-50/50 relative hover:shadow-xl transition-all duration-300 transform md:-translate-y-2">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-2xl text-xs font-bold">Popular</div>

                        {/* PROMO POPUP BADGE */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="absolute -top-4 -left-2 md:-left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-lg shadow-lg rotate-[-10deg] z-20"
                        >
                            <p className="text-xs font-bold">🎁 3개월 무료!</p>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-500 rotate-45"></div>
                        </motion.div>

                        <div className="relative mb-1 inline-block">
                            <h3 className="text-lg font-bold text-blue-900">PRO</h3>
                            {billingCycle === "yearly" && (
                                <span className="absolute -top-2 -right-16 bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-bounce-subtle">
                                    17% SAVE
                                </span>
                            )}
                        </div>

                        {billingCycle === "monthly" ? (
                            <div className="text-3xl font-extrabold text-slate-900 mb-4">
                                100원 <span className="text-xs font-normal text-slate-500">/ 월</span>
                            </div>
                        ) : (
                            <div className="text-3xl font-extrabold text-slate-900 mb-4">
                                1,000원 <span className="text-xs font-normal text-slate-500">/ 년</span>
                            </div>
                        )}
                        <ul className="space-y-3 mb-6 text-left pl-2">
                            <li className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] text-center">✓</span>
                                메시지 전송: 최대 100개
                            </li>
                            <li className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] text-center">✓</span>
                                디지털 유산: 10개
                            </li>
                            <li className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] text-center">✓</span>
                                저장공간: 1GB (사진, 영상, 음성)
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSubscribe("Pro", billingCycle === "monthly" ? "100원" : "1,000원")}
                            disabled={isPro && currentBillingCycle === billingCycle}
                            className="w-full py-5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {!isPro
                                ? "3개월 무료 체험 시작하기"
                                : currentBillingCycle === billingCycle
                                    ? "현재 이용 중"
                                    : billingCycle === "yearly"
                                        ? "연간 플랜으로 변경"
                                        : "월간 플랜으로 변경"
                            }
                        </Button>
                    </div>
                </div>
            </main>

            <PlanConfirmModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                targetPlan={targetPlan}
                billingCycle={billingCycle}
                currentPlan={plan === 'pro' ? 'pro' : 'free'}
                remainingDays={remainingDays}
                endDate={endDate}
                onConfirm={handlePlanChange}
            />
        </div>
    );
}
