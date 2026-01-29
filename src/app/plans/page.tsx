"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { PlanConfirmModal } from "@/components/payment/PlanConfirmModal";
import { useState } from "react";

export default function PlansPage() {
    const router = useRouter();
    const { plan, user } = useMemoryStore();
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [targetPlan, setTargetPlan] = useState<"free" | "pro">("pro");

    // We only have one "Pro" option now (Free Trial), so billingCycle toggle is less relevant visually,
    // but maybe we keep it simple: Just one "Pro" card.

    const handleSubscribe = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        setTargetPlan("pro");
        setIsPlanModalOpen(true);
    };

    const handleConfirmTrial = async () => {
        try {
            const res = await fetch('/api/plan/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetPlan: 'pro' })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.error || "오류가 발생했습니다.");
            }
        } catch (error) {
            alert("요청 처리 중 오류가 발생했습니다.");
        }
    };

    const isPro = plan === 'pro';

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="mb-16 space-y-4">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide mb-2 animate-pulse">
                        🎉 LIMITED TIME OFFER
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        지금 시작하면<br className="sm:hidden" /> <span className="text-blue-600">2개월 동안 무료</span>입니다.
                    </h1>
                    <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
                        복잡한 결제 없이, 버튼 하나로 바로 시작해보세요.<br />
                        에프텀의 모든 기능을 60일간 자유롭게 이용할 수 있습니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Basic Plan */}
                    <div className="rounded-3xl p-8 border border-slate-200 bg-white relative hover:shadow-xl transition-all duration-300">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Basic</h3>
                        <div className="text-4xl font-extrabold text-slate-900 mb-6">Free</div>
                        <ul className="space-y-4 mb-8 text-left pl-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                                메시지 전송: 딱 1개 전송
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                                저장공간: 10mb (텍스트 위주)
                            </li>
                        </ul>
                        <Button
                            disabled={!isPro}
                            onClick={() => {/* Implement downgrade if needed later */ }}
                            className="w-full py-6 rounded-xl text-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 font-bold shadow-sm disabled:opacity-50"
                        >
                            {!isPro ? "현재 이용 중" : "Basic으로 변경"}
                        </Button>
                    </div>

                    {/* Pro Plan (Free Trial) */}
                    <div className="rounded-3xl p-8 border border-blue-100 bg-blue-50/50 relative hover:shadow-2xl transition-all duration-300 transform md:-translate-y-4 ring-4 ring-blue-500/10">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-3xl text-sm font-bold">
                            2개월 무료 체험
                        </div>

                        <div className="relative mb-2 inline-block">
                            <h3 className="text-2xl font-bold text-blue-900">PRO</h3>
                        </div>

                        <div className="text-4xl font-extrabold text-slate-900 mb-6 flex items-center justify-center gap-3">
                            <span className="line-through text-slate-400 text-2xl">9,900원</span>
                            <span>0원</span>
                        </div>
                        <p className="text-blue-600 font-bold mb-6 text-sm bg-blue-100 py-1 px-3 rounded-full inline-block">
                            카드 등록 없이 바로 시작하세요!
                        </p>

                        <ul className="space-y-4 mb-8 text-left pl-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                메시지 전송: 최대 100개
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                저장공간: 1GB (사진, 영상, 음성)
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                2개월 후 자동 결제 없음
                            </li>
                        </ul>
                        <Button
                            onClick={handleSubscribe}
                            disabled={isPro}
                            className="w-full py-6 rounded-xl text-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPro ? "현재 이용 중 (Pro)" : "2개월 무료 체험 시작하기"}
                        </Button>
                    </div>
                </div>
            </main>

            <PlanConfirmModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                targetPlan={targetPlan}
                currentPlan={plan === 'pro' ? 'pro' : 'free'}
                onConfirm={handleConfirmTrial}
                isFreeTrial={true}
            />
        </div>
    );
}
