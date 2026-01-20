"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WithdrawModal } from "@/components/auth/WithdrawModal";
import { User, Shield, CreditCard, LogOut, ChevronRight } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "billing">("profile");
    const { user, setUser, plan } = useMemoryStore();
    const router = useRouter();
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    if (!mounted) return null;

    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">설정</h1>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-10 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`pb-4 px-1 min-w-[100px] text-sm font-bold border-b-2 transition-colors mr-8 ${activeTab === "profile"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        프로필 편집
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`pb-4 px-1 min-w-[100px] text-sm font-bold border-b-2 transition-colors mr-8 ${activeTab === "security"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        계정 및 보안
                    </button>
                    <button
                        onClick={() => setActiveTab("billing")}
                        className={`pb-4 px-1 min-w-[100px] text-sm font-bold border-b-2 transition-colors ${activeTab === "billing"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        결제 및 멤버십
                    </button>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* 1. Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">프로필 정보</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">이름</label>
                                    <input
                                        type="text"
                                        value={user.name}
                                        readOnly
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm focus:outline-none cursor-not-allowed"
                                        title="소셜 로그인 사용자는 이름을 변경할 수 없습니다."
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        * 소셜 로그인 사용자는 제공업체에서 설정한 이름을 사용합니다.
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        disabled
                                        className="rounded-xl px-6 h-12 bg-blue-600 text-white font-bold opacity-50 cursor-not-allowed"
                                    >
                                        변경 사항 저장
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Security Tab */}
                    {activeTab === "security" && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">계정 및 보안</h2>

                            <div className="space-y-8">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">로그인 계정</h3>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-8">
                                    <h3 className="font-bold text-slate-900 mb-4">계정 관리</h3>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group mb-2"
                                    >
                                        <span className="font-medium text-slate-600 group-hover:text-slate-900">로그아웃</span>
                                        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                    </button>

                                    <button
                                        onClick={() => setIsWithdrawModalOpen(true)}
                                        className="w-full text-left p-4 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-red-600">회원 탈퇴</span>
                                            <span className="text-xs text-red-400 mt-0.5">계정과 모든 데이터를 영구적으로 삭제합니다.</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-red-200 group-hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Billing Tab */}
                    {activeTab === "billing" && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">결제 및 멤버십</h2>

                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">현재 멤버십</p>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {plan === 'pro' ? 'PRO Plan' : 'Basic Plan'}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${plan === 'pro'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {plan === 'pro' ? 'Active' : 'Free'}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => router.push("/plans")}
                                    className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                                >
                                    멤버십 관리 / 업그레이드
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
        </div>
    );
}
