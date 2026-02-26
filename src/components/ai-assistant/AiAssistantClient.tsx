"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { DashboardPanel } from "@/components/ai-assistant/DashboardPanel";
import { AuthModal } from "@/components/ai-assistant/AuthModal";
import { MobileBottomSheet } from "@/components/ai-assistant/MobileBottomSheet";
import { Send, Bot } from "lucide-react";

// ─── 후킹 멘트 ──────────────────────────────────────────────────
const HOOK_TEXTS = ["나의 웰다잉 관리는", "나의 디지털 유산 확인", "나의 메시지, 데이터 관리", "나의 이후를 준비하는 것"];
const PLACEHOLDER_TEXTS = ["나의 디지털 유산 찾고 관리해줘", "내 구독 중인 서비스 목록 알려줘", "소중한 사람에게 남길 메시지 써줘", "내 디지털 자산 어떻게 정리하면 좋을까?"];

// ─── 디지털 유산 선택지 ─────────────────────────────────────────
const LEGACY_CHOICES = [
    { id: "subscription", label: "📺 구독 서비스", desc: "넷플릭스, 유튜브, 스포티파이 등 정기 결제" },
    { id: "social", label: "💬 소셜 계정", desc: "인스타그램, 페이스북, 트위터, 카카오 등" },
    { id: "cloud", label: "☁️ 클라우드 & 데이터", desc: "iCloud, 구글드라이브, 네이버 클라우드 등" },
    { id: "other", label: "📋 기타 문의", desc: "직접 설명하고 싶어요" },
];

// ─── 배경 아이콘 ────────────────────────────────────────────────
const FLOATING_ICONS = [
    { id: 1, emoji: "📧", label: "메일" }, { id: 2, emoji: "💳", label: "구독" },
    { id: 3, emoji: "☁️", label: "클라우드" }, { id: 4, emoji: "🔐", label: "계정" },
    { id: 5, emoji: "📱", label: "앱" }, { id: 6, emoji: "💌", label: "편지" },
    { id: 7, emoji: "🎬", label: "OTT" }, { id: 8, emoji: "🎵", label: "음악" },
    { id: 9, emoji: "📂", label: "파일" }, { id: 10, emoji: "🛡️", label: "보안" },
    { id: 11, emoji: "📝", label: "메모" }, { id: 12, emoji: "🖼️", label: "사진" },
    { id: 13, emoji: "N", label: "네이버", isText: true, color: "#03C75A" },
    { id: 14, emoji: "G", label: "Gmail", isText: true, color: "#EA4335" },
    { id: 15, emoji: "K", label: "카카오", isText: true, color: "#FEE500" },
    { id: 16, emoji: "Y", label: "유튜브", isText: true, color: "#FF0000" },
];

const BOTTOM_BADGES = [
    { icon: "⚡", text: "1분이면 내 디지털 유산을 확인할 수 있어요" },
    { icon: "✨", text: "깔끔하게 정리하는 내 유산" },
    { icon: "📱", text: "모바일도 가능해요" },
];

// ─── 타입 ───────────────────────────────────────────────────────
export type DashboardResult =
    | { type: "letter"; recipient: string; content: string; editedContent?: string }
    | { type: "legacyList"; items: LegacyItem[]; scannedAt?: string }
    | null;

