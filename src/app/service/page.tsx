"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export default function ServiceGuidePage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
            <Header transparentOnTop={false} />

            <main className="flex-1 w-full pt-20">

                {/* Service Process Explanation Section */}
                <section className="w-full bg-white py-16 md:py-24 border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-xs font-bold tracking-wide">HOW IT WORKS</span>
                            <h2 className="text-xl md:text-4xl font-bold text-slate-900 leading-tight">
                                마음이 전달되는 과정
                            </h2>
                            <p className="text-slate-500 text-[11px] md:text-lg leading-normal md:leading-relaxed tracking-tighter w-full">
                                가장 안전하고 확실하게 당신의 메시지를 전달해드립니다.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10"></div>

                            {/* Step 1 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-center text-center space-y-6 bg-white p-6 rounded-3xl"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center text-4xl shadow-lg shadow-blue-100 mb-2 relative group hover:scale-105 transition-transform duration-300">
                                    <span className="relative z-10">✍️</span>
                                    <div className="absolute inset-0 bg-blue-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 mb-1">STEP 01</div>
                                    <h3 className="text-xl font-bold text-slate-900">기억 저장</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        소중한 사람에게 전하고 싶은 이야기,<br />
                                        사진, 영상을 미리 작성하세요.<br />
                                        모든 데이터는 암호화되어 안전하게 저장됩니다.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Step 2 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="flex flex-col items-center text-center space-y-6 bg-white p-6 rounded-3xl"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-4xl shadow-lg shadow-indigo-100 mb-2 relative group hover:scale-105 transition-transform duration-300">
                                    <span className="relative z-10">🔒</span>
                                    <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 mb-1">STEP 02</div>
                                    <h3 className="text-xl font-bold text-slate-900">안전 보관</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        당신이 지정한 순간이 올 때까지<br />
                                        메시지는 철저히 비공개로 보관됩니다.<br />
                                        클라우드 서버에서 영구적으로 관리됩니다.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Step 3 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="flex flex-col items-center text-center space-y-6 bg-white p-6 rounded-3xl"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-amber-50 flex items-center justify-center text-4xl shadow-lg shadow-amber-100 mb-2 relative group hover:scale-105 transition-transform duration-300">
                                    <span className="relative z-10">📬</span>
                                    <div className="absolute inset-0 bg-amber-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 mb-1">STEP 03</div>
                                    <h3 className="text-xl font-bold text-slate-900">전달 및 열람</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        지정된 시점에 수신인에게 알림이 전송됩니다.<br />
                                        수신인은 본인 인증(휴대폰)을 거친 후<br />
                                        당신의 메시지를 열람할 수 있습니다.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>


                {/* Feature Section (Dark) */}
                <section className="w-full bg-slate-900 text-white py-20 md:py-32 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-center">

                            {/* Text Content */}
                            <div className="md:col-span-5 space-y-8 md:space-y-10 text-left">
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: false, margin: "-100px" }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="space-y-4 md:space-y-6"
                                >
                                    <h2 className="text-2xl md:text-5xl font-bold leading-tight tracking-tight">
                                        남겨진 사람들에게<br />
                                        <span className="text-blue-400">가장 소중한 선물</span>이<br />
                                        됩니다.
                                    </h2>
                                    <div className="w-16 h-1.5 bg-blue-500 rounded-full"></div>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: false, margin: "-100px" }}
                                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                                    className="text-[13px] md:text-lg text-slate-400 leading-snug md:leading-relaxed break-keep"
                                >
                                    AFTERM(에프텀)은 당신의 생애 데이터를 안전하게 보관하고,<br className="block md:hidden" />
                                    지정된 시점에 소중한 사람들에게 전달합니다.<br className="block md:hidden" />
                                    단순한 메시지를 넘어, 당신의 목소리와 온기를 전하세요.
                                </motion.p>

                                <ul className="space-y-6 pt-4">
                                    {[
                                        "클라우드 기반의 안전한 데이터 영구 보관",
                                        "원하는 시점(생일, 기념일 등)에 예약 전송",
                                        "가족, 연인, 친구별 맞춤 메시지 설정"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-slate-300 group">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 group-hover:scale-125 transition-transform" />
                                            <span className="text-lg leading-snug group-hover:text-blue-200 transition-colors">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Visual Mockups */}
                            <div className="md:col-span-7 relative flex justify-center md:justify-end perspective-1000">
                                <div className="relative w-full max-w-md">
                                    <div className="absolute -inset-10 bg-blue-500/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>

                                    <div className="grid gap-6">
                                        {/* Card 1 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: false, amount: 0.2 }}
                                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                            className="bg-slate-800/80 backdrop-blur border border-slate-700/50 p-6 rounded-2xl md:w-[90%] md:translate-x-0 transform transition hover:-translate-y-2 duration-500 shadow-2xl hover:shadow-blue-500/10"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl">🎉</div>
                                                    <div>
                                                        <span className="block text-xs text-indigo-400 mb-0.5">To. 친구들에게</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed pl-3 border-l-2 border-slate-700">
                                                "내 장례식은 파티였음 좋겠음, 클럽 노래 틀고 즐기다가 가~"
                                            </p>
                                        </motion.div>

                                        {/* Card 2 */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: false, amount: 0.2 }}
                                            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                                            className="bg-slate-800/95 backdrop-blur border border-blue-500/30 p-8 rounded-2xl md:w-[105%] md:-translate-x-8 transform transition hover:scale-[1.02] duration-500 z-10 shadow-2xl hover:shadow-blue-500/20"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">📺</div>
                                                    <div>
                                                        <span className="block text-sm text-blue-400/80 mb-0.5">To. 내 동생</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-blue-50 text-base leading-relaxed pl-3 border-l-2 border-slate-700">
                                                "이번 생 재밌었다 넷플, 티빙 계정 남긴다. 나머지는 너가 내 ^^"
                                            </p>
                                        </motion.div>

                                        {/* Card 3 (New) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: false, amount: 0.2 }}
                                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                                            className="bg-slate-800/90 backdrop-blur border border-slate-700/50 p-6 rounded-2xl md:w-[95%] md:translate-x-4 transform transition hover:-translate-y-2 duration-500 shadow-2xl hover:shadow-blue-500/10"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xl">🍲</div>
                                                    <div>
                                                        <span className="block text-xs text-orange-400 mb-0.5">To. 우리 딸</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed pl-3 border-l-2 border-slate-700">
                                                "엄마 된찌 레시피 남겨놓을테니까 이대로만해~"
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section (Restored & Promoted) */}
                <section className="w-full bg-white py-24 relative">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="mb-10 md:mb-16 space-y-4"
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-sm font-bold tracking-wide mb-2">PRICING</span>
                            <h2 className="text-2xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                                자유로운 여정의 시작<br className="sm:hidden" />
                                <span className="text-blue-600">3개월 무료 체험</span>
                            </h2>

                        </motion.div>
                    </div>
                </section>
            </main>
        </div>
    );
}
