"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/ai-assistant/ChatPanel";
import { DashboardPanel } from "@/components/ai-assistant/DashboardPanel";
import { AuthModal } from "@/components/ai-assistant/AuthModal";
import { MobileBottomSheet } from "@/components/ai-assistant/MobileBottomSheet";
import { Send, ArrowRight } from "lucide-react";

// ─── 동적 후킹 멘트 ────────────────────────────────────────────
const HOOK_TEXTS = [
    "나의 웰다잉 관리는",
    "나의 디지털 유산 확인",
    "나의 메시지, 데이터 관리",
    "나의 이후를 준비하는 것",
];

// ─── 프롬프트 창 Placeholder 롤링 ────────────────────────────────
const PLACEHOLDER_TEXTS = [
    "나의 디지털 유산 찾고 관리해줘",
    "내 유언장 작성해줘",
    "내 구독 중인 서비스 목록 알려줘",
    "소중한 사람에게 남길 메시지 써줘",
    "내 넷플릭스, 유튜브 프리미엄 찾아줘",
    "내 디지털 자산 어떻게 정리하면 좋을까?",
];

// ─── 배경 플로팅 아이콘 데이터 ───────────────────────────────────
const FLOATING_ICONS = [
    { id: 1, emoji: "📧", label: "메일" },
    { id: 2, emoji: "💳", label: "구독" },
    { id: 3, emoji: "☁️", label: "클라우드" },
    { id: 4, emoji: "🔐", label: "계정" },
    { id: 5, emoji: "📱", label: "앱" },
    { id: 6, emoji: "💌", label: "편지" },
    { id: 7, emoji: "🎬", label: "OTT" },
    { id: 8, emoji: "🎵", label: "음악" },
    { id: 9, emoji: "📂", label: "파일" },
    { id: 10, emoji: "🛡️", label: "보안" },
    { id: 11, emoji: "📝", label: "메모" },
    { id: 12, emoji: "🖼️", label: "사진" },
    // 서비스 로고 대체 (텍스트 기반)
    { id: 13, emoji: "N", label: "네이버", isText: true, color: "#03C75A" },
    { id: 14, emoji: "G", label: "Gmail", isText: true, color: "#EA4335" },
    { id: 15, emoji: "K", label: "카카오", isText: true, color: "#FEE500" },
    { id: 16, emoji: "Y", label: "유튜브", isText: true, color: "#FF0000" },
];

// ─── 하단 키워드 배지 ────────────────────────────────────────────
const BOTTOM_BADGES = [
    { icon: "⚡", text: "1분이면 내 디지털 유산을 확인할 수 있어요" },
    { icon: "✨", text: "깔끔하게 정리하는 내 유산" },
    { icon: "📱", text: "모바일도 가능해요" },
];

// ─── 타입 ────────────────────────────────────────────────────────
export type DashboardResult =
    | { type: "letter"; recipient: string; content: string; editedContent?: string }
    | { type: "legacyList"; items: LegacyItem[]; scannedAt?: string }
    | null;

