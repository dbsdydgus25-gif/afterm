"use client";

import { useState, Suspense, useLayoutEffect, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Shield, Key, User, Phone, CheckCircle, Lock, ChevronRight, Eye, EyeOff,
    Copy, Check, FileText, ChevronDown, ChevronUp, CreditCard, Music, Cloud,
    Gamepad2, ShoppingBag, Terminal, Users, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── 유틸 ───────────────────────────────────────────────
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
}

type Step = "landing" | "name" | "method" | "form" | "result";

// ─── 카테고리 스타일 맵핑 (최대한 깔끔하게) ─────────────
const CATEGORY_STYLE: Record<string, { icon: any; color: string; bg: string }> = {
    OTT: { icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50" },
    음악: { icon: Music, color: "text-purple-600", bg: "bg-purple-50" },
    클라우드: { icon: Cloud, color: "text-blue-600", bg: "bg-blue-50" },
    게임: { icon: Gamepad2, color: "text-green-600", bg: "bg-green-50" },
    쇼핑: { icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
    "구독 서비스": { icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50" },
    subscription: { icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50" },
    "생산성 툴": { icon: Terminal, color: "text-slate-600", bg: "bg-slate-50" },
    "소셜/커뮤니티": { icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
    기타: { icon: Info, color: "text-slate-500", bg: "bg-slate-50" },
};

// ─── 결과 아코디언 컴포넌트 ─────────────────────────────
function VaultAccordion({ item }: { item: VaultItem }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [copied, setCopied] = useState<"id" | "pw" | null>(null);

    const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];
    const Icon = style.icon;

    const passMatch = item.notes?.match(/패스워드:\s*(.*)/);
    const password = passMatch?.[1]?.trim() ?? null;
    const memoText = item.notes?.replace(/패스워드:\s*.+/g, "").trim() || null;

    const copyToClipboard = (e: React.MouseEvent, text: string, type: "id" | "pw") => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mb-3 transition-all hover:shadow-md">
            {/* Header (Always visible) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left bg-white outline-none active:bg-slate-50/50"
            >
                <div className="flex items-center gap-4">
                    {/* 카테고리 아이콘 영역 (그라데이션 둥근 사각형 안에 작은 카드 UI 등) */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center border border-rose-100/50 flex-shrink-0 relative overflow-hidden">
                        <div className="w-8 h-6 bg-yellow-100 rounded border border-yellow-200 flex flex-col items-center justify-center shadow-sm">
                            <div className="w-full h-1 bg-blue-900/10 mb-1" />
                            <div className="w-4 h-1 bg-yellow-600/20 rounded-full" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[17px] font-bold text-slate-800 tracking-tight leading-snug">{item.platform_name}</h3>
                        <span className="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-rose-500 bg-rose-50 border border-rose-100 uppercase tracking-widest">
                            {item.category === "기타" ? "subscription" : item.category}
                        </span>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden border-t border-slate-50"
                    >
                        <div className="p-5 pt-4 space-y-4 bg-white">

                            {/* 메모 텍스트 (스크린샷처럼 직관적인 회색 라운드 박스) */}
                            {memoText && (
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 mb-1 ml-1">메모</p>
                                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{memoText}</p>
                                    </div>
                                </div>
                            )}

                            {/* 아이디 */}
                            {item.account_id && (
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 mb-1 ml-1">아이디 / 이메일</p>
                                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                                        <p className="text-sm font-mono text-slate-700">{item.account_id}</p>
                                        <button onClick={(e) => copyToClipboard(e, item.account_id!, "id")} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                            {copied === "id" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 비밀번호 */}
                            {password && (
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 mb-1 ml-1">비밀번호</p>
                                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                                        <p className="text-sm font-mono text-slate-700 tracking-wider">
                                            {showPass ? password : "•".repeat(Math.min(password.length, 12))}
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowPass(!showPass)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={(e) => copyToClipboard(e, password, "pw")} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                                {copied === "pw" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!memoText && !item.account_id && !password && (
                                <p className="text-xs text-slate-400 text-center py-2">상세 정보가 비어있습니다.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


// ─── 메인 컴포넌트 ──────────────────────────────────────────
function GuardianOpenContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("uid");

    const [step, setStep] = useState<Step>("landing");

    // 폼 상태
    const [guardianName, setGuardianName] = useState("");
    const [deceasedName, setDeceasedName] = useState("");
    const [deceasedPhone, setDeceasedPhone] = useState("");
    const [apiKey, setApiKey] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<OpenResult | null>(null);

    const resetForm = () => {
        setDeceasedName("");
        setDeceasedPhone("");
        setApiKey("");
        setErrorMsg("");
    };

    const handlePrevToName = () => {
        setGuardianName("");
        setStep("landing");
    };

    const handlePrevToMethod = () => {
        setStep("name");
    };

    const handlePrevToForm = () => {
        resetForm();
        setStep("method");
    };

    const formatPhone = (v: string) => {
        const n = v.replace(/[^0-9]/g, "").slice(0, 11);
        if (n.length > 7) return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
        if (n.length > 3) return `${n.slice(0, 3)}-${n.slice(3)}`;
        return n;
    };

    const handleSubmit = async () => {
        if (!guardianName || !deceasedName || !deceasedPhone || !apiKey) {
            setErrorMsg("모든 항목을 입력해주세요."); return;
        }
        setIsLoading(true);
        setErrorMsg("");
        try {
            // 변경: 항상 통합된 verify-open 라우트로 요청합니다. param userId도 함께 전송 (보안상 더 안전)
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

            {/* 랜딩뷰 등에서는 희미한 아이콘만. 시끄러운 움직임 제거. */}
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
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
                            고인 디지털 유산 찾기
                        </h1>
                        <p className="text-slate-500 text-lg">
                            사망 후 고인이 남긴 계정정보와 구독정보를<br className="md:hidden" /> 안전하게 확인하세요.
                        </p>
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
                        <button onClick={handlePrevToName} className="w-full text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                            ← 뒤로 가기
                        </button>
                    </div>
                </div>
            )}

            {/* ── METHOD ── */}
            {step === "method" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">
                        열람 방식 선택
                    </h1>
                    <p className="text-slate-500 text-center fade-up delay-100">
                        <span className="font-bold text-slate-800">{guardianName}</span>님, 방식을 선택해주세요
                    </p>

                    <div className="w-full max-w-sm space-y-3 fade-up delay-200">
                        <div className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 flex flex-col gap-2 opacity-50 cursor-not-allowed">
                            <div className="flex justify-between items-center">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><FileText className="w-5 h-5 text-slate-400" /></div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">준비중</span>
                            </div>
                            <p className="font-bold text-slate-800 mt-1">사망진단서로 열기</p>
                            <p className="text-xs text-slate-500">OCR 자동 인증 및 처리</p>
                        </div>

                        <button onClick={() => setStep("form")}
                            className="w-full p-4 rounded-2xl border-2 border-blue-500 bg-white hover:bg-blue-50/50 flex flex-col gap-2 text-left transition-all group active:scale-[0.98] shadow-md shadow-blue-500/10">
                            <div className="flex justify-between items-center">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Key className="w-5 h-5 text-blue-600" /></div>
                                <ChevronRight className="w-5 h-5 text-blue-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="font-bold text-blue-900 mt-1">API 키로 열기</p>
                            <p className="text-xs text-blue-600/80">고인이 공유한 에프텀 전용 API 키 입력</p>
                        </button>

                        <button onClick={handlePrevToMethod} className="w-full mt-4 text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                            ← 이전 단계로
                        </button>
                    </div>
                </div>
            )}

            {/* ── FORM ── */}
            {step === "form" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6 py-20">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center tracking-tight fade-up">
                        필수 정보 입력
                    </h1>
                    <p className="text-slate-500 text-center fade-up delay-100">
                        열람 권한 확인을 위해 모든 정보를 정확히 입력해주세요.
                    </p>

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
                            <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100/50 text-rose-600 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <span className="text-rose-500 mt-0.5">⚠️</span>
                                <p className="leading-relaxed text-sm font-medium">{errorMsg}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button onClick={handleSubmit} disabled={isLoading || !deceasedName || !deceasedPhone || !apiKey}
                                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 인증 진행 중...</>
                                ) : (
                                    <><Lock className="w-5 h-5" /> 유산 열람하기</>
                                )}
                            </button>
                            <button onClick={handlePrevToForm} disabled={isLoading} className="w-full mt-4 text-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                                ← 이전 단계로
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RESULT (Accordion List) ── */}
            {step === "result" && result && (
                <div className="relative z-10 min-h-screen py-16 px-4 sm:px-6 flex flex-col items-center fade-up bg-slate-50/50">
                    <div className="w-full max-w-2xl text-center mb-10">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-[1.25rem] bg-green-400 shadow-md shadow-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-[22px] font-extrabold text-slate-900 mb-1">열람 완료</h1>
                        <p className="text-slate-500 text-sm">
                            <span className="font-bold text-slate-800">{result.deceasedName}</span>님의 디지털 유산이 공개되었습니다.<br />
                            좌우로 드래그하고 터치하여 상세정보를 확인하세요.
                        </p>
                    </div>

                    <div className="w-full max-w-md mx-auto">
                        <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-4 flex gap-3 items-start mb-6">
                            <div className="w-6 h-6 rounded bg-slate-400 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
                                <Info className="w-4 h-4" />
                            </div>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                보호된 정보입니다. 각 카드를 터치하면 고인이 남겨둔 아이디 및 비밀번호를 확인할 수 있습니다.
                            </p>
                        </div>

                        {/* 아코디언 카드 리스트 */}
                        <div className="space-y-1">
                            {result.vaultItems.length > 0 ? (
                                result.vaultItems.map(item => (
                                    <VaultAccordion key={item.id} item={item} />
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm mt-6">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">등록된 디지털 유산이 없습니다</p>
                                </div>
                            )}
                        </div>

                        {/* 하단 투명 여백 */}
                        <div className="h-20" />
                    </div>
                </div>
            )}
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
