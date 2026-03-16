"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { DashboardPanel } from "@/components/ai-assistant/DashboardPanel";
import { ChatPanel } from "@/components/ai-assistant/ChatPanel";
import { AuthModal } from "@/components/ai-assistant/AuthModal";
import { BetaApplyModal } from "@/components/ai-assistant/BetaApplyModal";
import { MobileBottomSheet } from "@/components/ai-assistant/MobileBottomSheet";
import { Send, Bot, Mail, Crown } from "lucide-react";

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
    | { type: "letter"; recipient: string; content: string; editedContent?: string; isComplete?: boolean }
    | { type: "legacyList"; items: LegacyItem[]; scannedAt?: string }
    | null;

export type LegacyItem = {
    id: string;
    service: string;
    cost: string;
    date: string;
    category: string;
    username?: string;
    password?: string;
    memo?: string;
};

export type ActionButton = {
    label: string;
    icon?: "mail" | "crown";
    style?: "primary" | "secondary";
    action: "linkGmail" | "goToPlans" | "runScan";
};

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
    choices?: { id: string; label: string; desc: string }[];
    isEmailConsent?: boolean;
    actionButtons?: ActionButton[];
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function AiAssistantClient() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();

    // 상태
    const [isChatMode, setIsChatMode] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
    const [isGoogleLinked, setIsGoogleLinked] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingMessage, setPendingMessage] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [dashboardResult, setDashboardResult] = useState<DashboardResult>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [showBetaModal, setShowBetaModal] = useState(false);

    // 타이핑 후킹 멘트
    const [hookIndex, setHookIndex] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [displayHook, setDisplayHook] = useState("");
    const [isCheckingPlan, setIsCheckingPlan] = useState(true);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    messagesRef.current = messages;
    const isInitialized = useRef(false);

    // 로그인 확인 + 플랜/Google 연동 여부 확인 + ?q= 자동 채팅 트리거
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const loggedIn = !!user;
            setIsLoggedIn(loggedIn);

            if (loggedIn && user) {
                // 플랜 및 기존 연동 여부 확인 (refresh_token도 함께 조회)
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("plan, gmail_connected, gmail_refresh_token")
                    .eq("id", user.id)
                    .single();

                if (profile?.plan === "pro") setUserPlan("pro");

                const { data: sessionData } = await supabase.auth.getSession();
                const session = sessionData?.session;
                const provider = session?.user?.app_metadata?.provider;

                // DB에 refresh_token이 있으면 연동된 것으로 간주 (세션 만료와 무관)
                let connected = profile?.gmail_connected || !!profile?.gmail_refresh_token || false;

                const isScanRedirect = searchParams.get("scan") === "true";

                // 구글 로그인이고 세션에 provider_refresh_token이 있으면 DB에 저장 (항상 최신화)
                if (provider === "google" && session?.provider_refresh_token) {
                    await supabase.from("profiles").update({
                        gmail_connected: true,
                        gmail_refresh_token: session.provider_refresh_token
                    }).eq("id", user.id);
                    connected = true;
                }

                setIsGoogleLinked(connected);
            }

            const qParam = searchParams.get("q");
            if (qParam && !isInitialized.current) {
                isInitialized.current = true;
                if (loggedIn) {
                    setPendingMessage(qParam);
                } else {
                    setPendingMessage(qParam);
                    setShowAuthModal(true);
                }
            }
            setIsCheckingPlan(false);
        };
        init();
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
    const runEmailScan = useCallback(async (userIntent?: string) => {
        setIsAnalyzing(true);
        setIsBottomSheetOpen(true);
        // 로딩 중 안내 메시지
        addMsg({
            role: "assistant",
            content: "Gmail을 분석하고 있어요... ✉️\n이메일에서 구독/결제 내역을 찾는 중입니다. 잠시만 기다려주세요!",
        });
        try {
            // provider_token은 브라우저 세션에만 존재 → 직접 꺼내서 body로 전달
            const { data: sessionData } = await supabase.auth.getSession();
            const providerToken = sessionData?.session?.provider_token;
            console.log("[runEmailScan] providerToken 존재:", !!providerToken);
            console.log("[runEmailScan] 사용자 의도(Context):", userIntent || "없음");

            const res = await fetch("/api/scan-emails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ providerToken, userIntent }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    setDashboardResult({ type: "legacyList", items: data.items, scannedAt: new Date().toISOString() });
                    
                    let msgContent = `스캔 완료! 📊 Gmail에서 총 ${data.items.length}개의 유효한 구독/정기결제 내역을 찾았어요.\n해지된 구독은 제외하고 우측 대시보드에 정리해드릴게요!`;
                    
                    if (userIntent) {
                        const intentLower = userIntent.toLowerCase();
                        if (intentLower.includes("돈나가는") || intentLower.includes("유료") || intentLower.includes("결제된")) {
                            msgContent = `스캔 완료! 📊 요청하신 대로 **결제 금액이 있는 유료 서비스**만 ${data.items.length}개 찾았어요.\n\n해지된 내역이나 무료 계정은 제외하고 우측 대시보드에 정리했습니다. 확인해보세요!`;
                        } else if (intentLower.includes("ott") || intentLower.includes("스트리밍")) {
                            msgContent = `스캔 완료! 📊 요청하신 **OTT 및 스트리밍 서비스**만 ${data.items.length}개 찾았어요.\n\n우측 대시보드에 정리해두었으니 확인해보세요!`;
                        } else if (intentLower.includes("클라우드") || intentLower.includes("업무") || intentLower.includes("작업")) {
                            msgContent = `스캔 완료! 📊 요청하신 **생산성 및 클라우드 관련 서비스**를 ${data.items.length}개 찾았어요.\n\n우측 대시보드에서 확인 후 보관해주세요!`;
                        } else {
                            msgContent = `스캔 완료! 📊 사용자님의 요청사항에 맞춰 총 ${data.items.length}개의 내역을 찾았어요.\n\n해지된 구독은 제외하고 현재 유효한 목록만 우측 대시보드에 정리했습니다!`;
                        }
                    }

                    addMsg({
                        role: "assistant",
                        content: msgContent,
                    });
                } else {
                    const debug = data.debug;
                    let debugMsg = "";
                    if (debug) {
                        debugMsg = `\n\n[진단 정보]\n• 토큰 수신: ${debug.tokenReceived ? "✅" : "❌"}\n• 받은편지함: ${debug.inboxCount ?? 0}개\n• 프로모션함: ${debug.promoCount ?? 0}개`;
                        if (debug.scanError) debugMsg += `\n• 오류: ${debug.scanError}`;
                    }
                    addMsg({
                        role: "assistant",
                        content: (data.message ?? (userIntent ? `현재 Gmail 연동으로 찾았지만, 요청하신 '${userIntent}'에 해당하는 디지털 유산은 찾지 못했어요.` : "현재 Gmail 연동으로 찾았을 때 해당하는 디지털 유산은 찾지 못했어요. 직접 입력해서 추가하시겠어요?")) + debugMsg,
                    });

                }
            } else {
                let errData;
                let errText = await res.text();
                try {
                    errData = JSON.parse(errText);
                } catch {
                    // Not JSON (e.g., Vercel 504 Gateway Timeout HTML page)
                }

                if (errData?.requires_auth) {
                    // ⚠️ 연동 상태(isGoogleLinked)는 건드리지 않음 — DB에 refresh_token이 있으면 연동된 것
                    // Gmail 접근 권한 토큰만 만료된 것이므로 재로그인만 요청
                    addMsg({
                        role: "assistant",
                        content: "Gmail 접근 토큰이 만료되었어요. 아래 버튼을 눌러 Google 계정으로 다시 로그인해주세요.\n\n⚠️ 로그인 시 반드시 'Gmail 읽기' 권한 체크박스를 선택하셔야 합니다.",
                        actionButtons: [{ label: "Gmail 계정 재연결하기", icon: "mail", style: "primary", action: "linkGmail" }],
                    });
                } else {
                    throw new Error(errData?.detail || errData?.error || errText || `서버 오류 (${res.status})`);
                }
            }
        } catch (error: any) {
            console.error("[runEmailScan Error]", error);
            addMsg({
                role: "assistant",
                content: `이메일 스캔 중 오류가 발생했어요.\n\n[상세 내역]\n${error.message || String(error)}`
            });
        }
        setIsAnalyzing(false);
    }, []);

    // ── 액션 버튼 핸들러 ─────────────────────────────────────
    const handleActionButton = useCallback(async (action: ActionButton["action"]) => {
        if (action === "goToPlans") {
            router.push("/plans");
        } else if (action === "linkGmail" || action === "runScan") {
            if (action === "linkGmail") {
                // 실 연동 (Google OAuth) 진행
                console.log("[AiAssistant] Starting Google OAuth...");
                // LoginPageClient와 동일하게 /auth/callback 경로로 리다이렉트 유도
                const isProduction = typeof window !== 'undefined' && (window.location.hostname === 'afterm.co.kr' || window.location.hostname === 'www.afterm.co.kr');
                const callbackUrl = isProduction
                    ? 'https://afterm.co.kr/auth/callback'
                    : `${window.location.origin}/auth/callback`;

                const returnTo = "/ai-assistant?scan=true";

                await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        redirectTo: `${callbackUrl}?next=${encodeURIComponent(returnTo)}`,
                        queryParams: { access_type: "offline", prompt: "consent" },
                        scopes: "email profile https://www.googleapis.com/auth/gmail.readonly",
                    },
                });
            } else {
                // 버튼 클릭으로 실행될 때, 가장 최근 사용자 메시지를 의도로 전달
                const userMsgs = messagesRef.current.filter(m => m.role === "user");
                const lastUserIntent = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].content : undefined;
                runEmailScan(lastUserIntent);
            }
        }
    }, [router, supabase, runEmailScan]);

    // ── 선택지 버튼 클릭 ─────────────────────────────────────
    const handleChoiceSelect = useCallback(async (choiceId: string, choiceLabel: string) => {
        setMessages(prev => prev.map(m => m.choices ? { ...m, choices: undefined } : m));
        addMsg({ role: "user", content: choiceLabel });

        // Gmail Yes/No 응답 처리
        if (choiceId === "gmail_yes") {
            // 항상 gmail.readonly 스코프로 OAuth 인증 (실제 연동을 위한 액션)
            addMsg({
                role: "assistant",
                content: "좋아요! Google 계정 연동을 시작할게요. 아래 버튼을 눌러 연동을 허용해주세요 🔐\n(현재 승인 대기 단계라, 사전에 등록된 테스터만 진행할 수 있습니다.)",
                actionButtons: [{ label: "Google 계정으로 Gmail 연동하기", icon: "mail", style: "primary", action: "linkGmail" }],
            });
            return;
        }

        if (choiceId === "gmail_no") {
            addMsg({
                role: "assistant",
                content: "알겠어요! 언제든지 Gmail 연동이 필요하시면 말씀해주세요 😊\n직접 구독 서비스 목록을 알려주시면 정리해드릴 수도 있어요.",
            });
            return;
        }

        if (choiceId === "subscription" || choiceId === "cloud") {
            // ── 1) PRO 요금제 확인 ──────────────────────────────────
            if (userPlan !== "pro") {
                addMsg({
                    role: "assistant",
                    content: `실제 Gmail 연동을 통한 구독 내역 분석은 **PRO 플랜** 전용 기능이에요 👑\n\n지금 바로 업그레이드하면 이메일을 전수 분석해서 놓친 구독 내역까지 모두 찾아드려요!`,
                    actionButtons: [{ label: "PRO 플랜 업그레이드하기", icon: "crown", style: "primary", action: "goToPlans" }],
                });
                return;
            }

            // ── 2) 구글 계정 연동 여부 확인 ────────────────────────
            addMsg({
                role: "assistant",
                content: `알겠습니다! 📧 Gmail을 직접 분석해서 실제 구독/정기결제 내역을 찾아드릴게요.\n\n구글 계정의 이메일 읽기 권한이 필요해요. 아래 버튼을 통해 연동을 시작할까요?`,
                actionButtons: isGoogleLinked
                    ? [{ label: "Gmail 스캔 바로 시작하기", icon: "mail", style: "primary", action: "runScan" }]
                    : [{ label: "Google 계정으로 Gmail 연동하기", icon: "mail", style: "primary", action: "linkGmail" }],
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
    }, [userPlan, isGoogleLinked]);

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

        // 브라우저별 한국어 IME 잔상 버그 방지를 위해 비동기 초기화
        setTimeout(() => {
            setInputValue("");
        }, 10);

        // 디지털 유산/구독/계정 정리 의도 — 자연어 모두 포함
        const isLegacyIntent = /유산|자산|구독|결제|계정|클라우드|소셜|sns|ott|유료|무료|돈\s*나가|돈\s*빠져|통신|통신비|핸드폰\s*요금|핸드폰비|인터넷\s*요금|인터넷비|넷플|왓챠|티빙|멜론|스포티파이|인스타|페이스북|트위터|틱톡|icloud|구글\s*드라이브|원드라이브|드롭박스|매달|월\s*얼마|구독\s*중|쓰고\s*있는|가입된|정리\s*해|해지|서비스\s*찾아|뭐\s*구독|뭐\s*쓰는|어떤\s*서비스|내\s*계정|내가\s*쓰는|내\s*구독|내\s*결제/i.test(trimmed);

        if (isLegacyIntent) {
            if (isGoogleLinked) {
                addMsg({
                    role: "assistant",
                    content: "Gmail을 분석해서 **통신 · 유료구독 · 클라우드 · SNS** 계정을 찾아드릴게요! 📧\n잠깐만 기다려주세요...",
                });
                runEmailScan(trimmed);
                return;
            }

            addMsg({
                role: "assistant",
                content: "디지털 유산 정리를 도와드릴게요! 📧\n\nGmail을 연동시켜서 숨은 구독 내역을 자동으로 찾을 수도 있고, 연동 없이 직접 입력해서 따로 다루실 수도 있어요.\n자동 스캔을 위해 Gmail 연동을 진행해 드릴까요?",
                choices: [
                    { id: "gmail_yes", label: "네, 연동할게요!", desc: "Gmail에서 구독/결제 내역을 자동으로 찾아드려요" },
                    { id: "gmail_no", label: "아니요, 따로 할게요", desc: "직접 입력해서 유산을 기록할게요" },
                ],
            });
            return;
        }

        // 대화 중 Gmail 연동 요청 감지
        const isGmailRequest = /gmail|지메일|연동|이메일 연결|메일 연결|메일 분석|구독 찾아/.test(trimmed.toLowerCase());
        if (isGmailRequest) {
            if (isGoogleLinked) {
                addMsg({
                    role: "assistant",
                    content: "이미 연동된 Gmail 스위치가 켜져있어요! 바로 자동 스캔을 시작할게요. 📧",
                });
                runEmailScan(trimmed);
                return;
            }

            addMsg({
                role: "assistant",
                content: "Gmail 연동을 원하시는군요! 이메일에서 구독/정기결제 내역을 자동으로 찾아드릴게요 📧\n\n연동을 시작할까요?",
                choices: [
                    { id: "gmail_yes", label: "네, 연동 시작!", desc: "Gmail 계정을 연결해 구독 내역을 분석해요" },
                    { id: "gmail_no", label: "아니요", desc: "취소" },
                ],
            });
            return;
        }

        // 로그인/연동 차단 관련 키워드 감지
        const isAccessBlockedIntent = /차단|엑세스|액세스|승인 대기|막혔|막힘|권한/.test(trimmed);
        if (isAccessBlockedIntent) {
            addMsg({
                role: "assistant",
                content: "아앗, Google 권한 승인 창에서 액세스가 차단되었군요! 😢\n\n현재 구글 승인 심사 대기 중이라 사전에 등록된 테스터만 즉시 연동이 가능합니다.\n대신 좌측 하단의 **[플러그 모양 아이콘 🔌]**을 눌러 커넥터 메뉴에서 **'베타 접수하기'**를 신청해주시면, 권한을 열어드리고 무료로 이용하실 수 있도록 안내해 드리겠습니다!",
            });
            return;
        }

        // [추가] 유산/구독 관련 요청인 경우, runEmailScan 내부에서 이미 어시스턴트 메시지를 보내므로 여기서 중단하여 중복 응답(GPT 채팅)을 방지함
        if (isLegacyIntent || isGmailRequest) {
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
                if (data.result) {
                    setDashboardResult(data.result);
                    setIsBottomSheetOpen(true);
                }
            } else {
                throw new Error();
            }
        } catch {
            replaceMsg(loadingId, { isLoading: false, content: "죄송합니다, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." });
        }
    }, [isLoggedIn, isChatMode, isGoogleLinked, runEmailScan]);

    // ── Gmail 연동 스위치 (플러그) 토글 ───────────────────────
    const handleToggleGmail = useCallback(async () => {
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        if (isGoogleLinked) {
            // 연동 해제 로직
            const confirmUnlink = window.confirm("Gmail 연동 스위치를 끄시겠습니까?\n저장된 스캔용 토큰이 삭제됩니다.");
            if (confirmUnlink) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from("profiles").update({
                        gmail_connected: false,
                        gmail_refresh_token: null
                    }).eq("id", user.id);
                    setIsGoogleLinked(false);

                    if (isChatMode) {
                        addMsg({ role: "assistant", content: "Gmail 연동 스위치가 꺼졌습니다. 🔌" });
                    }
                }
            }
        } else {
            // 연동 안 된 상태 -> 베타 테스터 팝업 노출
            setShowBetaModal(true);
        }
    }, [isLoggedIn, isGoogleLinked, isChatMode, supabase]);

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

    // Gmail OAuth 콜백 후 ?scan=true 감지 → 자동 스캔 시작
    const scanHandled = useRef(false);
    useEffect(() => {
        const shouldScan = searchParams.get("scan") === "true";
        if (shouldScan && isLoggedIn && !scanHandled.current && !isCheckingPlan) {
            scanHandled.current = true;
            // URL에서 scan 파라미터 제거
            window.history.replaceState({}, "", "/ai-assistant");
            // 채팅 모드 진입 후 스캔 안내 메시지와 함께 스캔 시작
            setIsChatMode(true);
            setTimeout(() => {
                addMsg({
                    role: "assistant",
                    content: "Gmail 연동이 완료되었어요! 🎉\n이메일을 분석해서 구독 중인 서비스와 정기결제 내역을 찾아드릴게요.",
                });
                setTimeout(() => runEmailScan(), 500);
            }, 300);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, isCheckingPlan, searchParams]);

    const lastSubmitTime = useRef(0);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();

            // 한국어 IME 중복 입력 방지 (크롬/사파리)
            const now = Date.now();
            if (now - lastSubmitTime.current < 200) return;
            lastSubmitTime.current = now;

            handleSendMessage(e.currentTarget.value);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    // 플랜 확인 중 로딩
    if (isCheckingPlan) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Header transparentOnTop={false} />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">잠시만 기다려주세요...</p>
                </div>
            </div>
        );
    }

    // PRO 전용 - 미가입자 업그레이드 유도
    if (isLoggedIn && userPlan !== "pro") {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Header transparentOnTop={false} />
                <div className="flex flex-1 items-center justify-center p-6 pt-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center"
                    >
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Crown className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">PRO 플랜 전용 기능</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            AFTERM AI 어시스턴트는 <strong className="text-slate-800">PRO 플랜</strong> 구독자만 이용할 수 있어요.
                            <br /><br />
                            Gmail 연동으로 디지털 유산을 자동 정리하고,
                            소중한 사람에게 남길 메시지를 AI와 함께 작성해보세요.
                        </p>
                        <button
                            onClick={() => router.push("/plans")}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                            PRO 플랜 시작하기 →
                        </button>
                        <p className="text-xs text-slate-400 mt-4">3개월 무료 체험 포함</p>
                    </motion.div>
                </div>
            </div>
        );
    }

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
                            <ChatPanel
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isAiTyping={false} // Loading state is somewhat handled in messages array
                                onOpenDashboard={() => setIsBottomSheetOpen(true)}
                                hasDashboard={!!dashboardResult || isAnalyzing}
                                isGoogleLinked={isGoogleLinked}
                                onToggleGmail={handleToggleGmail}
                                onChoiceSelect={handleChoiceSelect}
                                onActionButton={handleActionButton}
                            />
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

            {/* Auth Modal / Beta Apply Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} pendingMessage={pendingMessage} />
            <BetaApplyModal isOpen={showBetaModal} onClose={() => setShowBetaModal(false)} />
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