export type LegacyItem = {
    id: string;
    service: string;
    cost: string;
    date: string;
    category: string;
};

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function AiAssistantClient() {
    const router = useRouter();
    const supabase = createClient();

    // ── 상태 ──────────────────────────────────────────────────
    const [isChatMode, setIsChatMode] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingMessage, setPendingMessage] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [dashboardResult, setDashboardResult] = useState<DashboardResult>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);

    // ── 애니메이션 인덱스 ──────────────────────────────────────
    const [hookIndex, setHookIndex] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [displayHook, setDisplayHook] = useState("");

    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── 로그인 확인 ────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setIsLoggedIn(!!data.user);
        });
    }, [supabase]);

    // ── 후킹 멘트 타이핑 효과 ──────────────────────────────────
    useEffect(() => {
        if (isChatMode) return;
        const currentText = HOOK_TEXTS[hookIndex];
        let timeout: NodeJS.Timeout;

        if (!isDeleting && charIndex < currentText.length) {
            timeout = setTimeout(() => {
                setDisplayHook(currentText.slice(0, charIndex + 1));
                setCharIndex((c) => c + 1);
            }, 80);
        } else if (!isDeleting && charIndex === currentText.length) {
            timeout = setTimeout(() => setIsDeleting(true), 1800);
        } else if (isDeleting && charIndex > 0) {
            timeout = setTimeout(() => {
                setDisplayHook(currentText.slice(0, charIndex - 1));
                setCharIndex((c) => c - 1);
            }, 40);
        } else if (isDeleting && charIndex === 0) {
            setIsDeleting(false);
            setHookIndex((i) => (i + 1) % HOOK_TEXTS.length);
        }

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, hookIndex, isChatMode]);

    // ── Placeholder 롤링 ────────────────────────────────────────
    useEffect(() => {
        if (isChatMode) return;
        const interval = setInterval(() => {
            setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_TEXTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isChatMode]);

    // ── 채팅 전송 처리 ──────────────────────────────────────────
    const handleSendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();

            // 유효성 검사
            if (trimmed.length < 10) {
                setInputError("10자 이상 입력해주세요.");
                return;
            }
            if (trimmed.length > 100) {
                setInputError("100자 이하로 입력해주세요.");
                return;
            }
            setInputError("");

            // 로그인 체크
            if (!isLoggedIn) {
                setPendingMessage(trimmed);
                setShowAuthModal(true);
                return;
            }

            // 첫 메시지 → 채팅 모드 전환
            if (!isChatMode) {
                setIsChatMode(true);
            }

            // 유저 메시지 추가
            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: "user",
                content: trimmed,
            };
            setMessages((prev) => [...prev, userMsg]);
            setInputValue("");

            // AI 로딩 표시
            const loadingId = (Date.now() + 1).toString();
            setIsAiTyping(true);
            setMessages((prev) => [
                ...prev,
                { id: loadingId, role: "assistant", content: "", isLoading: true },
            ]);

            try {
                // 이메일 스캔 의도 감지
                const isScanIntent = /구독|스캔|이메일|메일|결제|서비스 찾|유산 찾/.test(trimmed);

                if (isScanIntent) {
                    // 스켈레톤 로딩 UI 노출
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === loadingId
                                ? {
                                    ...m,
                                    isLoading: false,
                                    content:
                                        "이메일을 스캐닝하여 현재 구독 중인 서비스들을 분석할게요. 잠시만 기다려주세요! 🔍",
                                }
                                : m
                        )
                    );
                    setIsAnalyzing(true);
                    setIsBottomSheetOpen(true);

                    // /api/scan-emails 호출
                    const res = await fetch("/api/scan-emails", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query: trimmed }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setDashboardResult({ type: "legacyList", ...data, scannedAt: new Date().toISOString() });
                        setIsBottomSheetOpen(true);
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: Date.now().toString(),
                                role: "assistant",
                                content: `현재 확인된 유산은 이 정도에요! (MVP 버전이라 모든 데이터가 잡히진 않을 수 있습니다) 😊\n우측 화면에서 내역을 확인하고 불필요한 항목은 삭제해 주세요. 더 남기고 싶은 유산이 있다면 직접 추가도 가능해요!`,
                            },
                        ]);
                    } else {
                        throw new Error("scan_failed");
                    }
                    setIsAnalyzing(false);
                } else {
                    // 일반 대화 → /api/chat
                    const res = await fetch("/api/ai-chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            messages: [...messages, userMsg].map((m) => ({
                                role: m.role,
                                content: m.content,
                            })),
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === loadingId
                                    ? { ...m, isLoading: false, content: data.reply }
                                    : m
                            )
                        );

                        // 편지 결과물 감지
                        if (data.result?.type === "letter") {
                            setDashboardResult(data.result);
                            setIsBottomSheetOpen(true);
                        }
                    } else {
                        throw new Error("chat_failed");
                    }
                }
            } catch {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === loadingId
                            ? {
                                ...m,
                                isLoading: false,
                                content:
                                    "죄송합니다, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
                            }
                            : m
                    )
                );
                setIsAnalyzing(false);
            }

            setIsAiTyping(false);
        },
        [isLoggedIn, isChatMode, messages]
    );

    // ── 로그인 후 pending message 처리 ─────────────────────────
    useEffect(() => {
        if (isLoggedIn && pendingMessage) {
            const msg = pendingMessage;
            setPendingMessage("");
            setShowAuthModal(false);
            handleSendMessage(msg);
        }
    }, [isLoggedIn, pendingMessage, handleSendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans overflow-hidden">
            <Header transparentOnTop={false} />

            <AnimatePresence mode="wait">
                {!isChatMode ? (
                    /* ────────────── LANDING VIEW ────────────── */
                    <motion.main
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex-1 relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] overflow-hidden bg-slate-50"
                    >
                        {/* 배경 플로팅 아이콘 */}
                        <FloatingBackground />

                        {/* 중앙 컨텐츠 */}
                        <div className="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center gap-8">
                            {/* 후킹 멘트 타이핑 */}
                            <div className="text-center">
                                <div className="h-12 sm:h-16 flex items-center justify-center">
                                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                        {displayHook}
                                        <span className="inline-block w-0.5 h-8 sm:h-12 bg-blue-600 ml-1 animate-pulse align-middle" />
                                    </h1>
                                </div>
                                <p className="text-slate-400 text-sm mt-2 font-medium">
                                    AFTERM AI와 함께 시작해보세요
                                </p>
                            </div>

                            {/* 프롬프트 입력창 */}
                            <div className="w-full">
                                <div className={`relative bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border-2 transition-all duration-200 ${inputError ? "border-red-400" : "border-slate-200 focus-within:border-blue-400 focus-within:shadow-blue-100/80"}`}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={placeholderIndex}
                                            className="absolute left-5 top-5 pointer-events-none text-slate-300 text-sm font-medium"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: inputValue ? 0 : 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            예: {PLACEHOLDER_TEXTS[placeholderIndex]}
                                        </motion.div>
                                    </AnimatePresence>
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            setInputError("");
                                        }}
                                        onKeyDown={handleKeyDown}
                                        rows={3}
                                        maxLength={100}
                                        className="w-full pt-5 pb-14 px-5 bg-transparent text-slate-900 text-base resize-none focus:outline-none placeholder-transparent"
                                        placeholder=" "
                                    />
                                    {/* 하단 바 */}
                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3">
                                        <span className={`text-xs font-medium ${inputValue.length < 10 && inputValue.length > 0 ? "text-amber-500" : "text-slate-300"}`}>
                                            {inputValue.length} / 100자
                                            {inputValue.length > 0 && inputValue.length < 10 && " (최소 10자)"}
                                        </span>
                                        <button
                                            onClick={() => handleSendMessage(inputValue)}
                                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${inputValue.trim().length >= 10 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 hover:shadow-lg hover:-translate-y-0.5" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                                        >
                                            <Send className="w-4 h-4" />
                                            시작하기
                                        </button>
                                    </div>
                                </div>
                                {inputError && (
                                    <p className="mt-2 ml-1 text-xs text-red-500 font-medium">{inputError}</p>
                                )}
                            </div>

                            {/* 하단 배지 */}
                            <div className="flex flex-wrap gap-3 justify-center">
                                {BOTTOM_BADGES.map((b, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-blue-600 shadow-sm"
                                    >
                                        <span className="text-base">{b.icon}</span>
                                        {b.text}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    </motion.main>
                ) : (
                    /* ────────────── CHAT MODE (좌/우 분할) ──── */
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden"
                    >
                        {/* 좌측: AI 챗봇 (모바일 = 전체, PC = 40%) */}
                        <div className="w-full md:w-[40%] flex flex-col border-r border-slate-100 bg-white">
                            <ChatPanel
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isAiTyping={isAiTyping}
                                onOpenDashboard={() => setIsBottomSheetOpen(true)}
                                hasDashboard={!!dashboardResult || isAnalyzing}
                            />
                        </div>

                        {/* 우측: 대시보드 (PC only) */}
                        <div className="hidden md:flex flex-col w-[60%] bg-slate-50/60 overflow-y-auto">
                            <DashboardPanel
                                result={dashboardResult}
                                isAnalyzing={isAnalyzing}
                                onResultChange={setDashboardResult}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 모바일 바텀 시트 */}
            <MobileBottomSheet
                isOpen={isBottomSheetOpen}
                onClose={() => setIsBottomSheetOpen(false)}
            >
                <DashboardPanel
                    result={dashboardResult}
                    isAnalyzing={isAnalyzing}
                    onResultChange={setDashboardResult}
                />
            </MobileBottomSheet>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                pendingMessage={pendingMessage}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// 배경 플로팅 아이콘 컴포넌트
// ═══════════════════════════════════════════════════════════════
function FloatingBackground() {
    // 아이콘 배치: 랜덤 위치 & 애니메이션 (SSR-safe)
    const positions = [
        { x: "8%", y: "15%" }, { x: "15%", y: "70%" },
        { x: "25%", y: "30%" }, { x: "80%", y: "20%" },
        { x: "88%", y: "65%" }, { x: "72%", y: "40%" },
        { x: "5%", y: "50%" }, { x: "90%", y: "85%" },
        { x: "35%", y: "80%" }, { x: "60%", y: "10%" },
        { x: "50%", y: "90%" }, { x: "70%", y: "75%" },
        { x: "20%", y: "10%" }, { x: "45%", y: "20%" },
        { x: "82%", y: "45%" }, { x: "12%", y: "90%" },
    ];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {FLOATING_ICONS.map((icon, idx) => {
                const pos = positions[idx % positions.length];
                const delay = idx * 0.4;
                const duration = 4 + (idx % 3) * 1.5;

                return (
                    <motion.div
                        key={icon.id}
                        className="absolute"
                        style={{ left: pos.x, top: pos.y }}
                        animate={{
                            y: [0, -12, 0],
                            opacity: [0.35, 0.6, 0.35],
                        }}
                        transition={{
                            duration,
                            delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        {icon.isText ? (
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md"
                                style={{ backgroundColor: icon.color + "cc" }}
                            >
                                {icon.emoji}
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-md border border-slate-100">
                                {icon.emoji}
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
