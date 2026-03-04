"use client";

/**
 * /guardians/open 페이지
 * 밝고 프리미엄한 디자인 (원형 회전 아이콘 + 카드 리프트 스택 모션)
 */

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Key, User, Phone, CheckCircle, Lock, ChevronRight, Eye, EyeOff, FileText, ChevronDown, Copy, Check, Music, Cloud, ShoppingBag, Gamepad2, Star, Globe } from "lucide-react";

// ─── 타입 ───────────────────────────────────────────────
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
    messages: { id: string; content: string; recipient_name: string }[];
    messagesReleased: number;
}

type Step = "landing" | "name" | "method" | "form" | "result";

// ─── 카테고리 스타일 (밝은 테마에 맞춤) ───────────────────────
const CATEGORY_STYLE: Record<string, { emoji: string; color: string; bg: string }> = {
    OTT: { emoji: "🎬", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    음악: { emoji: "🎵", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    클라우드: { emoji: "☁️", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    게임: { emoji: "🎮", color: "text-green-600", bg: "bg-green-50 border-green-100" },
    쇼핑: { emoji: "🛍️", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    "구독 서비스": { emoji: "💳", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    subscription: { emoji: "💳", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    "생산성 툴": { emoji: "🛠️", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    "소셜/커뮤니티": { emoji: "👥", color: "text-sky-600", bg: "bg-sky-50 border-sky-100" },
    기타: { emoji: "🌐", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
};

// ─── 유산 카드 (리프트 모션 & 스택) ─────────────────────────
function VaultCard({ item, index, total }: { item: VaultItem; index: number; total: number }) {
    const [expanded, setExpanded] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [copied, setCopied] = useState<"id" | "pw" | null>(null);

    const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];

    const passMatch = item.notes?.match(/패스워드:\s*(.+)/);
    const password = passMatch?.[1]?.trim() ?? null;
    const memoText = item.notes?.replace(/패스워드:\s*.+/g, "").trim() || null;

    const copyToClipboard = (text: string, type: "id" | "pw") => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    // 스택 효과: 뒤에 있는 카드가 위로 겹쳐지며 줄어듦
    const reverseIndex = total - index - 1;
    const isStacked = !expanded;

    return (
        <div
            className={`relative bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:z-50 ${expanded ? "z-40 my-4 shadow-lg scale-100" : "z-10"}`}
            style={isStacked ? {
                marginBottom: "-2rem",
                transform: `scale(${1 - index * 0.03}) translateY(${index * 10}px)`,
                opacity: 1 - index * 0.1
            } : {}}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-slate-50/50 rounded-3xl"
            >
                <div className={`w-14 h-14 rounded-2xl border ${style.bg} flex items-center justify-center flex-shrink-0 text-2xl shadow-inner`}>
                    {style.emoji}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-lg truncate mb-1">{item.platform_name}</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.color}`}>
                            {item.category}
                        </span>
                        {item.account_id && (
                            <span className="text-xs text-slate-400 font-mono truncate">
                                {item.account_id.slice(0, 3)}{"•".repeat(Math.max(0, item.account_id.length - 3))}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${expanded ? "rotate-180" : ""}`} />
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl space-y-4 mt-2">
                    {item.account_id && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">아이디 / 이메일</p>
                            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                                <p className="text-sm font-mono text-slate-700 break-all">{item.account_id}</p>
                                <button onClick={() => copyToClipboard(item.account_id!, "id")} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                    {copied === "id" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {password && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">비밀번호</p>
                            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                                <p className="text-sm font-mono text-slate-700 break-all">
                                    {showPass ? password : "•".repeat(Math.min(password.length, 16))}
                                </p>
                                <div className="flex gap-1">
                                    <button onClick={() => setShowPass(!showPass)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => copyToClipboard(password, "pw")} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                        {copied === "pw" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {memoText && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">메모</p>
                            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {memoText}
                                </p>
                            </div>
                        </div>
                    )}

                    {!item.account_id && !password && !memoText && (
                        <p className="text-xs text-slate-400 text-center py-4 bg-white rounded-2xl border border-slate-100">등록된 상세 정보가 없습니다</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── 원형 아이콘 애니메이션 백그라운드 ──────────────────────────
const CircularIconsBg = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
            <style>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .circle-container { 
                    position: absolute;
                    width: 700px;
                    height: 700px;
                    animation: spin-slow 60s linear infinite;
                }
                .circle-item {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    margin: -32px 0 0 -32px; /* 64px/2 */
                    width: 64px;
                    height: 64px;
                }
                .circle-item-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 20px;
                    background: white;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(0,0,0,0.02);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: spin-slow 60s linear infinite reverse; /* 아이콘 자체는 똑바로 보이게 */
                }
            `}</style>

            <div className="circle-container opacity-60">
                {[Music, Cloud, ShoppingBag, Gamepad2, Star, Globe, Lock, FileText, Key, Shield, User, Phone].map((Icon, i, arr) => {
                    const angle = (i / arr.length) * 360;
                    const radius = 300; // 원지름 600
                    const rad = angle * Math.PI / 180;
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;
                    return (
                        <div key={i} className="circle-item transition-all" style={{ transform: `translate(${x}px, ${y}px)` }}>
                            <div className="circle-item-inner">
                                <Icon className="w-7 h-7 text-slate-300" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 가운데 화이트 블러 그라데이션 */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white"></div>
        </div>
    );
};

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

    // 폼 초기화 로직 (이전 이동 시)
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
        resetForm(); // 이전 누르면 폼 초기화 보장
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
            const endpoint = userId ? "/api/guardians/verify-open" : "/api/guardians/find-by-key";
            const body = userId
                ? { userId, guardianName, guardianPhone: deceasedPhone, apiKey }
                : { guardianName, deceasedName, deceasedPhone, apiKey };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
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
        <div className="relative w-full min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            <style>{`
                @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .input-field { background: white; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s; }
                .input-field:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
            `}</style>

            {/* 결과 화면이 아닐 때만 원형 배경 표시 */}
            {step !== "result" && <CircularIconsBg />}

            {/* ── LANDING ── */}
            {step === "landing" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6 pt-10">
                    <div className="w-24 h-24 rounded-[32px] bg-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.2)] border border-slate-100 flex items-center justify-center fade-up">
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
                        <div className="w-full h-14 rounded-2xl input-field flex items-center gap-3 px-5">
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

                    <div className="w-full max-w-sm space-y-4 fade-up delay-200">
                        <div className="space-y-3 p-1">
                            {/* 고인 이름 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">고인 성함</label>
                                <div className="w-full h-14 rounded-2xl input-field flex items-center gap-3 px-4">
                                    <User className="w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="예: 홍길동"
                                        value={deceasedName} onChange={e => setDeceasedName(e.target.value)}
                                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 font-medium outline-none" />
                                </div>
                            </div>
                            {/* 고인 전화번호 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">고인 전화번호</label>
                                <div className="w-full h-14 rounded-2xl input-field flex items-center gap-3 px-4">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <input type="tel" placeholder="010-0000-0000"
                                        value={deceasedPhone} onChange={e => setDeceasedPhone(formatPhone(e.target.value))}
                                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 font-medium outline-none" />
                                </div>
                            </div>
                            {/* API 키 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">공유받은 API 키</label>
                                <div className="w-full h-14 rounded-2xl input-field flex items-center gap-3 px-4">
                                    <Key className="w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="afterm-xxxx..."
                                        value={apiKey} onChange={e => setApiKey(e.target.value)}
                                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 font-medium font-mono text-sm outline-none" />
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="mt-0.5">⚠️</span>
                                <p className="leading-relaxed">{errorMsg}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button onClick={handleSubmit} disabled={isLoading || !deceasedName || !deceasedPhone || !apiKey}
                                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
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

            {/* ── RESULT ── */}
            {step === "result" && result && (
                <div className="relative z-10 min-h-screen pb-24 fade-up">
                    {/* 상단 프로필 헤더 */}
                    <div className="bg-white border-b border-slate-200 px-6 py-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pointer-events-none" />

                        <div className="relative z-10 w-20 h-20 mx-auto rounded-3xl bg-green-500 shadow-lg shadow-green-500/20 border-4 border-white flex items-center justify-center mb-5 rotate-3 hover:rotate-0 transition-transform">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">열람 완료</h1>
                        <p className="text-slate-500">
                            <span className="font-bold text-slate-800">{result.deceasedName}</span>님의 디지털 유산이 공개되었습니다.
                        </p>

                        {result.messagesReleased > 0 && (
                            <div className="inline-flex mt-5 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {result.messagesReleased}건의 유언 메시지가 수신자에게 전송되었습니다.
                            </div>
                        )}
                    </div>

                    <div className="max-w-lg mx-auto w-full px-5">
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 my-6 flex items-start gap-3">
                            <span className="mt-0.5 text-blue-500">ℹ️</span>
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                보호된 정보입니다. 각 카드를 터치하면 고인이 남겨둔 아이디 및 비밀번호를 확인할 수 있습니다.
                            </p>
                        </div>

                        {/* 카드 스택 목록 */}
                        {result.vaultItems.length > 0 ? (
                            <div className="flex flex-col relative pb-20">
                                {result.vaultItems.map((item, i) => (
                                    <VaultCard key={item.id} item={item} index={i} total={result.vaultItems.length} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm mt-6">
                                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">등록된 디지털 유산이 없습니다</p>
                            </div>
                        )}
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
