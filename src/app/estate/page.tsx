"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Camera, ChevronDown, Search, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

// -------------- TYPES --------------
type Step = 1 | 2 | 3;

interface FormData {
    ageGroup: string;
    region: string;
    cause: string;
    fileName?: string;
}

// -------------- MOCK DATA --------------
const RESULTS = [
    {
        id: 1,
        title: "국민연금 사망일시금",
        amount: 2000000,
        description: "가입기간에 따라 산정된 사망일시금",
        label: "연금공단",
        color: "blue",
    },
    {
        id: 2,
        title: "마포구 화장 장려금",
        amount: 300000,
        description: "관내 화장 시설 이용 시 지급",
        label: "지자체",
        color: "green",
    },
    {
        id: 3,
        title: "자동차보험 미경과 환급금",
        amount: 100000,
        description: "잔여 보험료 환급",
        label: "보험사",
        color: "orange",
    },
];

const LOADING_MESSAGES = [
    "전국 지자체 조례 검색 중...",
    "국민연금 가입 여부 확인 중...",
    "생명보험 미청구 내역 조회 중...",
    "예상 환급금 계산 완료! ✅",
];

const AGE_GROUPS = ["30대 미만", "30~40대", "50~60대", "70대 이상"];
const REGIONS = ["서울 강남구", "서울 마포구", "서울 송파구", "부산 해운대구", "경기 수원시", "기타"];
const CAUSES = ["질병 (암/심장 등)", "교통사고", "기타 사고", "노환", "기타"];

// -------------- COMPONENTS --------------

