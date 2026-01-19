"use client";

import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const router = useRouter();
    const { message, recipient } = useMemoryStore();

    const handleEdit = () => {
        router.push("/create");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50">
                <Link href="/" className="text-xl font-black text-blue-600 tracking-tighter">AFTERM</Link>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        ME
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 lg:p-10 space-y-10">

                {/* Profile Section */}
                <section className="flex items-center gap-6 pb-6 border-b border-slate-200">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl shadow-inner">
                        😊
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">반가워요, 다니엘님</h1>
                        <p className="text-slate-500">당신의 소중한 기억들이 안전하게 보관되고 있습니다.</p>
                    </div>
                </section>

                {/* Dashboard Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="inline-block px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold mb-2">보관 중</span>
                                <h3 className="text-lg font-bold text-slate-800">예약된 기억</h3>
                            </div>
                            <span className="text-3xl">📦</span>
                        </div>
                        <div className="pt-4">
                            <div className="text-3xl font-extrabold text-slate-900">1<span className="text-base font-normal text-slate-500 ml-1">건</span></div>
                        </div>
                    </div>

                    {/* Storage Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">남은 저장 공간</h3>
                            </div>
                            <span className="text-3xl">☁️</span>
                        </div>
                        <div className="pt-4">
                            <div className="text-3xl font-extrabold text-blue-600">5.0<span className="text-base font-normal text-slate-500 ml-1">GB</span></div>
                            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: '2%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Memories List */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">나의 기억 보관함</h2>
                        <Button variant="outline" size="sm">전체보기</Button>
                    </div>

                    {message ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/3 aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                    {/* Placeholder for media */}
                                    <span>No Media</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">D-DAY 전송</span>
                                                <span className="text-xs text-slate-400">2026.01.19 작성</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1">
                                            {recipient.name ? `To. ${recipient.name}` : '수신인 미지정'}
                                        </h3>
                                        <p className="text-slate-500 line-clamp-2 text-sm leading-relaxed">
                                            {message}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={handleEdit} variant="outline" className="flex-1">수정하기</Button>
                                        <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">삭제</Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <p className="text-slate-400 mb-4">아직 보관된 기억이 없습니다.</p>
                            <Button onClick={() => router.push('/create')} className="bg-blue-600 hover:bg-blue-700 text-white">
                                첫 기억 남기기
                            </Button>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
