"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Shield, Upload, Key, User, Phone, CheckCircle,
    Lock, FileText, ChevronRight, Eye, EyeOff, Building2,
    Music, Cloud, ShoppingBag, Gamepad2, Star, Globe
} from "lucide-react";

// ─── 타입 정의 ───────────────────────────────────────────────
interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    username: string | null;
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

// ─── 카테고리 아이콘 & 색상 ───────────────────────────────────
const CATEGORY_STYLE: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    OTT: { icon: <Star className="w-4 h-4" />, color: "text-rose-400", bg: "bg-rose-900/40" },
    음악: { icon: <Music className="w-4 h-4" />, color: "text-purple-400", bg: "bg-purple-900/40" },
    클라우드: { icon: <Cloud className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-900/40" },
    게임: { icon: <Gamepad2 className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-900/40" },
    쇼핑: { icon: <ShoppingBag className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-900/40" },
    subscription: { icon: <Star className="w-4 h-4" />, color: "text-rose-400", bg: "bg-rose-900/40" },
    기타: { icon: <Globe className="w-4 h-4" />, color: "text-slate-400", bg: "bg-slate-800/60" },
};

// ─── 플로팅 아이콘들 (배경 장식) ──────────────────────────────
const FloatingIcons = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
            @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes spin-rev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
            .spin-slow { animation: spin-slow 80s linear infinite }
            .spin-rev  { animation: spin-rev  60s linear infinite }
        `}</style>

        {/* 바깥 링 – 반시계 */}
        <div className="absolute inset-0 spin-rev" style={{ perspective: "1000px", transform: "perspective(1000px) rotateX(12deg)" }}>
            <div className="absolute top-1/2 left-1/2 w-[1800px] h-[1800px]"
                style={{ transform: "translate(-50%,-50%) rotate(20deg)" }}>
                <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center relative">
                    {[Lock, Key, Shield, FileText, CheckCircle, Globe, Star, Music, Cloud].map((Icon, i) => {
                        const angle = (i / 9) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const r = 880;
                        return (
                            <div key={i} className="absolute opacity-20"
                                style={{ left: `${50 + (r / 18) * Math.cos(rad)}%`, top: `${50 + (r / 18) * Math.sin(rad)}%` }}>
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <Icon className="w-5 h-5 text-blue-300" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* 안쪽 링 – 시계 */}
        <div className="absolute inset-0 spin-slow" style={{ perspective: "1000px", transform: "perspective(1000px) rotateX(12deg)" }}>
            <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px]"
                style={{ transform: "translate(-50%,-50%) rotate(-30deg)" }}>
                <div className="w-full h-full rounded-full border border-white/8 relative">
                    {[Building2, Gamepad2, ShoppingBag, Star, Lock, Key].map((Icon, i) => {
                        const angle = (i / 6) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const r = 430;
                        return (
                            <div key={i} className="absolute opacity-30"
                                style={{ left: `${50 + (r / 9) * Math.cos(rad)}%`, top: `${50 + (r / 9) * Math.sin(rad)}%` }}>
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-blue-400" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/70 to-transparent" />
    </div>
);

// ─── DisplayCard (결과 카드) ──────────────────────────────────
function VaultCard({ item, index }: { item: VaultItem; index: number }) {
    const [showSecret, setShowSecret] = useState(false);
    const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];

    const offsets = [
        "translate-x-0 translate-y-0",
        "translate-x-14 translate-y-8",
        "translate-x-28 translate-y-16",
    ];
    const zIndex = [30, 20, 10][index % 3];

    return (
        <div
            className={`relative flex-shrink-0 w-72 h-36 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4
                -skew-y-2 transition-all duration-500 hover:skew-y-0 hover:-translate-y-3 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-white/20
                cursor-pointer select-none`}
            style={{ zIndex, marginLeft: index > 0 ? "-80px" : "0" }}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${style.bg} ${style.color}`}>
                    {style.icon}
                </span>
                <span className="text-white font-bold text-sm truncate">{item.platform_name}</span>
            </div>

            {item.username && (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-mono">
                    <User className="w-3 h-3" />
                    <span className="truncate">{item.username}</span>
                </div>
            )}

            {item.notes && (
                <div className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mt-1">
                    {showSecret ? item.notes : item.notes.replace(/패스워드:\s*\S+/g, "패스워드: ••••••")}
                </div>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); setShowSecret(p => !p); }}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
            >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