function StepIndicator({ step }: { step: Step }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {([1, 2, 3] as Step[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                        ${step >= s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                        {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-8 h-0.5 rounded transition-all duration-300 ${step > s ? "bg-blue-600" : "bg-slate-200"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// -------------- STEP 1: FORM --------------
function Step1Form({ onNext }: { onNext: (data: FormData) => void }) {
    const [form, setForm] = useState<FormData>({ ageGroup: "", region: "", cause: "" });
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    const isValid = (form.ageGroup && form.region && form.cause) || uploadedFile;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
        >
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                    숨은 지원금을<br />찾아드릴게요
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    기본 정보 입력으로 빠르게 조회하거나<br />
                    사망진단서를 업로드해 더 정확한 결과를 받으세요.
                </p>
            </div>

            {/* Upload Box */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setUploadedFile(f.name);
                        }}
                    />
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200
                        ${uploadedFile ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"}`}>
                        {uploadedFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-bold text-blue-700 truncate max-w-[200px]">{uploadedFile}</span>
                            </div>
                        ) : (
                            <>
                                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-700 mb-1">사망진단서 업로드</p>
                                <p className="text-xs text-slate-400">사진 또는 PDF · 클릭하여 선택</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-bold text-slate-400">또는 직접 입력</span>
                <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-8">
                {/* Age Group */}
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">고인의 연령대</label>
                    <div className="relative">
                        <select
                            value={form.ageGroup}
                            onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                            <option value="">선택해주세요</option>
                            {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Region */}
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">거주 지역 (시/구)</label>
                    <div className="relative">
                        <select
                            value={form.region}
                            onChange={(e) => setForm({ ...form, region: e.target.value })}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                            <option value="">선택해주세요</option>
                            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Cause */}
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">사망 원인</label>
                    <div className="relative">
                        <select
                            value={form.cause}
                            onChange={(e) => setForm({ ...form, cause: e.target.value })}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                            <option value="">선택해주세요</option>
                            {CAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* CTA */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onNext({ ...form, fileName: uploadedFile || undefined })}
                disabled={!isValid}
                className="w-full py-4 rounded-2xl font-black text-base transition-all duration-200
                    bg-blue-600 text-white shadow-xl shadow-blue-200
                    hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <span className="flex items-center justify-center gap-2">
                    🔍 숨은 지원금 찾기
                    <ArrowRight className="w-4 h-4" />
                </span>
            </motion.button>

            <p className="text-center text-xs text-slate-400 mt-4">
                입력하신 정보는 조회 목적으로만 사용되며, 저장되지 않습니다.
            </p>
        </motion.div>
    );
}

// -------------- STEP 2: LOADING --------------
function Step2Loading({ onDone }: { onDone: () => void }) {
    const [msgIdx, setMsgIdx] = useState(0);

    useEffect(() => {
        const intervals = LOADING_MESSAGES.map((_, i) =>
            setTimeout(() => setMsgIdx(i), i * 800)
        );
        const done = setTimeout(onDone, LOADING_MESSAGES.length * 800 + 400);
        return () => {
            intervals.forEach(clearTimeout);
            clearTimeout(done);
        };
    }, [onDone]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-10 text-center"
        >
            {/* Animated Circle */}
            <div className="relative w-28 h-28 mb-8">
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-100"
                />
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-6">
                지원금 조회 중...
            </h3>

            <div className="space-y-3 w-full max-w-xs">
                {LOADING_MESSAGES.map((msg, i) => (
                    <motion.div
                        key={msg}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: msgIdx >= i ? 1 : 0.2, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3"
                    >
                        <motion.div
                            animate={msgIdx > i ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {msgIdx > i ? (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            ) : msgIdx === i ? (
                                <motion.div
                                    className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent shrink-0"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                            )}
                        </motion.div>
                        <span className={`text-sm font-medium ${msgIdx >= i ? "text-slate-800" : "text-slate-400"}`}>
                            {msg}
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// -------------- STEP 3: RESULTS --------------
function Step3Results({ formData }: { formData: FormData }) {
    const total = RESULTS.reduce((s, r) => s + r.amount, 0);
    const colorMap: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Title */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                    <span className="text-3xl">🎉</span>
                </motion.div>
                <p className="text-sm text-slate-500 mb-2 font-medium">
                    {formData.region || "서울 마포구"} 거주 유가족 기준
                </p>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-4">
                    유가족이 받을 수 있는<br />예상 지원금은
                </h2>
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="inline-block bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-blue-200"
                >
                    <div className="text-3xl md:text-4xl font-black">
                        약 {total.toLocaleString()}원
                    </div>
                    <div className="text-blue-200 text-xs mt-1 font-medium">예상 금액 (실제 수령액과 다를 수 있음)</div>
                </motion.div>
            </div>

            {/* Result Cards */}
            <div className="space-y-3 mb-8">
                {RESULTS.map((result, i) => (
                    <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorMap[result.color]}`}>
                                        {result.label}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-0.5">{result.title}</h4>
                                <p className="text-xs text-slate-500">{result.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-base font-black text-slate-900">
                                    {result.amount.toLocaleString()}원
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">예상</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-7 text-sm text-amber-800">
                <p className="font-bold mb-1">📌 실제 수령을 위해서는 서류 청구가 필요합니다</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                    지원금은 자동으로 지급되지 않으며, 유가족이 직접 각 기관에 청구 서류를 제출해야 합니다. 전문가 대행 서비스를 이용하시면 훨씬 간편합니다.
                </p>
            </div>

            {/* CTA Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
            >
                <Link href="/contact">
                    <button className="w-full py-4 rounded-2xl font-black text-base bg-slate-900 text-white shadow-xl hover:bg-black transition-all active:scale-[0.98]">
                        <span className="flex items-center justify-center gap-2">
                            📄 서류 발급 및 청구 대행 신청하기
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </button>
                </Link>
                <p className="text-center text-xs text-slate-400 mt-3">
                    전문 법무사가 모든 서류를 대신 처리해 드립니다
                </p>
            </motion.div>
        </motion.div>
    );
}

// -------------- MAIN PAGE --------------
export default function EstatePage() {
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>({ ageGroup: "", region: "", cause: "" });

    const handleFormNext = (data: FormData) => {
        setFormData(data);
        setStep(2);
    };

    const handleLoadingDone = () => {
        setStep(3);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                <div className="max-w-lg mx-auto flex h-14 items-center px-5 gap-3">
                    <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black text-slate-900">사망 환급금/지원금 조회</h1>
                        <p className="text-[10px] text-slate-400 font-medium">무료 조회 · 30초 완성</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="pt-14 pb-16 px-5 max-w-lg mx-auto">
                <div className="pt-8">
                    {/* Step Indicator */}
                    {step !== 2 && <StepIndicator step={step} />}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <div key="step1">
                                <Step1Form onNext={handleFormNext} />
                            </div>
                        )}
                        {step === 2 && (
                            <div key="step2">
                                <Step2Loading onDone={handleLoadingDone} />
                            </div>
                        )}
                        {step === 3 && (
                            <div key="step3">
                                <Step3Results formData={formData} />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
