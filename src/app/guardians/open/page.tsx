"use client";

/**
 * /guardians/open 페이지
 * 가디언즈(유가족)가 고인의 디지털 유산을 열람하는 페이지
 * 플로우: 랜딩 → 이름 입력 → 방식 선택 → API키 폼 → 결과
 */

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Shield, Key, User, Phone, CheckCircle,
    Lock, FileText, ChevronRight, Eye, EyeOff,
    Music, Cloud, ShoppingBag, Gamepad2, Star, Globe,
    ChevronDown, Copy, Check
} from "lucide-react";

// ─── 타입 정의 ───────────────────────────────────────────────
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

// ─── 카테고리 스타일 ──────────────────────────────────────────
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

// ─── 배경 플로팅 아이콘 ───────────────────────────────────────
const FloatingIcons = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
            @keyframes spin-bg { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes spin-bg-r { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
            .spin-bg { animation: spin-bg 90s linear infinite }
            .spin-bg-r { animation: spin-bg-r 70s linear infinite }
        `}</style>
        {/* 바깥 링 */}
        <div className="absolute inset-0 spin-bg-r" style={{ perspective: "1000px" }}>
            <div className="absolute top-1/2 left-1/2 w-[1600px] h-[1600px]"
                style={{ transform: "translate(-50%,-50%)" }}>
                {[Lock, Key, Shield, FileText, CheckCircle, Globe, Star, Music, Cloud, ShoppingBag].map((Icon, i) => {
                    const a = (i / 10) * 360;
                    const r = (a * Math.PI) / 180;
                    return (
                        <div key={i} className="absolute opacity-10"
                            style={{ left: `${50 + 47 * Math.cos(r)}%`, top: `${50 + 47 * Math.sin(r)}%` }}>
                            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-blue-300" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        {/* 안쪽 링 */}
        <div className="absolute inset-0 spin-bg" style={{ perspective: "1000px" }}>
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px]"
                style={{ transform: "translate(-50%,-50%)" }}>
                {[Gamepad2, ShoppingBag, Star, Lock, Key, Music].map((Icon, i) => {
                    const a = (i / 6) * 360;
                    const r = (a * Math.PI) / 180;
                    return (
                        <div key={i} className="absolute opacity-15"
                            style={{ left: `${50 + 47 * Math.cos(r)}%`, top: `${50 + 47 * Math.sin(r)}%` }}>
                            <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-blue-300" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        {/* 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
    </div>
);

// ─── 유산 카드 (클릭 시 아이디/비밀번호 표시) ────────────────
function VaultCard({ item, index }: { item: VaultItem; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [copied, setCopied] = useState<"id" | "pw" | null>(null);

    const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];

    // notes에서 비밀번호 추출
    const passMatch = item.notes?.match(/패스워드:\s*(.+)/);
    const password = passMatch?.[1]?.trim() ?? null;
    // notes에서 비밀번호 줄 제외한 나머지 메모
    const memoText = item.notes?.replace(/패스워드:\s*.+/g, "").trim() || null;

    const copyToClipboard = (text: string, type: "id" | "pw") => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${expanded ? "shadow-md" : "hover:shadow-md"}`}
            style={{ animationDelay: `${index * 0.05}s` }}>
            {/* 카드 헤더 - 클릭으로 펼치기 */}
            <button
                onClick={() => setExpanded(p => !p)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
            >
                {/* 카테고리 아이콘 */}
                <div className={`w-11 h-11 rounded-xl border ${style.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
                    {style.emoji}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{item.platform_name}</p>
                    {/* 미리보기: 아이디 (마스킹) */}
                    {item.account_id && (
                        <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                            {item.account_id.slice(0, 3)}{"•".repeat(Math.max(0, item.account_id.length - 3))}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.color}`}>
                        {item.category}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
                </div>
            </button>

            {/* 확장 영역 - 아이디/비번 표시 */}
            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 space-y-3">
                    {/* 아이디 */}
                    {item.account_id && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">아이디 / 이메일</p>
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                                <p className="flex-1 text-sm font-mono text-slate-700 break-all">{item.account_id}</p>
                                <button
                                    onClick={() => copyToClipboard(item.account_id!, "id")}
                                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    title="복사"
                                >
                                    {copied === "id" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 비밀번호 */}
                    {password && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">비밀번호</p>
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                                <p className="flex-1 text-sm font-mono text-slate-700 break-all">
                                    {showPass ? password : "•".repeat(Math.min(password.length, 16))}
                                </p>
                                <button onClick={() => setShowPass(p => !p)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                    {showPass ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                                </button>
                                <button
                                    onClick={() => copyToClipboard(password, "pw")}
                                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    title="복사"
                                >
                                    {copied === "pw" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 메모 */}
                    {memoText && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">메모</p>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap bg-white rounded-xl border border-slate-200 px-3 py-2.5 leading-relaxed">
                                {memoText}
                            </p>
                        </div>
                    )}

                    {/* 아무 정보도 없는 경우 */}
                    {!item.account_id && !password && !memoText && (
                        <p className="text-xs text-slate-400 text-center py-2">등록된 상세 정보가 없습니다</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── 메인 컨텐트 ─────────────────────────────────────────────
function GuardianOpenContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("uid");

    // 멀티스텝 상태
    const [step, setStep] = useState<Step>("landing");
    const [guardianName, setGuardianName] = useState("");
    const [deceasedName, setDeceasedName] = useState("");
    const [deceasedPhone, setDeceasedPhone] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<OpenResult | null>(null);

    // 핸드폰 번호 포맷
    const formatPhone = (v: string) => {
        const n = v.replace(/[^0-9]/g, "").slice(0, 11);
        if (n.length > 7) return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
        if (n.length > 3) return `${n.slice(0, 3)}-${n.slice(3)}`;
        return n;
    };

    /** API 인증 요청 */
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
            setErrorMsg("오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden"
            style={{ backgroundColor: "#09090b", fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes bounceIn { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
                @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.5)} 50%{box-shadow:0 0 50px rgba(59,130,246,0.9)} }
                .fade-up { animation: fadeUp 0.5s ease forwards }
                .bounce-in { animation: bounceIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards }
                .glow { animation: glow 2.5s ease-in-out infinite }
            `}</style>

            <FloatingIcons />

            {/* ── LANDING ─────────────────────────────────── */}
            {step === "landing" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-6">
                    <div className="w-24 h-24 rounded-3xl glow bounce-in overflow-hidden ring-1 ring-white/10">
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex flex-col items-center justify-center gap-1">
                            <Shield className="w-9 h-9 text-white" />
                            <span className="text-[9px] font-black text-blue-100 tracking-widest">AFTERM</span>
                        </div>
                    </div>
                    <div className="text-center fade-up">
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">고인 디지털 유산 찾기</h1>
                        <p className="text-slate-400 text-base">사망 후 고인이 남긴 계정·구독 정보를<br />안전하게 확인하세요.</p>
                    </div>
                    <button onClick={() => setStep("name")}
                        className="w-full max-w-sm h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-all active:scale-95 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2 fade-up">
                        시작하기 <ChevronRight className="w-5 h-5" />
                    </button>
                    <p className="text-slate-700 text-xs fade-up">고인이 생전에 AFTERM에 등록한 경우에만 이용 가능합니다</p>
                </div>
            )}

            {/* ── NAME ────────────────────────────────────── */}
            {step === "name" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-5">
                    <h1 className="text-3xl font-bold text-white text-center tracking-tight fade-up">
                        열람자(가디언즈) 이름을<br />입력해주세요
                    </h1>
                    <p className="text-slate-400 text-sm text-center fade-up">고인이 지정한 가디언즈의 이름입니다</p>
                    <div className="w-full max-w-sm fade-up">
                        <div className="w-full h-14 rounded-full flex items-center gap-3 px-5"
                            style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
                            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <input autoFocus type="text" placeholder="성함 (예: 홍길동)"
                                value={guardianName}
                                onChange={e => setGuardianName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && guardianName && setStep("method")}
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
                            <button onClick={() => guardianName && setStep("method")} disabled={!guardianName}
                                className="h-9 px-4 rounded-full bg-blue-600 text-white text-xs font-bold disabled:opacity-30 transition-all">
                                다음 →
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setStep("landing")} className="text-slate-600 text-xs hover:text-slate-400">← 이전</button>
                </div>
            )}

            {/* ── METHOD ──────────────────────────────────── */}
            {step === "method" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-5">
                    <h1 className="text-3xl font-bold text-white text-center tracking-tight fade-up">열람 방식 선택</h1>
                    <p className="text-slate-400 text-sm text-center fade-up">
                        <span className="text-white font-semibold">{guardianName}</span>님, 방식을 선택해주세요
                    </p>
                    <div className="w-full max-w-sm space-y-3 fade-up">
                        {/* 사망진단서 준비중 */}
                        <div className="w-full h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 px-5 opacity-40 cursor-not-allowed">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><FileText className="w-5 h-5 text-slate-300" /></div>
                            <div className="flex-1"><p className="text-white font-semibold text-sm">사망진단서로 열기</p><p className="text-slate-500 text-xs">OCR 자동 인증</p></div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">준비중</span>
                        </div>
                        {/* API 키 */}
                        <button onClick={() => setStep("form")}
                            className="w-full h-16 rounded-2xl border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 flex items-center gap-4 px-5 text-left transition-all group active:scale-[0.98]">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/30 group-hover:bg-blue-600/50 flex items-center justify-center transition-colors"><Key className="w-5 h-5 text-blue-300" /></div>
                            <div className="flex-1"><p className="text-white font-semibold text-sm">API 키로 열기</p><p className="text-slate-400 text-xs">고인이 공유한 에프텀 API 키</p></div>
                            <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <button onClick={() => setStep("name")} className="text-slate-600 text-xs hover:text-slate-400">← 이전</button>
                </div>
            )}

            {/* ── FORM ────────────────────────────────────── */}
            {step === "form" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-4">
                    <h1 className="text-3xl font-bold text-white text-center tracking-tight fade-up">정보를 입력해주세요</h1>
                    <p className="text-slate-500 text-xs text-center fade-up">열람자: <span className="text-slate-300 font-semibold">{guardianName}</span></p>

                    <div className="w-full max-w-sm space-y-3 fade-up">
                        {/* 고인 이름 */}
                        <div className="w-full h-14 rounded-full flex items-center gap-3 px-5"
                            style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
                            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <input autoFocus type="text" placeholder="고인 이름 (예: 홍길동)"
                                value={deceasedName} onChange={e => setDeceasedName(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
                        </div>
                        {/* 고인 핸드폰 */}
                        <div className="w-full h-14 rounded-full flex items-center gap-3 px-5"
                            style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
                            <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <input type="tel" placeholder="고인 핸드폰 번호 (010-0000-0000)"
                                value={deceasedPhone} onChange={e => setDeceasedPhone(formatPhone(e.target.value))}
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
                        </div>
                        {/* API 키 */}
                        <div className="w-full h-14 rounded-full flex items-center gap-3 px-5"
                            style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
                            <Key className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <input type="text" placeholder="afterm-xxxxxxxxxxxxxxxx"
                                value={apiKey} onChange={e => setApiKey(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none font-mono" />
                        </div>

                        {errorMsg && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm leading-relaxed">
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        <button onClick={handleSubmit} disabled={isLoading || !deceasedName || !deceasedPhone || !apiKey}
                            className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2">
                            {isLoading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />인증 중...</>
                            ) : (
                                <><Lock className="w-4 h-4" />디지털 유산 열기</>
                            )}
                        </button>
                    </div>
                    <button onClick={() => { setErrorMsg(""); setStep("method"); }} className="text-slate-600 text-xs hover:text-slate-400">← 이전</button>
                </div>
            )}

            {/* ── RESULT (흰 배경) ─────────────────────────── */}
            {step === "result" && result && (
                <div className="relative z-10 min-h-screen bg-slate-50">
                    {/* 상단 성공 헤더 */}
                    <div className="bg-white border-b border-slate-200 px-5 py-8 text-center">
                        <div className="inline-flex w-16 h-16 rounded-2xl bg-green-50 border border-green-200 items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-1">열람 완료</h1>
                        <p className="text-slate-500 text-sm">
                            {result.deceasedName && <><span className="font-semibold text-slate-700">{result.deceasedName}</span>님의 </>}
                            디지털 유산 {result.vaultItems.length}개가 공개되었습니다
                        </p>

                        {result.messagesReleased > 0 && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                메시지 {result.messagesReleased}건이 수신자에게 공개됩니다
                            </div>
                        )}
                    </div>

                    {/* 안내 문구 */}
                    <div className="px-5 pt-5 pb-2 max-w-lg mx-auto">
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                이 정보는 고인이 생전에 등록한 민감한 개인정보입니다. 카드를 탭하면 아이디·비밀번호가 표시됩니다. 안전하게 처리해주세요.
                            </p>
                        </div>
                    </div>

                    {/* 유산 카드 목록 */}
                    <div className="max-w-lg mx-auto px-5 pb-24 pt-3 space-y-3">
                        {result.vaultItems.length > 0 ? (
                            result.vaultItems.map((item, i) => (
                                <VaultCard key={item.id} item={item} index={i} />
                            ))
                        ) : (
                            <div className="text-center py-20 text-slate-400">
                                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">등록된 디지털 유산이 없습니다</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── 페이지 래퍼 ─────────────────────────────────────────────
export default function GuardianOpenPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <GuardianOpenContent />
        </Suspense>
    );
}
