"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, CheckCircle2 } from "lucide-react";

interface BetaApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BetaApplyModal({ isOpen, onClose }: BetaApplyModalProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setErrorMsg("이메일을 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch("/api/email/beta-apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                throw new Error("전송 실패");
            }

            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            setErrorMsg("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset state on close
        setTimeout(() => {
            setEmail("");
            setIsSuccess(false);
            setErrorMsg("");
        }, 300);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 relative"
                        >
                            <button
                                onClick={handleClose}
                                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {!isSuccess ? (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 mb-2">
                                            Gmail 연동 베타 테스터 신청
                                        </h2>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            현재 구글 정책에 따라 <strong>사전 승인된 계정</strong>만<br />
                                            메일 연동 기능을 테스트해볼 수 있어요.<br />
                                            테스트할 Gmail 주소를 남겨주시면 권한을 열어드릴게요!
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <input
                                                type="email"
                                                placeholder="테스트할 Gmail 주소를 입력해주세요"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setErrorMsg("");
                                                }}
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                                disabled={isLoading}
                                            />
                                            {errorMsg && (
                                                <p className="mt-2 text-sm text-red-500 text-center">{errorMsg}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 text-white rounded-2xl py-3.5 font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "신청하기"
                                            )}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </motion.div>
                                    <h2 className="text-xl font-black text-slate-900 mb-2">
                                        신청이 완료되었어요!
                                    </h2>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                        관리자가 확인 후 권한을 추가해드릴 예정입니다.<br />
                                        권한 추가 후 다시 연동을 시도해주세요.
                                    </p>
                                    <button
                                        onClick={handleClose}
                                        className="w-full bg-slate-100 text-slate-900 rounded-2xl py-3.5 font-bold text-sm hover:bg-slate-200 transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
