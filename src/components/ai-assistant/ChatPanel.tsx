"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, ChevronUp, Plus, Plug, Mail, Crown } from "lucide-react";
import type { ChatMessage, ActionButton } from "./AiAssistantClient";

interface ConnectorItem {
    id: string;
    icon: string; // url or emoji
    label: string;
    status: "connect" | "connected" | "install" | "beta";
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isAiTyping: boolean;
    onOpenDashboard: () => void;
    hasDashboard: boolean;
    isGoogleLinked: boolean;
    onToggleGmail: () => void;
    onChoiceSelect?: (id: string, label: string) => void;
    onActionButton?: (action: ActionButton["action"]) => void;
}

export function ChatPanel({ messages, onSendMessage, isAiTyping, onOpenDashboard, hasDashboard, isGoogleLinked, onToggleGmail, onChoiceSelect, onActionButton }: ChatPanelProps) {
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const trimmed = inputValue.trim();
        if (trimmed.length === 0) return;
        if (trimmed.length > 300) { setInputError("300자 이하로 입력해주세요."); return; }
        setInputError("");
        onSendMessage(trimmed);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // IME 조합 중이면 엔터 이벤트 무시 (글자 중복 입력 방지)
        if (e.nativeEvent.isComposing) return;

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900">AFTERM AI</p>
                    <p className="text-xs text-green-500 font-medium">● 온라인</p>
                </div>
                {/* 모바일: 결과 패널 열기 버튼 */}
                {hasDashboard && (
                    <button
                        onClick={onOpenDashboard}
                        className="md:hidden ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
                    >
                        결과 보기
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                {/* 환영 메시지 */}
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                안녕하세요! 😊 저는 <strong>AFTERM AI</strong>예요.<br />
                                디지털 유산 정리나 소중한 메시지 작성을 도와드릴게요.
                                어떤 걸 도와드릴까요?
                            </p>
                        </div>
                    </motion.div>
                )}

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
                            <div
                                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                    ? "bg-slate-900 text-white rounded-tr-sm"
                                    : "bg-slate-100 text-slate-700 rounded-tl-sm"
                                    }`}
                            >
                                {msg.isLoading ? (
                                    <div className="flex gap-1 py-1">
                                        {[0, 1, 2].map((i) => (
                                            <span
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s` }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {msg.content}
                                        {/* 선택지 버튼 렌더링 */}
                                        {msg.choices && msg.choices.length > 0 && (
                                            <div className="flex flex-col gap-2 mt-4">
                                                {msg.choices.map((choice) => (
                                                    <button
                                                        key={choice.id}
                                                        onClick={() => onChoiceSelect && onChoiceSelect(choice.id, choice.label)}
                                                        className="w-full text-left bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 px-4 py-3 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <p className="font-semibold text-slate-800 text-sm">{choice.label}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{choice.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {/* 액션 버튼 렌더링 */}
                                        {msg.actionButtons && msg.actionButtons.length > 0 && (
                                            <div className="flex flex-col gap-2 mt-4">
                                                {msg.actionButtons.map((btn, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => onActionButton && onActionButton(btn.action)}
                                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${btn.style === "primary" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                                                            }`}
                                                    >
                                                        {btn.icon === "mail" && <Mail className="w-4 h-4" />}
                                                        {btn.icon === "crown" && <Crown className="w-4 h-4" />}
                                                        {btn.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* 입력 영역 */}
            <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-white">
                {/* 아이콘 툴바 영역 */}
                <div className="flex items-center gap-3 mb-3 pl-1 relative" ref={menuRef}>
                    <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>

                    {/* 플러그 메뉴 버튼 */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isGoogleLinked
                            ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                        title="커넥터 확장 메뉴"
                    >
                        <Plug className="w-4 h-4" />
                    </button>

                    {/* 커넥터 팝오버 메뉴 */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-[44px] left-8 w-[280px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 p-2"
                            >
                                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-semibold text-slate-400">후속 질문 & 커넥터</p>
                                </div>
                                <div className="flex flex-col">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onToggleGmail();
                                        }}
                                        className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-md bg-transparent flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335" /><path d="M16.909 21h5.455v-5.454L16.909 21z" fill="#34A853" /><path d="M7.091 21H1.636v-5.454L7.091 21z" fill="#4285F4" /><path d="M5.455 4.64 1.636 1.777V5.45l3.819 2.864V4.64z" fill="#FBBC04" /><path d="M18.545 4.64l3.819-2.863V5.45l-3.819 2.864V4.64z" fill="#FBBC04" /><path d="M24 5.457v2.864l-5.455 4.091V4.64C20.69 2.28 24 3.434 24 5.457z" fill="#EA4335" /><path d="M0 5.457v2.864l5.455 4.091V4.64C3.309 2.28 0 3.434 0 5.457z" fill="#C5221F" /></svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Gmail</span>
                                        </div>
                                        {isGoogleLinked ? (
                                            <div className="w-9 h-5 bg-blue-600 rounded-full flex items-center p-0.5 justify-end">
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 group-hover:text-amber-600 font-medium whitespace-nowrap">베타 접수</span>
                                        )}
                                    </button>

                                    <div className="px-3 py-2 border-t border-slate-50 mt-1 flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg group">
                                        <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                                        <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600">커넥터 추가 관리</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={`relative bg-slate-50 border rounded-2xl transition-all duration-200 ${inputError ? "border-red-400" : "border-slate-200 focus-within:border-blue-400 focus-within:bg-white"}`}>
                    <textarea
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="무엇이든 물어보세요..."
                        className="w-full px-4 py-3.5 bg-transparent text-sm text-slate-900 resize-none focus:outline-none placeholder:text-slate-400 min-h-[52px]"
                        style={{ height: inputValue ? "auto" : "52px" }}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center">
                        <button
                            onClick={handleSend}
                            disabled={inputValue.trim().length === 0}
                            className={`p-2 rounded-xl transition-all ${inputValue.trim().length > 0 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {inputError && <p className="mt-1 text-xs text-red-500 ml-1">{inputError}</p>}
            </div>
        </div>
    );
}
