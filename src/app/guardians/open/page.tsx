"use client";

import { useState, Suspense, useLayoutEffect, useEffect, memo, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
    Shield, Key, User, Phone, CheckCircle, Lock, ChevronRight, Eye, EyeOff,
    Copy, Check, FileText, ChevronDown, ChevronUp, CreditCard, Music, Cloud,
    Gamepad2, ShoppingBag, Terminal, Users, Info, X, Globe
} from "lucide-react";
import {
    AnimatePresence,
    motion,
    useAnimation,
    useMotionValue,
    useTransform,
} from "framer-motion";

// ─── 유틸 ───────────────────────────────────────────────
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const IS_SERVER = typeof window === "undefined";

export function useMediaQuery(
    query: string,
    { defaultValue = false, initializeWithValue = true } = {}
): boolean {
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
    messagesReleased: number;
}

type Step = "landing" | "name" | "method" | "form" | "result";

// ─── 디자인 스타일 ───────────────────────────────────────
const CATEGORY_STYLE: Record<string, { icon: any; color: string; border: string; bg: string }> = {
    OTT: { icon: CreditCard, color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50" },
    음악: { icon: Music, color: "text-purple-600", border: "border-purple-100", bg: "bg-purple-50" },
    클라우드: { icon: Cloud, color: "text-blue-600", border: "border-blue-100", bg: "bg-blue-50" },
    게임: { icon: Gamepad2, color: "text-green-600", border: "border-green-100", bg: "bg-green-50" },
    쇼핑: { icon: ShoppingBag, color: "text-amber-600", border: "border-amber-100", bg: "bg-amber-50" },
    "구독 서비스": { icon: CreditCard, color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50" },
    subscription: { icon: CreditCard, color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50" },
    "생산성 툴": { icon: Terminal, color: "text-slate-600", border: "border-slate-200", bg: "bg-slate-50" },
    "소셜/커뮤니티": { icon: Users, color: "text-sky-600", border: "border-sky-100", bg: "bg-sky-50" },
    기타: { icon: Info, color: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50" },
};


// ─── 3D CAROUSEL 구현 (가로 회전 / 드래그 모션) ──────────
const duration = 0.15;
const transition = { duration, ease: [0.32, 0.72, 0, 1] };
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] };

const VaultCarouselInner = memo(
    ({
        handleClick,
        controls,
        items,
        isCarouselActive,
    }: {
        handleClick: (item: VaultItem) => void;
        controls: any;
        items: VaultItem[];
        isCarouselActive: boolean;
    }) => {
        const isScreenSizeSm = useMediaQuery("(max-width: 640px)");

        // 카드 갯수에 따라 원통 크기 자동 조절
        const faceCount = Math.max(items.length, 3); // 최소 3각형
        const faceWidth = isScreenSizeSm ? 260 : 320;
        const cylinderWidth = faceWidth * faceCount;
        const radius = Math.max((faceWidth / 2) / Math.tan(Math.PI / faceCount), faceWidth) + 30; // 여유 공간

        const rotation = useMotionValue(0);
        const transform = useTransform(rotation, (value) => `rotate3d(0, 1, 0, ${value}deg)`);

        return (
            <div
                className="flex h-full items-center justify-center pt-5 pb-10 overflow-visible"
                style={{ perspective: "1200px", transformStyle: "preserve-3d", willChange: "transform" }}
            >
                <motion.div
                    drag={isCarouselActive ? "x" : false}
                    className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
                    style={{ transform, rotateY: rotation, width: cylinderWidth, transformStyle: "preserve-3d" }}
                    onDrag={(_, info) => isCarouselActive && rotation.set(rotation.get() + info.offset.x * 0.1)}
                    onDragEnd={(_, info) =>
                        isCarouselActive &&
                        controls.start({
                            rotateY: rotation.get() + info.velocity.x * 0.05,
                            transition: { type: "spring", stiffness: 100, damping: 30, mass: 0.1 },
                        })
                    }
                    animate={controls}
                >
                    {items.map((item, i) => {
                        const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["기타"];
                        const Icon = style.icon;

                        return (
                            <motion.div
                                key={`vault-${item.id}`}
                                className="absolute flex flex-col h-full origin-center items-center justify-center p-2"
                                style={{
                                    width: `${faceWidth}px`,
                                    transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
                                }}
                                onClick={() => handleClick(item)}
                            >
                                {/* ── 회전하는 3D 카드 UI ── */}
                                <motion.div
                                    layoutId={`card-${item.id}`}
                                    className="w-full bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-hidden p-6 cursor-pointer hover:border-blue-200 hover:shadow-2xl transition-all"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-2xl ${style.bg} flex items-center justify-center border ${style.border} flex-shrink-0 relative overflow-hidden mb-4 shadow-inner`}>
                                            <Icon className={`w-8 h-8 ${style.color}`} />
                                        </div>
                                        <h3 className="text-[18px] font-bold text-slate-800 tracking-tight leading-snug text-center mb-1.5 line-clamp-1">{item.platform_name}</h3>
                                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${style.color} ${style.bg} border ${style.border} uppercase tracking-widest`}>
                                            {item.category === "기타" ? "subscription" : item.category}
                                        </span>
                                        <div className="mt-8 text-center w-full">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50 inline-flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5" /> 클릭하여 비밀번호 확인
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        );
    }
);


function VaultCarousel({ items }: { items: VaultItem[] }) {
    const [activeItem, setActiveItem] = useState<VaultItem | null>(null);
    const [isCarouselActive, setIsCarouselActive] = useState(true);
    const controls = useAnimation();

    const [showPass, setShowPass] = useState(false);
    const [copied, setCopied] = useState<"id" | "pw" | null>(null);

    const handleClick = (item: VaultItem) => {
        setActiveItem(item);
        setIsCarouselActive(false);
        controls.stop();
    };

    const handleClose = () => {
        setActiveItem(null);
        setIsCarouselActive(true);
        setShowPass(false);
        setCopied(null);
    };

    const copyToClipboard = (e: React.MouseEvent, text: string, type: "id" | "pw") => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <motion.div layout className="relative w-full">
            <AnimatePresence mode="sync">
                {activeItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                        onClick={handleClose}
                    >
                        {/* ── 팝업 상세 모달 ── */}
                        <motion.div
                            layoutId={`card-${activeItem.id}`}
                            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden cursor-default relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 bg-slate-100/80 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {(() => {
                                const style = CATEGORY_STYLE[activeItem.category] ?? CATEGORY_STYLE["기타"];
                                const Icon = style.icon;
                                const passMatch = activeItem.notes?.match(/패스워드:\s*(.*)/);
                                const passwordText = passMatch?.[1]?.trim() || null;
                                const memoText = activeItem.notes?.replace(/패스워드:\s*.+/g, "").trim() || null;

                                return (
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                                            <div className={`w-14 h-14 rounded-2xl border ${style.border} ${style.bg} shadow-inner flex items-center justify-center flex-shrink-0`}>
                                                <Icon className={`w-7 h-7 ${style.color}`} />
                                            </div>
                                            <div>
                                                <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight leading-none mb-2">{activeItem.platform_name}</h2>
                                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.border} ${style.bg} ${style.color}`}>
                                                    {activeItem.category === "기타" ? "subscription" : activeItem.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* 아이디 영역 (항상 렌더링) */}
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1">아이디 / 이메일</p>
                                                <div className="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                                                    <p className={`text-[15px] font-mono tracking-wide break-all ${activeItem.account_id ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                        {activeItem.account_id || "미등록"}
                                                    </p>
                                                    {activeItem.account_id && (
                                                        <button onClick={(e) => copyToClipboard(e, activeItem.account_id!, "id")} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors shadow-sm">
                                                            {copied === "id" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 비밀번호 영역 (항상 렌더링) */}
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1">비밀번호</p>
                                                <div className="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                                                    <p className={`text-[15px] font-mono tracking-widest break-all ${passwordText ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                        {passwordText ? (showPass ? passwordText : "•".repeat(Math.min(passwordText.length, 12))) : "미등록"}
                                                    </p>
                                                    {passwordText && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setShowPass(!showPass)} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors shadow-sm">
                                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                            <button onClick={(e) => copyToClipboard(e, passwordText, "pw")} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors shadow-sm">
                                                                {copied === "pw" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 메모 영역 */}
                                            {(memoText) && (
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1">메모</p>
                                                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                                                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                            {memoText}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative h-[400px] sm:h-[450px] w-full mt-6">
                <VaultCarouselInner
                    handleClick={handleClick}
                    controls={controls}
                    items={items}
                    isCarouselActive={isCarouselActive}
                />
                {/* 블러 처리 오버레이 (좌우 가장자리) */}
                <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none" />
            </div>
        </motion.div>
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

            {/* 랜딩 배경 아이콘 */}
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

            {/* ── RESULT (3D Carousel + Focus Popup) ── */}
            {step === "result" && result && (
                <div className="relative z-10 min-h-screen py-16 px-4 sm:px-6 flex flex-col items-center fade-up bg-slate-50/50">
                    <div className="w-full max-w-2xl text-center mb-10">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-[1.25rem] bg-green-400 shadow-md shadow-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-[22px] font-extrabold text-slate-900 mb-1">열람 완료</h1>
                        <p className="text-slate-500 text-sm">
                            <span className="font-bold text-slate-800">{result.deceasedName}</span>님의 디지털 유산이 공개되었습니다.<br />
                            좌우로 드래그하고 카드를 터치하여 상세정보를 확인하세요.
                        </p>
                    </div>

                    <div className="flex-1 w-full max-w-[1200px] overflow-hidden relative">
                        {result.vaultItems.length > 0 ? (
                            <VaultCarousel items={result.vaultItems} />
                        ) : (
                            <div className="text-center py-20 bg-white mx-5 rounded-3xl border border-slate-200 shadow-sm mt-6">
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
