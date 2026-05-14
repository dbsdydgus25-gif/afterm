"use client";

import { useState, Suspense, useLayoutEffect, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Shield, Key, User, Phone, CheckCircle, Lock, ChevronRight, Eye, EyeOff,
    Copy, Check, FileText, ChevronDown, ChevronUp, CreditCard, Music, Cloud,
    Gamepad2, ShoppingBag, Terminal, Users, Info, Globe, LayoutGrid, Box,
    Upload, Camera, Loader2, XCircle, Calendar, ArrowRight, Trash2, Search, CheckCircle2, AlertCircle
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ─── 유틸 ─────────────────────────────────────────────────
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const IS_SERVER = typeof window === "undefined";

export function useMediaQuery(query: string, { defaultValue = false, initializeWithValue = true } = {}): boolean {
    const getMatches = (query: string): boolean => {
        if (IS_SERVER) return defaultValue;
        return window.matchMedia(query).matches;
    };
    const [matches, setMatches] = useState<boolean>(() => {
        if (initializeWithValue) return getMatches(query);
        return defaultValue;
    });
    const handleChange = () => setMatches(getMatches(query));
    useIsomorphicLayoutEffect(() => {
        const matchMedia = window.matchMedia(query);
        handleChange();
        matchMedia.addEventListener("change", handleChange);
        return () => matchMedia.removeEventListener("change", handleChange);
    }, [query]);
    return matches;
}

// ─── 타입 ─────────────────────────────────────────────────
interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    account_id: string | null;
    notes: string | null;
    created_at?: string;
}

interface OpenResult {
    deceasedName: string;
    vaultItems: VaultItem[];
    messagesReleased: number;
    apiKey?: string | null;
}

// Step 추가: ocr-info (고인 정보 입력), ocr-upload (사망진단서 업로드)
type Step = "landing" | "name" | "method" | "ocr-info" | "ocr-upload" | "form" | "result";

