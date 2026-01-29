"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { PlanConfirmModal } from "@/components/payment/PlanConfirmModal";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PlansPage() {
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
                <div className="max-w-7xl mx-auto px-4 text-center text-sm md:text-base font-bold flex items-center justify-center gap-2">
                    <span>🎉 오픈 기념 특별 이벤트! 지금 시작하면 PRO 플랜 3개월 무료 증정</span>
                    <span className="bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full animate-pulse">Limited</span>
                </div>
            </div>

            <main className="pt-40 pb-20 px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="mb-16 space-y-4">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide mb-2">PRICING</span>
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        당신을 위한 최적의 플랜을 선택하세요.<br className="sm:hidden" />
                    </h1>
                    <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
                        에프텀은 당신의 소중한 메시지를 안전하게 보관하고,
                        지정된 시점에 전달합니다.
                    </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="bg-slate-100 p-1 rounded-full inline-flex relative">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === "monthly"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            월간 결제
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === "yearly"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Basic Plan */}
                    <div className="rounded-3xl p-8 border border-slate-200 bg-white relative hover:shadow-xl transition-all duration-300">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Basic</h3>
                        <div className="text-4xl font-extrabold text-slate-900 mb-6">무료</div>
                        <ul className="space-y-4 mb-8 text-left pl-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs text-center">✓</span>
                                메시지 전송: 딱 1개 전송
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs text-center">✓</span>
                                저장공간: 10mb (텍스트 위주)
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSubscribe("Basic", "무료")}
                            disabled={!isPro}
                            className="w-full py-6 rounded-xl text-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 font-bold shadow-sm disabled:opacity-50"
                        >
                            {!isPro ? "현재 이용 중" : "Basic으로 변경"}
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-3xl p-8 border border-blue-100 bg-blue-50/50 relative hover:shadow-2xl transition-all duration-300 transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-3xl text-sm font-bold">Popular</div>

                        {/* PROMO POPUP BADGE */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="absolute -top-6 -left-4 md:-left-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg shadow-lg rotate-[-10deg] z-20"
                        >
                            <p className="text-sm font-bold">🎁 3개월 무료 체험 진행 중!</p>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-500 rotate-45"></div>
                        </motion.div>

                        <div className="relative mb-2 inline-block">
                            <h3 className="text-2xl font-bold text-blue-900">PRO</h3>
                            {billingCycle === "yearly" && (
                                <span className="absolute -top-3 -right-20 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold animate-bounce-subtle">
                                    17% SAVE
                                </span>
                            )}
                        </div>

                        {billingCycle === "monthly" ? (
                            <div className="text-4xl font-extrabold text-slate-900 mb-6">
                                990원 <span className="text-base font-normal text-slate-500">/ 월</span>
                            </div>
                        ) : (
                            <div className="text-4xl font-extrabold text-slate-900 mb-6">
                                9,900원 <span className="text-base font-normal text-slate-500">/ 년</span>
                            </div>
                        )}
                        <ul className="space-y-4 mb-8 text-left pl-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs text-center">✓</span>
                                메시지 전송: 최대 100개
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs text-center">✓</span>
                                저장공간: 1GB (사진, 영상, 음성)
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSubscribe("Pro", billingCycle === "monthly" ? "990원" : "9,900원")}
                            disabled={isPro && currentBillingCycle === billingCycle}
                            className="w-full py-6 rounded-xl text-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
