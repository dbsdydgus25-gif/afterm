"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function BenefitsLandingPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
            <Header transparentOnTop={false} />

            <main className="flex-1 w-full pt-20 flex items-center justify-center">
                <section className="w-full max-w-4xl mx-auto px-6 lg:px-8 py-16 md:py-24 text-center">

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-xs md:text-sm font-bold"
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        사후 맞춤형 행정/지원금 찾기 서비스 출시!
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6 break-keep"
                    >
                        유가족이 놓치고 있는 지원금,<br />
                        <span className="text-blue-600">숨은 1원까지</span> 찾아드려요.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed break-keep"
                    >
                        복잡한 장례 절차와 상속 문제로 경황이 없으신가요?<br className="hidden md:block" />
                        고인의 정보만으로 받을 수 있는 혜택과 처리해야 할 행정 절차를 1분 만에 확인하세요.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="max-w-md mx-auto"
                    >
                        <Button
                            onClick={() => router.push('/service/benefits/onboarding')}
                            className="w-full h-16 text-lg md:text-xl rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1"
                        >
                            내 지원금 1분 만에 찾기
                        </Button>
                        <p className="mt-4 text-xs text-slate-400 font-medium">
                            * 본 서비스는 시뮬레이션 목적의 MVP 기능입니다.
                        </p>
                    </motion.div>

                    {/* Features Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">💰</div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">지원금 한눈에</h3>
                                <p className="text-sm text-slate-500 leading-relaxed break-keep">장제비, 유족연금 등 수령 가능한 모든 혜택을 찾아드려요.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">📅</div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">행정 절차 타임라인</h3>
                                <p className="text-sm text-slate-500 leading-relaxed break-keep">사망신고부터 상속세/취득세 신고 기한을 캘린더로 정리해드려요.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">🔒</div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">마이데이터 연동</h3>
                                <p className="text-sm text-slate-500 leading-relaxed break-keep">복잡한 서류 제출 없이 안전한 데이터 연동으로 바로 확인하세요.</p>
                            </div>
                        </div>
                    </motion.div>

                </section>
            </main>
        </div>
    );
}