// ─── 카테고리 스타일 ──────────────────────────────────────
const CATEGORY_STYLE: Record<string, { icon: any; color: string; border: string; bg: string }> = {
    OTT: { icon: CreditCard, color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50" },
    음악: { icon: Music, color: "text-purple-600", border: "border-purple-100", bg: "bg-purple-50" },
    클라우드: { icon: Cloud, color: "text-blue-600", border: "border-blue-100", bg: "bg-blue-50" },
    "클라우드/생산성": { icon: Cloud, color: "text-blue-600", border: "border-blue-100", bg: "bg-blue-50" },
    게임: { icon: Gamepad2, color: "text-green-600", border: "border-green-100", bg: "bg-green-50" },
    쇼핑: { icon: ShoppingBag, color: "text-amber-600", border: "border-amber-100", bg: "bg-amber-50" },
    커머스: { icon: ShoppingBag, color: "text-orange-600", border: "border-orange-100", bg: "bg-orange-50" },
    "구독 서비스": { icon: CreditCard, color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50" },
    subscription: { icon: CreditCard, color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50" },
    "생산성 툴": { icon: Terminal, color: "text-slate-600", border: "border-slate-200", bg: "bg-slate-50" },
    생산성: { icon: Terminal, color: "text-sky-600", border: "border-sky-100", bg: "bg-sky-50" },
    "소셜/커뮤니티": { icon: Users, color: "text-sky-600", border: "border-sky-100", bg: "bg-sky-50" },
    SNS: { icon: Users, color: "text-pink-600", border: "border-pink-100", bg: "bg-pink-50" },
    기타: { icon: Info, color: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50" },
};

// ─── 정적 데이터 (환급금/행정) ───────────────────────────
const mockBenefits = [
    { id: 1, title: "장제비 지원금", amount: 800000, type: "정부 지원", status: "수령 가능" },
    { id: 2, title: "유족 연금 (초기 정착금)", amount: 1200000, type: "국민연금공단", status: "수령 가능" },
    { id: 3, title: "건강보험료 환급금", amount: 154000, type: "건강보험공단", status: "수령 가능" },
];

const mockTimeline = [
    { id: 1, title: "사망신고", deadline: "사망일로부터 1개월 이내", status: "urgent", desc: "시/구/읍/면/동 주민센터 방문 또는 온라인" },
    { id: 2, title: "안심상속 원스톱 서비스 신청", deadline: "사망일이 속한 달의 말일부터 6개월 이내", status: "pending", desc: "재산, 금융 내역 통보 신청" },
    { id: 3, title: "상속포기 또는 한정승인", deadline: "상속 개시 있음을 안 날로부터 3개월", status: "pending", desc: "가정법원에 청구" },
    { id: 4, title: "상속세 신고 및 납부", deadline: "개시일이 속하는 달의 말일부터 6개월 이내", status: "pending", desc: "주소지 관할 세무서" },
];

// ─── 유산 아코디언 ────────────────────────────────────────
function VaultAccordion({ items }: { items: VaultItem[] }) {
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showPass, setShowPass] = useState<Record<string, boolean>>({});
    const [copied, setCopied] = useState<"id" | "pw" | null>(null);

    const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);
    const toggleShowPass = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const copyToClipboard = (e: React.MouseEvent, text: string, type: "id" | "pw") => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <motion.div layout className="relative w-full max-w-3xl mx-auto">
            <div className="flex justify-end mb-4 z-10 relative px-4 sm:px-0">
                <button
                    onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    {viewMode === "list" ? <><LayoutGrid className="w-4 h-4" /> 전체 보기</> : <><Box className="w-4 h-4" /> 세로 리스트 보기</>}
                </button>
            </div>

            {viewMode === "grid" ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-0 pb-20 relative z-0">
                    {items.map(item => {
                        const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];
                        const Icon = style.icon;
                        return (
                            <motion.div layoutId={`card-${item.id}`} key={`grid-${item.id}`}
                                onClick={() => { setViewMode("list"); setExpandedId(item.id); }}
                                className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all flex flex-col items-center group">
                                <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center border ${style.border} flex-shrink-0 relative overflow-hidden mb-3 group-hover:scale-105 transition-transform`}>
                                    <Icon className={`w-7 h-7 ${style.color}`} />
                                </div>
                                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-snug text-center mb-1.5 line-clamp-1">{item.platform_name}</h3>
                                <div className="mt-auto">
                                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${style.color} ${style.bg} border ${style.border} uppercase tracking-widest`}>
                                        {item.category === "기타" ? "subscription" : item.category}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 px-4 sm:px-0 pb-20">
                    {items.map(item => {
                        const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];
                        const Icon = style.icon;
                        const isExpanded = expandedId === item.id;
                        const passMatch = item.notes?.match(/패스워드:\s*(.*)/);
                        const passwordText = passMatch?.[1]?.trim() || null;
                        const memoText = item.notes?.replace(/패스워드:\s*.+/g, "").trim() || null;

                        return (
                            <motion.div layoutId={`card-${item.id}`} key={`list-${item.id}`}
                                className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
                                onClick={() => toggleExpand(item.id)}>
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center border ${style.border} shadow-inner`}>
                                            <Icon className={`w-6 h-6 ${style.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-[18px] font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">{item.platform_name}</h3>
                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${style.color} ${style.bg} border ${style.border} uppercase tracking-widest`}>
                                                {item.category === "기타" ? "subscription" : item.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-colors">
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                                            <div className="p-5 space-y-4">
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1">아이디 / 이메일</p>
                                                    <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                                                        <p className={`text-[15px] font-mono tracking-wide break-all ${item.account_id ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                            {item.account_id || "미등록"}
                                                        </p>
                                                        {item.account_id && (
                                                            <button onClick={(e) => copyToClipboard(e, item.account_id!, "id")} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                                                {copied === "id" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1">비밀번호</p>
                                                    <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                                                        <p className={`text-[15px] font-mono tracking-widest break-all ${passwordText ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                            {passwordText ? (showPass[item.id] ? passwordText : "•".repeat(Math.min(passwordText.length, 12))) : "미등록"}
                                                        </p>
                                                        {passwordText && (
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={(e) => toggleShowPass(e, item.id)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                                                    {showPass[item.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                                <button onClick={(e) => copyToClipboard(e, passwordText, "pw")} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                                                    {copied === "pw" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {memoText && (
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1">메모</p>
                                                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{memoText}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
function GuardianOpenContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("uid");

    const [step, setStep] = useState<Step>("landing");

    // 공통 상태
    const [guardianName, setGuardianName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<OpenResult | null>(null);

    // API 키 경로 폼 상태
    const [deceasedName, setDeceasedName] = useState("");
    const [deceasedPhone, setDeceasedPhone] = useState("");
    const [apiKey, setApiKey] = useState("");

    // OCR 경로 상태
    const [ocrDeceasedName, setOcrDeceasedName] = useState("");
    const [ocrDeceasedBirth, setOcrDeceasedBirth] = useState(""); // YYYYMMDD
    const [ocrDeceasedPhone, setOcrDeceasedPhone] = useState("");
    const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "error">("idle");
    const [ocrError, setOcrError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatPhone = (v: string) => {
        const n = v.replace(/[^0-9]/g, "").slice(0, 11);
        if (n.length > 7) return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
        if (n.length > 3) return `${n.slice(0, 3)}-${n.slice(3)}`;
        return n;
    };

    // 대행 서비스 상태
    const [activeService, setActiveService] = useState<"none" | "cancel-loading" | "cancel-done" | "benefits-loading1" | "benefits-loading2" | "benefits-result">("none");

    // 대행 서비스 타이머 처리
    useEffect(() => {
        if (activeService === "cancel-loading") {
            const timer = setTimeout(() => setActiveService("cancel-done"), 2500);
            return () => clearTimeout(timer);
        } else if (activeService === "benefits-loading1") {
            const timer = setTimeout(() => setActiveService("benefits-loading2"), 2000);
            return () => clearTimeout(timer);
        } else if (activeService === "benefits-loading2") {
            const timer = setTimeout(() => setActiveService("benefits-result"), 2500);
            return () => clearTimeout(timer);
        }
    }, [activeService]);

    // ── API 키 경로 제출 ──────────────────────────────────
    const handleApiKeySubmit = async () => {
        if (!guardianName || !deceasedName || !deceasedPhone || !apiKey) {
            setErrorMsg("모든 항목을 입력해주세요."); return;
        }
        setIsLoading(true);
        setErrorMsg("");
        try {
            const res = await fetch("/api/guardians/verify-open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guardianName, deceasedName, deceasedPhone, apiKey, userId })
            });
            const data = await res.json();
            if (!res.ok) { setErrorMsg(data.error || "인증에 실패했습니다."); return; }
            setResult(data);
            setStep("result");
        } catch {
            setErrorMsg("네트워크 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── OCR 경로: 파일 선택 → API 호출 ──────────────────
    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleOcrFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrStatus("loading");
        setOcrError("");

        try {
            const imageFormat = file.type.split("/")[1] || "jpg";
            const imageBase64 = await fileToBase64(file);

            const res = await fetch("/api/guardians/verify-ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardianName,
                    deceasedName: ocrDeceasedName,
                    deceasedBirth: ocrDeceasedBirth,
                    deceasedPhone: ocrDeceasedPhone,
                    imageBase64,
                    imageFormat,
                    userId,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setResult(data);
                setStep("result");
            } else {
                setOcrError(data.error || "인증에 실패했습니다.");
                setOcrStatus("error");
            }
        } catch {
            setOcrError("이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            setOcrStatus("error");
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [guardianName, ocrDeceasedName, ocrDeceasedBirth, ocrDeceasedPhone, userId]);

    return (
        <div className="relative w-full min-h-screen bg-slate-50/50 overflow-hidden font-sans text-slate-900">
            <style>{`
                @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .input-field { background: white; border: 1px solid #e2e8f0; border-radius: 16px; transition: all 0.2s; }
                .input-field:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
            `}</style>

            <div className="absolute top-6 left-6 z-50 fade-up">
                <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 hover:text-blue-600 transition-colors">
                    AFTERM
                </Link>
            </div>

            {/* 배경 장식 */}
            {step !== "result" && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden">
                    <Cloud className="absolute top-20 left-10 w-24 h-24" />
                    <Key className="absolute bottom-20 right-10 w-24 h-24" />
                    <ShoppingBag className="absolute top-1/2 left-20 w-32 h-32" />
                    <Music className="absolute top-1/3 right-20 w-20 h-20" />
                </div>
            )}

            {/* ── LANDING ── */}
            {step === "landing" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6 pt-10">
                    <div className="w-24 h-24 rounded-[32px] bg-white shadow-xl shadow-blue-500/10 border border-slate-100 flex items-center justify-center fade-up">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="text-center fade-up delay-100">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">고인 디지털 유산 찾기</h1>
                        <p className="text-slate-500 text-lg">사망 후 고인이 남긴 계정정보와 구독정보를<br className="md:hidden" /> 안전하게 확인하세요.</p>
                    </div>
                    <div className="w-full max-w-sm mt-4 fade-up delay-200">
                        <button onClick={() => setStep("name")}
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                            시작하기 <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest fade-up delay-200 mt-2">SECURED BY AFTERM</p>
                </div>
            )}

            {/* ── NAME ── */}
            {step === "name" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">
                        열람자(가디언즈) 이름을<br />입력해주세요
                    </h1>
                    <p className="text-slate-500 text-center fade-up delay-100">고인이 사전 지정한 가디언즈의 이름입니다.</p>
                    <div className="w-full max-w-sm fade-up delay-200 space-y-4">
                        <div className="w-full h-14 input-field flex items-center gap-3 px-5">
                            <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <input autoFocus type="text" placeholder="본인 성함 (예: 홍길동)"
                                value={guardianName} onChange={e => setGuardianName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && guardianName && setStep("method")}
                                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 font-medium outline-none" />
                            <button onClick={() => guardianName && setStep("method")} disabled={!guardianName}
                                className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-20 transition-all">
                                다음
                            </button>
                        </div>
                        <button onClick={() => { setGuardianName(""); setStep("landing"); }}
                            className="w-full text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                            ← 뒤로 가기
                        </button>
                    </div>
                </div>
            )}

            {/* ── METHOD (열람 방식 선택) ── */}
            {step === "method" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">열람 방식 선택</h1>
                    <p className="text-slate-500 text-center fade-up delay-100">
                        <span className="font-bold text-slate-800">{guardianName}</span>님, 방식을 선택해주세요
                    </p>

                    <div className="w-full max-w-sm space-y-3 fade-up delay-200">
                        {/* 사망진단서로 열기 — 활성화! */}
                        <button
                            onClick={() => { setOcrStatus("idle"); setOcrError(""); setStep("ocr-info"); }}
                            className="w-full p-4 rounded-2xl border-2 border-slate-800 bg-white hover:bg-slate-50 flex flex-col gap-2 text-left transition-all group active:scale-[0.98] shadow-md shadow-slate-500/10"
                        >
                            <div className="flex justify-between items-center">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-slate-700" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="font-bold text-slate-900 mt-1">사망진단서로 열기</p>
                            <p className="text-xs text-slate-500">OCR 자동 인증 — API 키 없이 열람 가능</p>
                        </button>

                        {/* API 키로 열기 */}
                        <button onClick={() => setStep("form")}
                            className="w-full p-4 rounded-2xl border-2 border-blue-500 bg-white hover:bg-blue-50/50 flex flex-col gap-2 text-left transition-all group active:scale-[0.98] shadow-md shadow-blue-500/10">
                            <div className="flex justify-between items-center">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Key className="w-5 h-5 text-blue-600" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-blue-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="font-bold text-blue-900 mt-1">API 키로 열기</p>
                            <p className="text-xs text-blue-600/80">고인이 공유한 에프텀 전용 API 키 입력</p>
                        </button>

                        <button onClick={() => setStep("name")} className="w-full mt-4 text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                            ← 이전 단계로
                        </button>
                    </div>
                </div>
            )}

            {/* ── OCR-INFO (고인 정보 입력) ── */}
            {step === "ocr-info" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6 py-20">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center fade-up">
                        <FileText className="w-7 h-7 text-slate-700" />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">고인 정보 입력</h1>
                    <p className="text-slate-500 text-center text-sm fade-up delay-100 leading-relaxed">
                        아래 정보가 사망진단서 내용과 일치해야<br />열람이 허용됩니다.
                    </p>

                    <div className="w-full max-w-sm space-y-4 fade-up delay-200">
                        {/* 고인 성함 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">고인 성함</label>
                            <div className="w-full h-14 input-field flex items-center gap-3 px-4">
                                <User className="w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="예: 홍길동"
                                    value={ocrDeceasedName} onChange={e => setOcrDeceasedName(e.target.value)}
                                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-300 font-medium outline-none" />
                            </div>
                        </div>

                        {/* 고인 생년월일 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">고인 생년월일</label>
                            <div className="w-full h-14 input-field flex items-center gap-3 px-4">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                <input type="text" placeholder="예: 19601231 (8자리)"
                                    value={ocrDeceasedBirth}
                                    onChange={e => setOcrDeceasedBirth(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-300 font-medium outline-none tracking-widest" />
                            </div>
                        </div>

                        {/* 고인 전화번호 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">고인 전화번호</label>
                            <div className="w-full h-14 input-field flex items-center gap-3 px-4">
                                <Phone className="w-5 h-5 text-slate-400" />
                                <input type="tel" placeholder="010-0000-0000"
                                    value={ocrDeceasedPhone}
                                    onChange={e => setOcrDeceasedPhone(formatPhone(e.target.value))}
                                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-300 font-medium outline-none" />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (!ocrDeceasedName || !ocrDeceasedBirth || !ocrDeceasedPhone) {
                                    setOcrError("모든 항목을 입력해주세요."); return;
                                }
                                setOcrError("");
                                setStep("ocr-upload");
                            }}
                            disabled={!ocrDeceasedName || !ocrDeceasedBirth || !ocrDeceasedPhone}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
                            다음 — 사망진단서 업로드 <ArrowRight className="w-5 h-5" />
                        </button>

                        {ocrError && (
                            <p className="text-rose-500 text-sm font-medium text-center">{ocrError}</p>
                        )}

                        <button onClick={() => setStep("method")} className="w-full text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                            ← 이전 단계로
                        </button>
                    </div>
                </div>
            )}

            {/* ── OCR-UPLOAD (사망진단서 업로드 & 인증) ── */}
            {step === "ocr-upload" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6">
                    {/* 히든 파일 인풋 */}
                    <input ref={fileInputRef} type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                        capture="environment"
                        className="hidden"
                        onChange={handleOcrFileChange} />

                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center fade-up">
                        <FileText className="w-7 h-7 text-slate-700" />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">사망진단서 업로드</h1>
                    <p className="text-slate-500 text-center text-sm fade-up delay-100 leading-relaxed">
                        사망진단서 또는 사체검안서 사진을<br />업로드해주세요.
                    </p>

                    <div className="w-full max-w-sm fade-up delay-200 space-y-4">
                        <AnimatePresence mode="wait">
                            {/* 대기 상태 */}
                            {ocrStatus === "idle" && (
                                <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white hover:border-slate-400 transition-all cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-100 transition-all">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 mb-4">파일을 선택하거나 여기를 탭하세요</p>
                                    <div className="flex gap-3 justify-center">
                                        <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                                            <Upload className="w-3.5 h-3.5" /> 파일 선택
                                        </button>
                                        <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                                            <Camera className="w-3.5 h-3.5" /> 카메라
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* 분석 중 */}
                            {ocrStatus === "loading" && (
                                <motion.div key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="border border-slate-200 rounded-2xl p-8 text-center bg-white">
                                    <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                                    <p className="text-sm font-bold text-slate-700 mb-1">사망진단서를 분석 중입니다</p>
                                    <p className="text-xs text-slate-400">AI가 문서를 읽고 이름과 생년월일을 확인하고 있어요...</p>
                                </motion.div>
                            )}

                            {/* 오류 */}
                            {ocrStatus === "error" && (
                                <motion.div key="error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="border border-rose-200 rounded-2xl p-6 bg-rose-50">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <XCircle className="w-6 h-6 text-rose-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-rose-800 mb-1">인증 실패</p>
                                            <p className="text-xs text-rose-500 mb-4">{ocrError}</p>
                                            <button type="button" onClick={() => { setOcrStatus("idle"); setOcrError(""); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all">
                                                <Upload className="w-3.5 h-3.5" /> 다시 시도
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="text-[10px] text-slate-400 text-center leading-relaxed px-4">
                            🔒 업로드된 이미지는 서버에 저장되지 않습니다.<br />
                            OCR 인식 결과(이름, 생년월일)만 검증에 사용됩니다.
                        </p>

                        <button onClick={() => { setOcrStatus("idle"); setOcrError(""); setStep("ocr-info"); }}
                            className="w-full text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                            ← 이전 단계로
                        </button>
                    </div>
                </div>
            )}

            {/* ── FORM (API 키 경로) ── */}
            {step === "form" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6 py-20">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">필수 정보 입력</h1>
                    <p className="text-slate-500 text-center fade-up delay-100">열람 권한 확인을 위해 모든 정보를 정확히 입력해주세요.</p>

                    <div className="w-full max-w-sm space-y-5 fade-up delay-200">
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">고인 성함</label>
                                <div className="w-full h-14 input-field flex items-center gap-3 px-4">
                                    <User className="w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="예: 홍길동"
                                        value={deceasedName} onChange={e => setDeceasedName(e.target.value)}
                                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-300 font-medium outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">고인 전화번호</label>
                                <div className="w-full h-14 input-field flex items-center gap-3 px-4">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <input type="tel" placeholder="010-0000-0000"
                                        value={deceasedPhone} onChange={e => setDeceasedPhone(formatPhone(e.target.value))}
                                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-300 font-medium outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">공유받은 API 키</label>
                                <div className="w-full h-14 input-field flex items-center gap-3 px-4">
                                    <Key className="w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="afterm-xxxx..."
                                        value={apiKey} onChange={e => setApiKey(e.target.value)}
                                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-300 font-medium font-mono text-sm outline-none" />
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100/50 text-rose-600 flex items-start gap-2 shadow-sm">
                                <span className="text-rose-500 mt-0.5">⚠️</span>
                                <p className="leading-relaxed text-sm font-medium">{errorMsg}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button onClick={handleApiKeySubmit} disabled={isLoading || !deceasedName || !deceasedPhone || !apiKey}
                                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> 인증 진행 중...</>
                                ) : (
                                    <><Lock className="w-5 h-5" /> 유산 열람하기</>
                                )}
                            </button>
                            <button onClick={() => { setDeceasedName(""); setDeceasedPhone(""); setApiKey(""); setErrorMsg(""); setStep("method"); }}
                                disabled={isLoading} className="w-full mt-4 text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                                ← 이전 단계로
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RESULT ── */}
            {step === "result" && result && (
                <div className="relative z-10 min-h-screen py-16 px-4 sm:px-6 flex flex-col items-center fade-up bg-slate-50/50">
                    <div className="w-full max-w-2xl text-center mb-10">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-[1.25rem] bg-green-400 shadow-md shadow-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-[22px] font-extrabold text-slate-900 mb-1">열람 완료</h1>
                        <p className="text-slate-500 text-sm">
                            <span className="font-bold text-slate-800">{result.deceasedName}</span>님의 디지털 유산이 공개되었습니다.
                        </p>

                        {/* OCR 경로로 열람한 경우 API 키 표시 */}
                        {result.apiKey && (
                            <div className="mt-4 mx-auto max-w-sm bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left">
                                <p className="text-xs font-bold text-blue-600 mb-1">📋 고인의 에프텀 API 키</p>
                                <p className="text-xs text-blue-500 mb-3">이 키를 보관해두시면 추후 API 키 방식으로도 열람하실 수 있습니다.</p>
                                <div className="flex items-center gap-2 bg-white rounded-xl border border-blue-100 px-3 py-2">
                                    <code className="text-xs font-mono text-slate-800 flex-1 break-all">{result.apiKey}</code>
                                    <button onClick={() => navigator.clipboard.writeText(result.apiKey!)}
                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors flex-shrink-0">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    </div>

                    {/* ── 대행 서비스 배너 ── */}
                    <div className="w-full max-w-3xl mb-12 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
                        {/* 1. 자동 해지 배너 */}
                        <div 
                            onClick={() => setActiveService("cancel-loading")}
                            className="bg-white rounded-[24px] p-5 border border-rose-100 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex items-start gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Trash2 className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                                    구독/계정 자동 해지 대행 <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                                </h3>
                                <p className="text-xs text-slate-500 leading-snug">고인의 유료 결제 및 SNS 계정 탈퇴 처리를 대신 진행해 드립니다.</p>
                            </div>
                        </div>

                        {/* 2. 환급금 찾기 배너 */}
                        <div 
                            onClick={() => setActiveService("benefits-loading1")}
                            className="bg-white rounded-[24px] p-5 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex items-start gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Search className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                                    유가족 숨은 지원금 찾기 <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </h3>
                                <p className="text-xs text-slate-500 leading-snug">놓치기 쉬운 장제비, 보험 환급금 등 1분 만에 모두 찾아보세요.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-[1200px] overflow-hidden relative">
                        {result.vaultItems.length > 0 ? (
                            <VaultAccordion items={result.vaultItems} />
                        ) : (
                            <div className="text-center py-20 bg-white mx-5 rounded-3xl border border-slate-200 shadow-sm mt-6">
                                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">등록된 디지털 유산이 없습니다</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── 대행 서비스 모달/오버레이 ── */}
            <AnimatePresence>
                {/* 1. 자동 해지 모달 */}
                {(activeService === "cancel-loading" || activeService === "cancel-done") && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                        <div className="fixed inset-0 flex items-center justify-center z-[101] px-4">
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center">
                                {activeService === "cancel-loading" ? (
                                    <>
                                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 relative">
                                            <div className="absolute inset-0 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                                            <Trash2 className="w-8 h-8 text-rose-500 animate-pulse" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">자동 해지 접수 중...</h3>
                                        <p className="text-sm text-slate-500">해지 가능 계정을 확인하고 있습니다.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">해지 접수 완료</h3>
                                        <p className="text-sm text-slate-500 mb-6 break-keep">신청하신 계정의 해지 처리가 접수되었습니다.<br/>완료 시 가디언즈 연락처로 안내 메시지를 발송해드립니다.</p>
                                        <button onClick={() => setActiveService("none")} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-[0.98]">
                                            확인
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </>
                )}

                {/* 2. 환급금 찾기 로딩 */}
                {(activeService === "benefits-loading1" || activeService === "benefits-loading2") && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center"
                    >
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50" />
                            <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                                {activeService === "benefits-loading1" && <span className="text-4xl">📄</span>}
                                {activeService === "benefits-loading2" && <span className="text-4xl">👨‍👩‍👧‍👦</span>}
                            </div>
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                <motion.circle cx="50" cy="50" r="48" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 300" }}
                                    animate={{ strokeDasharray: activeService === "benefits-loading2" ? "200 300" : "100 300" }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }} />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                            {activeService === "benefits-loading1" ? "사망진단서 기록 확인 중..." : "수령 가능한 혜택 계산 중..."}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {activeService === "benefits-loading1" ? "정부 공공 데이터를 조회하고 있습니다." : "가족관계 연동 데이터를 분석하고 있습니다."}
                        </p>
                    </motion.div>
                )}

                {/* 3. 환급금 찾기 결과 (전체 화면 오버레이) */}
                {activeService === "benefits-result" && result && (
                    <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-slate-50 z-[100] overflow-y-auto"
                    >
                        <div className="w-full bg-white border-b border-slate-200 h-14 flex items-center px-4 sticky top-0 z-[101]">
                            <button onClick={() => setActiveService("none")} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                            <span className="ml-2 font-bold text-slate-900">지원금 조회 결과</span>
                        </div>
                        
                        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 text-center"
                            >
                                <p className="text-slate-500 font-medium mb-3">
                                    <span className="font-bold text-slate-800">{result.deceasedName}</span>님 유가족이 받을 수 있는 총 지원금
                                </p>
                                <div className="flex items-center justify-center gap-1 mb-6">
                                    <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                                        {mockBenefits.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                                    </span>
                                    <span className="text-2xl text-slate-600 font-bold mb-1">원</span>
                                </div>
                                <button onClick={() => alert("MVP 버전입니다.")} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                                    지원금 한 번에 신청하기
                                </button>
                            </motion.section>

                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-6 bg-blue-500 rounded-sm"></span> 상세 지원금 내역
                                    </h2>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">총 {mockBenefits.length}건</span>
                                </div>
                                <div className="space-y-3">
                                    {mockBenefits.map((item) => (
                                        <div key={item.id} className="bg-white p-5 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">{item.type}</span>
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {item.status}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                                            </div>
                                            <div className="text-xl font-bold text-slate-900">{item.amount.toLocaleString()}원</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>

                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-6 bg-amber-400 rounded-sm"></span> 필수 행정 처리 기한
                                    </h2>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                                    <div className="absolute left-10 md:left-12 top-10 bottom-10 w-0.5 bg-slate-100"></div>
                                    <div className="space-y-8 relative z-10">
                                        {mockTimeline.map((item) => (
                                            <div key={item.id} className="flex gap-4 md:gap-6 relative">
                                                <div className="flex flex-col items-center mt-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 shadow-sm z-10 ${item.status === 'urgent' ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-400'}`}>
                                                        {item.status === 'urgent' ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                                        {item.title}
                                                        {item.status === 'urgent' && <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">기한 임박</span>}
                                                    </h3>
                                                    <p className="text-sm font-semibold text-rose-600 mb-1">{item.deadline}</p>
                                                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>

                            <div className="mt-12">
                                <button onClick={() => setActiveService("none")} className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]">
                                    디지털 유산 목록으로 돌아가기
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function GuardianOpenPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <GuardianOpenContent />
        </Suspense>
    );
}
