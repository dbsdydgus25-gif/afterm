"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";

export default function BenefitsOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<"input" | "loading1" | "loading2" | "done">("input");
    const [name, setName] = useState("");
    const [ssnFront, setSsnFront] = useState("");
    const [ssnBack, setSsnBack] = useState("");

    const handleStartSimulation = () => {
        if (!name || !ssnFront || !ssnBack) return;
        setStep("loading1");
    };

    useEffect(() => {
        if (step === "loading1") {
            const timer = setTimeout(() => setStep("loading2"), 2500);
            return () => clearTimeout(timer);
        } else if (step === "loading2") {
            const timer = setTimeout(() => setStep("done"), 2500);
            return () => clearTimeout(timer);
        } else if (step === "done") {
            const timer = setTimeout(() => router.push("/service/benefits/result"), 1000);
            return () => clearTimeout(timer);
        }
    }, [step, router]);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
            <Header transparentOnTop={false} />

            <main className="flex-1 w-full pt-20 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 overflow-hidden relative min-h-[400px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === "input" && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full flex-1"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">고인 정보 입력</h2>
                                    <p className="text-sm text-slate-500 mb-4">
                                        정확한 지원금 산출을 위해 고인의 정보를 입력해주세요.
                                    </p>
                                    <div className="p-3 bg-blue-50/80 text-blue-700 text-[13px] rounded-xl font-bold border border-blue-100/50 shadow-sm flex items-start gap-2">
                                        <span>💡</span> 현재는 서비스 준비중으로 미리보기 형식으로 되어 있습니다.
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">고인 성함</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="홍길동"
                                            className="h-14 rounded-xl text-lg bg-slate-50 border-slate-200 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">주민등록번호</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={ssnFront}
                                                onChange={(e) => setSsnFront(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="YYMMDD"
                                                className="h-14 rounded-xl text-lg text-center bg-slate-50 border-slate-200 focus:bg-white flex-1"
                                                maxLength={6}
                                            />
                                            <span className="text-slate-400 font-bold">-</span>
                                            <div className="flex-1 relative flex items-center">
                                                <Input
                                                    type="password"
                                                    value={ssnBack}
                                                    onChange={(e) => setSsnBack(e.target.value.replace(/\D/g, '').slice(0, 7))}
                                                    placeholder="●●●●●●●"
                                                    className="h-14 rounded-xl text-lg text-center bg-slate-50 border-slate-200 focus:bg-white w-full pr-10 tracking-widest"
                                                    maxLength={7}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleStartSimulation}
                                    disabled={!name || ssnFront.length < 6 || ssnBack.length < 7}
                                    className="w-full h-14 mt-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                                >
                                    조회 시작하기
                                </Button>
                                <p className="text-center mt-4 text-xs text-slate-400">
                                    입력하신 정보는 시뮬레이션용으로 저장되지 않습니다.
                                </p>
                            </motion.div>
                        )}

                        {(step === "loading1" || step === "loading2" || step === "done") && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full flex-1 py-10"
                            >
                                <div className="relative w-32 h-32 mb-8">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50" />
                                    <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                                        {step === "loading1" && <span className="text-4xl">📄</span>}
                                        {step === "loading2" && <span className="text-4xl">👨‍👩‍👧‍👦</span>}
                                        {step === "done" && <span className="text-4xl">✨</span>}
                                    </div>

                                    {/* Circular Progress SVG */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="4"
                                        />
                                        <motion.circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            initial={{ strokeDasharray: "0 300" }}
                                            animate={{ strokeDasharray: step === "done" ? "300 300" : (step === "loading2" ? "200 300" : "100 300") }}
                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                        />
                                    </svg>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    {step === "loading1" && "사망진단서 기록을 찾고 있어요"}
                                    {step === "loading2" && "가족관계증명서 데이터를 연동 중이에요"}
                                    {step === "done" && "분석이 완료되었습니다!"}
                                </h3>

                                <p className="text-slate-500 text-sm h-5">
                                    {step === "loading1" && "공공누리 데이터를 스크래핑하고 있습니다..."}
                                    {step === "loading2" && "수령 가능한 유족 혜택을 계산하고 있습니다..."}
                                    {step === "done" && "결과 페이지로 이동합니다."}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
