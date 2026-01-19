"use client";

import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { User, LogOut, CreditCard, Trash2, ChevronDown } from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();
    const { message, setMessage, recipient, setRecipient, user, setUser, plan } = useMemoryStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Initial check for user (simplified protection)
    // useEffect(() => {
    //     if (!user) router.push("/");
    // }, [user, router]);

    const handleEdit = () => {
        router.push("/create");
    };

    const handleLogout = () => {
        setUser(null); // Clear user state
        router.push("/");
    };

    const handleDeleteAccount = () => {
        if (confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
            setUser(null);
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50">
                <Link href="/" className="text-xl font-black text-blue-600 tracking-tighter">AFTERM</Link>
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-slate-200"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user?.name?.[0] || "U"}
                        </div>
                        <span className="text-sm font-bold text-slate-700 hidden sm:block">{user?.name || "사용자"}</span>
                        {plan === 'pro' && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">PRO</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-slate-50">
                                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <div className="p-1">
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                        <User className="w-4 h-4" /> 내 정보
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> 플랜 관리
                                        {plan === 'pro' && <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold">PRO</span>}
                                    </button>
                                </div>
                                <div className="p-1 border-t border-slate-50">
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center gap-2 transition-colors">
                                        <LogOut className="w-4 h-4" /> 로그아웃
                                    </button>
                                </div>
                                <div className="p-1 border-t border-slate-50">
                                    <button onClick={handleDeleteAccount} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-500 rounded-lg flex items-center gap-2 transition-colors">
                                        <Trash2 className="w-3 h-3" /> 회원 탈퇴
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 lg:p-10 space-y-10">

                {/* Profile Section (Editable) */}
                <section
                    onClick={() => router.push('/dashboard/edit')}
                    className="group relative flex items-center gap-6 pb-8 border-b border-slate-200 hover:bg-slate-100/50 p-4 rounded-2xl transition-colors cursor-pointer"
                >
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-slate-400">수정하기 ›</Button>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl shadow-inner ring-4 ring-white">
                        😊
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">반가워요, {user?.name || "다니엘"}님</h1>
                        <p className="text-slate-500">Free Plan 이용 중</p>
                    </div>
                </section>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <span className="text-sm font-bold text-slate-400">남은 메시지</span>
                        <div className="text-3xl font-black text-slate-900">2<span className="text-lg text-slate-400 font-medium ml-1">/ 3건</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <span className="text-sm font-bold text-slate-400">남은 용량</span>
                        <div className="text-3xl font-black text-blue-600">5.0<span className="text-lg text-slate-400 font-medium ml-1">GB</span></div>
                    </div>
                </div>

                {/* My Memories List (Text Centric) */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">나의 기억 보관함</h2>
                        <Button onClick={() => router.push('/dashboard/memories')} variant="ghost" size="sm" className="text-slate-500">전체보기</Button>
                    </div>

                    {message ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold">D-Day 전송</span>
                                        <span className="text-xs text-slate-400">2026.01.19 작성</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {recipient.name ? `To. ${recipient.name}` : '수신인 미지정'}
                                    </h3>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button onClick={handleEdit} variant="ghost" size="sm" className="h-8">수정</Button>
                                    <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">삭제</Button>
                                </div>
                            </div>

                            <p className="text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-4 rounded-xl text-sm">
                                {message}
                            </p>

                            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 font-medium">
                                <span className="flex items-center gap-1">📄 텍스트</span>
                                <span className="flex items-center gap-1">📷 사진 0장</span>
                            </div>
                        </motion.div>
                    ) : (
                        <div onClick={() => router.push('/create')} className="cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-110 transition-transform">✍️</div>
                            <p className="text-slate-900 font-bold mb-1">첫 번째 기억을 남겨보세요</p>
                            <p className="text-slate-500 text-sm">무료로 최대 3명에게 마음을 전할 수 있습니다.</p>
                        </div>
                    )}
                </section>

                {/* Upgrade CTA */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h3 className="text-2xl font-bold mb-2 relative z-10">더 많은 분들에게 마음을 전하고 싶으신가요?</h3>
                    <p className="text-slate-400 mb-6 relative z-10">Pro 플랜으로 업그레이드하고<br />무제한 메시지와 100GB 저장 공간을 이용해보세요.</p>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-6 rounded-xl text-lg relative z-10 shadow-lg shadow-blue-900/50">
                        Pro 플랜 알아보기
                    </Button>
                </div>

            </main>
        </div>
    );
}