// ─── 메인 컨텐트 ─────────────────────────────────────────────
function GuardianOpenContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("uid");

    const [step, setStep] = useState<Step>("landing");
    const [guardianName, setGuardianName] = useState("");
    const [guardianPhone, setGuardianPhone] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<OpenResult | null>(null);

    // 사망진단서 업로드 상태
    const [certFile, setCertFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const formatPhone = (v: string) => {
        const n = v.replace(/[^0-9]/g, "").slice(0, 11);
        if (n.length > 7) return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
        if (n.length > 3) return `${n.slice(0, 3)}-${n.slice(3)}`;
        return n;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert("파일 크기는 10MB 이하여야 합니다."); return; }
        setCertFile(file);
        setIsUploading(true);
        try {
            const supabase = createClient();
            const ext = file.name.split(".").pop();
            const path = `public/${Date.now()}.${ext}`;
            await supabase.storage.from("death_certificates").upload(path, file).catch(() => { });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!guardianName || !guardianPhone || !apiKey) {
            setErrorMsg("이름, 핸드폰 번호, API 키를 모두 입력해주세요."); return;
        }
        setIsLoading(true);
        setErrorMsg("");
        try {
            const endpoint = userId ? "/api/guardians/verify-open" : "/api/guardians/find-by-key";
            const body = userId
                ? { userId, guardianName, guardianPhone, apiKey }
                : { guardianName, guardianPhone, apiKey };

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

            {/* CSS 애니메이션 */}
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                @keyframes scaleIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
                @keyframes bounceIn {
                    0%{transform:scale(0.8);opacity:0}
                    60%{transform:scale(1.06)}
                    100%{transform:scale(1);opacity:1}
                }
                .fade-up  { animation: fadeUp  0.6s ease forwards }
                .scale-in { animation: scaleIn 0.5s ease forwards }
                .bounce-in{ animation: bounceIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards }
                @keyframes glow-ring {
                    0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.4)}
                    50%{box-shadow:0 0 60px rgba(59,130,246,0.8),0 0 100px rgba(59,130,246,0.3)}
                }
                .glow-ring { animation: glow-ring 2.5s ease-in-out infinite }
            `}</style>

            <FloatingIcons />

            {/* ── LANDING ─────────────────────── */}
            {step === "landing" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-20 px-6 gap-6">
                    {/* 앱 아이콘 */}
                    <div className="w-20 h-20 rounded-3xl shadow-2xl overflow-hidden mb-2 ring-1 ring-white/10 glow-ring bounce-in">
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center tracking-tight fade-up">
                        고인 디지털 유산 찾기
                    </h1>
                    <p className="text-slate-400 text-base text-center fade-up" style={{ animationDelay: "0.1s" }}>
                        사망진단서 또는 API 키로 고인의<br />디지털 유산을 안전하게 열람하세요.
                    </p>

                    {/* CTA 버튼 */}
                    <div className="w-full max-w-sm mt-2 fade-up" style={{ animationDelay: "0.2s" }}>
                        <button
                            onClick={() => setStep("name")}
                            className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-all active:scale-95 hover:shadow-lg hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                        >
                            유산 찾기 시작하기
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── NAME STEP ───────────────────── */}
            {step === "name" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-20 px-6 gap-5">
                    <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-tight fade-up">
                        가디언즈(열람자) 이름을<br />입력해주세요
                    </h1>
                    <p className="text-slate-400 text-sm text-center fade-up" style={{ animationDelay: "0.1s" }}>
                        고인이 지정한 유산 열람자의 성함입니다
                    </p>

                    <div className="w-full max-w-sm mt-2 fade-up" style={{ animationDelay: "0.15s" }}>
                        <div className="w-full h-14 rounded-full overflow-hidden relative"
                            style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
                            <input
                                type="text"
                                autoFocus
                                placeholder="성함을 입력해주세요"
                                value={guardianName}
                                onChange={e => setGuardianName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && guardianName && setStep("method")}
                                className="absolute inset-0 bg-transparent text-white placeholder-zinc-500 text-base px-6 outline-none pr-36"
                            />
                            <div className="absolute top-2 right-2 bottom-2">
                                <button
                                    onClick={() => guardianName && setStep("method")}
                                    disabled={!guardianName}
                                    className="h-full px-5 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-sm"
                                >
                                    다음 →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── METHOD SELECT ────────────────── */}
            {step === "method" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-20 px-6 gap-6">
                    <h1 className="text-3xl font-bold text-white text-center tracking-tight fade-up">
                        열람 방식을 선택해주세요
                    </h1>
                    <p className="text-slate-400 text-sm text-center fade-up" style={{ animationDelay: "0.1s" }}>
                        <span className="text-white font-medium">{guardianName}</span>님, 어떤 방식으로 열람하시겠어요?
                    </p>

                    <div className="w-full max-w-sm space-y-3 fade-up" style={{ animationDelay: "0.15s" }}>
                        {/* 사망진단서 - 준비중 */}
                        <button
                            disabled
                            className="w-full h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 px-5 text-left opacity-50 cursor-not-allowed relative"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">사망진단서로 열기</p>
                                <p className="text-slate-500 text-xs">OCR 자동 인증</p>
                            </div>
                            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
                                준비중
                            </span>
                        </button>

                        {/* API 키 */}
                        <button
                            onClick={() => setStep("form")}
                            className="w-full h-16 rounded-2xl border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 flex items-center gap-4 px-5 text-left transition-all hover:border-blue-400/60 active:scale-[0.98] group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/50 transition-colors">
                                <Key className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">API 키로 열기</p>
                                <p className="text-slate-400 text-xs">고인이 공유한 에프텀 API 키</p>
                            </div>
                            <ChevronRight className="ml-auto w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <button onClick={() => setStep("name")} className="text-slate-600 text-xs hover:text-slate-400 transition-colors fade-up">
                        ← 이전으로
                    </button>
                </div>
            )}

            {/* ── FORM (API KEY) ───────────────── */}
            {step === "form" && (
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-20 px-6 gap-5">
                    <h1 className="text-3xl font-bold text-white text-center tracking-tight fade-up">
                        정보를 입력해주세요
                    </h1>

                    <div className="w-full max-w-sm space-y-3 fade-up" style={{ animationDelay: "0.1s" }}>
                        {/* 핸드폰 번호 */}
                        <div style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
                            className="w-full h-14 rounded-full flex items-center gap-3 px-5">
                            <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <input
                                type="tel"
                                autoFocus
                                placeholder="핸드폰 번호 (010-0000-0000)"
                                value={guardianPhone}
                                onChange={e => setGuardianPhone(formatPhone(e.target.value))}
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none"
                            />
                        </div>

                        {/* API 키 */}
                        <div style={{ backgroundColor: "#27272a", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
                            className="w-full h-14 rounded-full flex items-center gap-3 px-5">
                            <Key className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="afterm-xxxxxxxxxxxxxxxx"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none font-mono"
                            />
                        </div>

                        {errorMsg && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
                                {errorMsg}
                            </div>
                        )}

                        {/* 열기 버튼 */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !guardianPhone || !apiKey}
                            className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    인증 중...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    디지털 유산 열기
                                </>
                            )}
                        </button>

                        <p className="text-center text-slate-600 text-[10px]">
                            이름: <span className="text-slate-400 font-medium">{guardianName}</span>
                        </p>
                    </div>

                    <button onClick={() => setStep("method")} className="text-slate-600 text-xs hover:text-slate-400 transition-colors">
                        ← 이전으로
                    </button>
                </div>
            )}

            {/* ── RESULT ──────────────────────── */}
            {step === "result" && result && (
                <div className="relative z-10 min-h-screen px-4 pt-16 pb-24">
                    {/* 성공 헤더 */}
                    <div className="text-center mb-10 bounce-in">
                        <div className="inline-flex w-20 h-20 rounded-3xl bg-green-500/20 border border-green-400/30 items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">열람 완료</h1>
                        <p className="text-slate-400 text-sm">
                            {result.deceasedName ? `${result.deceasedName}님의 ` : ""}디지털 유산이 공개되었습니다
                        </p>
                    </div>

                    {/* 메시지 공개 알림 */}
                    {result.messagesReleased > 0 && (
                        <div className="max-w-lg mx-auto mb-8 px-4 py-4 rounded-2xl bg-green-500/10 border border-green-400/20 flex items-center gap-3 fade-up">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                                <p className="text-green-300 font-semibold text-sm">메시지 {result.messagesReleased}건이 공개되었습니다</p>
                                <p className="text-green-600 text-xs">수신자에게 별도로 전달됩니다</p>
                            </div>
                        </div>
                    )}

                    {/* 디지털 유산 카드 */}
                    {result.vaultItems.length > 0 ? (
                        <div className="max-w-lg mx-auto">
                            <p className="text-slate-400 text-sm font-medium mb-4 px-2 fade-up">
                                🗂️ 디지털 유산 <span className="text-white font-bold">{result.vaultItems.length}개</span>
                            </p>

                            {/* 스택 카드 뷰 - 상위 3개 */}
                            {result.vaultItems.length >= 3 && (
                                <div className="relative flex mb-8 pl-4 fade-up" style={{ animationDelay: "0.1s" }}>
                                    {result.vaultItems.slice(0, 3).map((item, i) => (
                                        <VaultCard key={item.id} item={item} index={i} />
                                    ))}
                                </div>
                            )}

                            {/* 전체 리스트 */}
                            <div className="space-y-3 fade-up" style={{ animationDelay: "0.2s" }}>
                                {result.vaultItems.map((item, i) => {
                                    const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];
                                    const [showNotes, setShowNotes] = useState(false);
                                    return (
                                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-white/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl ${style.bg} ${style.color} flex items-center justify-center flex-shrink-0`}>
                                                    {style.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold text-sm truncate">{item.platform_name}</p>
                                                    {item.username && (
                                                        <p className="text-slate-400 text-xs font-mono">{item.username}</p>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <button onClick={() => setShowNotes(p => !p)} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                                                        {showNotes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                            {showNotes && item.notes && (
                                                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                                    {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-16">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">등록된 디지털 유산이 없습니다</p>
                        </div>
                    )}
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
