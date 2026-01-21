"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export default function PlansPage() {
    const router = useRouter();

    const handleSubscribe = async (plan: string, price: string) => {
        if (plan === 'Pro') {
            const confirmed = confirm("테스트 모드: 무료로 PRO 플랜으로 업그레이드 하시겠습니까?");
            if (!confirmed) return;

            try {
                const res = await fetch('/api/payment/mock', { method: 'POST' });
                if (!res.ok) throw new Error("Upgrade failed");
                alert("성공적으로 업그레이드 되었습니다! 잠시 후 반영됩니다.");
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert("업그레이드 중 오류가 발생했습니다.");
            }
        } else {
            alert(`${plan} 플랜(${price})은 현재 이용 중입니다.`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto text-center">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Basic Plan */}
                    <div className="rounded-3xl p-8 border border-slate-200 bg-white relative hover:shadow-xl transition-all duration-300">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Basic</h3>
                        <div className="text-4xl font-extrabold text-slate-900 mb-6">무료</div>
                        <ul className="space-y-4 mb-8 text-left pl-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                                메시지 전송: 딱 1개 전송
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                                저장공간: 10mb (텍스트 위주)
                            </li>
                            <li className="flex items-center gap-3 text-slate-400 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">x</span>
                                추모 공간 x
                            </li>
                            <li className="flex items-center gap-3 text-slate-400 font-medium">
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">x</span>
                                부가기능 x
                            </li>
                        </ul>
                        <Button onClick={() => handleSubscribe("Basic", "무료")} className="w-full py-6 rounded-xl text-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 font-bold shadow-sm">
                            현재 이용 중
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-3xl p-8 border border-blue-100 bg-blue-50/50 relative hover:shadow-2xl transition-all duration-300 transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-3xl text-sm font-bold">Popular</div>
                        <h3 className="text-2xl font-bold text-blue-900 mb-2">PRO</h3>
                        <div className="text-4xl font-extrabold text-slate-900 mb-6">100원 <span className="text-base font-normal text-slate-500">/ 월</span></div>
                        <ul className="space-y-4 mb-8 text-left pl-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                메시지 전송: 무제한 전송
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                저장공간: 1GB (사진, 음성, 영상)
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                온라인 추모관 생성
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                                추모 댓글, 사진 남기기 기능
                            </li>
                        </ul>
                        <Button onClick={() => handleSubscribe("Pro", "100원")} className="w-full py-6 rounded-xl text-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30">
                            PRO로 업그레이드
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
