"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, ChevronUp } from "lucide-react";
import type { ChatMessage } from "./AiAssistantClient";

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isAiTyping: boolean;
    onOpenDashboard: () => void;
    hasDashboard: boolean;
}

export function ChatPanel({ messages, onSendMessage, isAiTyping, onOpenDashboard, hasDashboard }: ChatPanelProps) {
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const trimmed = inputValue.trim();
        if (trimmed.length < 10) { setInputError("10자 이상 입력해주세요."); return; }
        if (trimmed.length > 100) { setInputError("100자 이하로 입력해주세요."); return; }
        setInputError("");
        onSendMessage(trimmed);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
                                    msg.content
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* 입력 영역 */}
            <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
                <div className={`relative bg-slate-50 border rounded-xl transition-all duration-200 ${inputError ? "border-red-400" : "border-slate-200 focus-within:border-blue-400 focus-within:bg-white"}`}>
                    <textarea
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        maxLength={100}
                        placeholder="무엇이든 물어보세요..."
                        className="w-full px-4 pt-3 pb-10 bg-transparent text-sm text-slate-900 resize-none focus:outline-none placeholder:text-slate-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2">
                        <span className={`text-xs ${inputValue.length > 0 && inputValue.length < 10 ? "text-amber-500" : "text-slate-300"}`}>
                            {inputValue.length}/100
                        </span>
                        <button
                            onClick={handleSend}
                            disabled={inputValue.trim().length < 10}
                            className={`p-2 rounded-lg transition-all ${inputValue.trim().length >= 10 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {inputError && <p className="mt-1 text-xs text-red-500">{inputError}</p>}
            </div>
        </div>
    );
}
