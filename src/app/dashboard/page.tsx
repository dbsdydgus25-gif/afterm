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

            <main className="max-w-3xl mx-auto p-6 lg:p-10 space-y-10">

                {/* Profile Section (Editable) */}
                <section className="group relative flex items-center gap-6 pb-8 border-b border-slate-200 hover:bg-slate-100/50 p-4 rounded-2xl transition-colors cursor-pointer">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-slate-400">수정하기 ›</Button>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl shadow-inner ring-4 ring-white">
                        😊
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">반가워요, 다니엘님</h1>
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
                        <Button variant="ghost" size="sm" className="text-slate-500">전체보기</Button>
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