export type LegacyItem = { id: string; service: string; cost: string; date: string; category: string };

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
    // 선택지 버튼을 보여줄 경우
    choices?: { id: string; label: string; desc: string }[];
    // 이메일 동의 버튼
    isEmailConsent?: boolean;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function AiAssistantClient() {
    const supabase = createClient();
    const searchParams = useSearchParams();

    // 상태
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

    // 타이핑 후킹 멘트
    const [hookIndex, setHookIndex] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [displayHook, setDisplayHook] = useState("");

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    messagesRef.current = messages;
    const isInitialized = useRef(false);

    // 로그인 확인 + ?q= 자동 채팅 트리거
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const loggedIn = !!data.user;
            setIsLoggedIn(loggedIn);
            const qParam = searchParams.get("q");
            if (qParam && !isInitialized.current) {
                isInitialized.current = true;
                if (loggedIn) {
                    // 로그인 상태 → 바로 채팅 시작
                    setPendingMessage(qParam);
                } else {
                    // 미로그인 → 로그인 모달
                    setPendingMessage(qParam);
                    setShowAuthModal(true);
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 타이핑 효과
    useEffect(() => {
        if (isChatMode) return;
        const currentText = HOOK_TEXTS[hookIndex];
        let timeout: NodeJS.Timeout;
        if (!isDeleting && charIndex < currentText.length) {
            timeout = setTimeout(() => { setDisplayHook(currentText.slice(0, charIndex + 1)); setCharIndex(c => c + 1); }, 80);
        } else if (!isDeleting && charIndex === currentText.length) {
            timeout = setTimeout(() => setIsDeleting(true), 1800);
        } else if (isDeleting && charIndex > 0) {
            timeout = setTimeout(() => { setDisplayHook(currentText.slice(0, charIndex - 1)); setCharIndex(c => c - 1); }, 40);
        } else if (isDeleting && charIndex === 0) {
            setIsDeleting(false);
            setHookIndex(i => (i + 1) % HOOK_TEXTS.length);
        }
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [charIndex, isDeleting, hookIndex, isChatMode]);

    // Placeholder 롤링
    useEffect(() => {
        if (isChatMode) return;
        const iv = setInterval(() => setPlaceholderIndex(i => (i + 1) % PLACEHOLDER_TEXTS.length), 3000);
        return () => clearInterval(iv);
    }, [isChatMode]);

    // 자동 스크롤
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── 메시지 추가 헬퍼 ──────────────────────────────────────
    const addMsg = (msg: Omit<ChatMessage, "id">) => {
        const newMsg = { ...msg, id: Date.now().toString() + Math.random() };
        setMessages(prev => [...prev, newMsg]);
        return newMsg.id;
    };

    const replaceMsg = (id: string, update: Partial<ChatMessage>) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, ...update } : m));
    };

    // ── 이메일 스캔 실행 ─────────────────────────────────────
    const runEmailScan = useCallback(async () => {
        setIsAnalyzing(true);
        setIsBottomSheetOpen(true);
        try {
            const res = await fetch("/api/scan-emails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                setDashboardResult({ type: "legacyList", ...data, scannedAt: new Date().toISOString() });
                addMsg({
                    role: "assistant",
                    content: `스캔 완료! 현재 확인된 구독/정기결제 내역이에요 😊\n(MVP 버전이라 모든 데이터가 잡히진 않을 수 있어요)\n우측에서 확인 후 불필요한 항목은 삭제하고 저장해주세요!`,
                });
            } else {
                throw new Error();
            }
        } catch {
            addMsg({ role: "assistant", content: "이메일 스캔 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." });
        }
        setIsAnalyzing(false);
    }, []);

    // ── 선택지 버튼 클릭 ─────────────────────────────────────
    const handleChoiceSelect = useCallback(async (choiceId: string, choiceLabel: string) => {
        // 선택지 버튼 숨기기 (클릭한 것만 남기기)
        setMessages(prev => prev.map(m => m.choices ? { ...m, choices: undefined } : m));

        // 유저 선택 메시지 추가
        addMsg({ role: "user", content: choiceLabel });

        if (choiceId === "subscription" || choiceId === "cloud") {
            // → 이메일 연동 동의 요청
            addMsg({
                role: "assistant",
                content: `${choiceLabel} 내역을 찾아드릴게요! 📧\n\n이메일 계정을 연동하면 자동으로 분석해드릴 수 있어요.\n이메일 주소를 스캔해도 괜찮을까요?\n*(이메일 본문을 읽어 구독 내역만 분석하며, 개인 정보는 저장하지 않아요)*`,
                isEmailConsent: true,
            });
        } else if (choiceId === "social") {
            addMsg({
                role: "assistant",
                content: `소셜 계정은 현재 자동 스캔이 어려워요 😅\n\n직접 입력해서 기록해두시겠어요?\n예: 인스타그램 계정명, 비밀번호 힌트, 처리 방법(삭제/유지/양도)`,
            });
        } else {
            addMsg({
                role: "assistant",
                content: `어떤 디지털 유산에 대해 궁금하신가요? 편하게 말씀해주세요 😊`,
            });
        }
    }, []);

    // ── 이메일 동의 처리 ─────────────────────────────────────
    const handleEmailConsent = useCallback(async (agreed: boolean) => {
        setMessages(prev => prev.map(m => m.isEmailConsent ? { ...m, isEmailConsent: false } : m));

        if (agreed) {
            addMsg({ role: "user", content: "네, 이메일 스캔 동의해요!" });
            addMsg({ role: "assistant", content: "감사해요! 이메일을 분석하는 중이에요 🔍\n잠시만 기다려주세요..." });
            await runEmailScan();
        } else {
            addMsg({ role: "user", content: "아니요, 직접 입력할게요" });
            addMsg({
                role: "assistant",
                content: `직접 추가하실 수 있어요!\n아래 보관함에서 직접 항목을 추가해주세요 📝`,
            });
        }
    }, [runEmailScan]);

    // ── 채팅 전송 처리 ───────────────────────────────────────
    const handleSendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        // 랜딩 페이지에서는 10자 이상 / 채팅 모드에서는 1자 이상
        if (!isChatMode && trimmed.length < 10) { setInputError("10자 이상 입력해주세요."); return; }
        if (!isChatMode && trimmed.length > 200) { setInputError("200자 이하로 입력해주세요."); return; }
        if (trimmed.length === 0) return;
        setInputError("");

        // 로그인 체크
        if (!isLoggedIn) {
            setPendingMessage(trimmed);
            setShowAuthModal(true);
            return;
        }

        if (!isChatMode) setIsChatMode(true);

        addMsg({ role: "user", content: trimmed });
        setInputValue("");

        // 첫 번째 메시지일 때만 선택지 버튼 제공 (이후는 AI가 직접 파싱)
        const isFirstMessage = messagesRef.current.filter(m => m.role === "user").length === 1;
        const isLegacyIntent = isFirstMessage && /디지털 유산|유산 찾|구독 확인|계정 정리|소셜 계정|클라우드 정리/.test(trimmed);

        if (isLegacyIntent) {
            addMsg({
                role: "assistant",
                content: "어떤 디지털 유산을 찾아드릴까요? 아래에서 선택해주세요 😊",
                choices: LEGACY_CHOICES,
            });
            return;
        }

        // 일반 대화 → /api/ai-chat
        const loadingId = addMsg({ role: "assistant", content: "", isLoading: true });

        try {
            const res = await fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messagesRef.current
                        .filter(m => !m.isLoading && m.content)
                        .concat({ role: "user" as const, content: trimmed, id: "tmp" })
                        .map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                replaceMsg(loadingId, { isLoading: false, content: data.reply });
                if (data.result?.type === "letter") {
                    setDashboardResult(data.result);
                    setIsBottomSheetOpen(true);
                }
            } else {
                throw new Error();
            }
        } catch {
            replaceMsg(loadingId, { isLoading: false, content: "죄송합니다, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." });
        }
    }, [isLoggedIn, isChatMode]);

    // 로그인 후 pending message 처리 (한 번만 실행)
    const pendingHandled = useRef(false);
    useEffect(() => {
        if (isLoggedIn && pendingMessage && !pendingHandled.current) {
            pendingHandled.current = true;
            const msg = pendingMessage;
            setPendingMessage("");
            setShowAuthModal(false);
            handleSendMessage(msg);
        }
    }, [isLoggedIn, pendingMessage, handleSendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue); }
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans overflow-hidden pt-16">
            <Header transparentOnTop={false} />

            <AnimatePresence mode="wait">
                {!isChatMode ? (
                    /* ─── LANDING VIEW ─── */
                    <motion.main
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex-1 relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] overflow-hidden bg-slate-50"
                    >
                        <FloatingBackground />
                        <div className="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center gap-8">
                            <div className="text-center">
                                <div className="h-12 sm:h-16 flex items-center justify-center">
                                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                        {displayHook}
                                        <span className="inline-block w-0.5 h-8 sm:h-12 bg-blue-600 ml-1 animate-pulse align-middle" />
                                    </h1>
                                </div>
                                <p className="text-slate-400 text-sm mt-2 font-medium">AFTERM AI와 함께 시작해보세요</p>
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
                                        onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                                        onKeyDown={handleKeyDown}
                                        rows={3}
                                        maxLength={100}
                                        className="w-full pt-5 pb-14 px-5 bg-transparent text-slate-900 text-base resize-none focus:outline-none placeholder-transparent"
                                        placeholder=" "
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3">
                                        <span className={`text-xs font-medium ${inputValue.length < 10 && inputValue.length > 0 ? "text-amber-500" : "text-slate-300"}`}>
                                            {inputValue.length} / 100자{inputValue.length > 0 && inputValue.length < 10 && " (최소 10자)"}
                                        </span>
                                        <button
                                            onClick={() => handleSendMessage(inputValue)}
                                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${inputValue.trim().length >= 10 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 hover:-translate-y-0.5" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                                        >
                                            <Send className="w-4 h-4" />
                                            시작하기
                                        </button>
                                    </div>
                                </div>
                                {inputError && <p className="mt-2 ml-1 text-xs text-red-500 font-medium">{inputError}</p>}
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center">
                                {BOTTOM_BADGES.map((b, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-blue-600 shadow-sm"
                                    >
                                        <span className="text-base">{b.icon}</span>{b.text}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    </motion.main>
                ) : (
                    /* ─── CHAT MODE ─── */
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden"
                    >
                        {/* 좌측: 채팅 */}
                        <div className="w-full md:w-[40%] flex flex-col border-r border-slate-100 bg-white">
                            {/* 헤더 */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">AFTERM AI</p>
                                    <p className="text-xs text-green-500 font-medium">● 온라인</p>
                                </div>
                                {(!!dashboardResult || isAnalyzing) && (
                                    <button onClick={() => setIsBottomSheetOpen(true)} className="md:hidden ml-auto flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                                        결과 보기
                                    </button>
                                )}
                            </div>

                            {/* 메시지 목록 */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                                {/* 환영 메시지 */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            안녕하세요! 😊 저는 <strong>AFTERM AI</strong>예요.<br />
                                            디지털 유산 정리나 소중한 메시지 작성을 도와드릴게요.
                                        </p>
                                    </div>
                                </motion.div>

                                <AnimatePresence>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                        >
                                            {msg.role === "assistant" && (
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mt-auto">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-2 max-w-[78%]">
                                                {/* 말풍선 */}
                                                {(msg.content || msg.isLoading) && (
                                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-slate-900 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"}`}>
                                                        {msg.isLoading ? (
                                                            <div className="flex gap-1 py-1">
                                                                {[0, 1, 2].map(i => (
                                                                    <span key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                                                ))}
                                                            </div>
                                                        ) : msg.content}
                                                    </div>
                                                )}

                                                {/* 선택지 버튼 */}
                                                {msg.choices && (
                                                    <div className="flex flex-col gap-2 mt-1">
                                                        {msg.choices.map((c) => (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => handleChoiceSelect(c.id, c.label)}
                                                                className="text-left px-4 py-3 bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all text-sm"
                                                            >
                                                                <p className="font-bold text-slate-800">{c.label}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 이메일 동의 버튼 */}
                                                {msg.isEmailConsent && (
                                                    <div className="flex gap-2 mt-1">
                                                        <button
                                                            onClick={() => handleEmailConsent(true)}
                                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                                                        >
                                                            ✅ 네, 분석해주세요
                                                        </button>
                                                        <button
                                                            onClick={() => handleEmailConsent(false)}
                                                            className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                                        >
                                                            직접 입력할게요
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={bottomRef} />
                            </div>

                            {/* 입력창 */}
                            <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
                                <div className={`relative bg-slate-50 border rounded-xl transition-all duration-200 ${inputError ? "border-red-400" : "border-slate-200 focus-within:border-blue-400 focus-within:bg-white"}`}>
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                                        onKeyDown={handleKeyDown}
                                        rows={2}
                                        placeholder="무엇이든 물어보세요..."
                                        className="w-full px-4 pt-3 pb-10 bg-transparent text-sm text-slate-900 resize-none focus:outline-none placeholder:text-slate-300"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end px-3 pb-2">
                                        <button
                                            onClick={() => handleSendMessage(inputValue)}
                                            disabled={inputValue.trim().length === 0}
                                            className={`p-2 rounded-lg transition-all ${inputValue.trim().length > 0 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {inputError && <p className="mt-1 text-xs text-red-500">{inputError}</p>}
                            </div>
                        </div>

                        {/* 우측: 대시보드 (PC) */}
                        <div className="hidden md:flex flex-col w-[60%] bg-slate-50/60 overflow-y-auto">
                            <DashboardPanel result={dashboardResult} isAnalyzing={isAnalyzing} onResultChange={setDashboardResult} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 모바일 바텀 시트 */}
            <MobileBottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)}>
                <DashboardPanel result={dashboardResult} isAnalyzing={isAnalyzing} onResultChange={setDashboardResult} />
            </MobileBottomSheet>

            {/* Auth Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} pendingMessage={pendingMessage} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// 배경 플로팅 아이콘
// ═══════════════════════════════════════════════════════════════
function FloatingBackground() {
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
                        animate={{ y: [0, -12, 0], opacity: [0.35, 0.6, 0.35] }}
                        transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {icon.isText ? (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md"
                                style={{ backgroundColor: (icon as { color?: string }).color + "cc" }}>
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
