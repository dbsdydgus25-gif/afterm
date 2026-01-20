"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useMemoryStore } from "@/store/useMemoryStore";
import { useRouter } from "next/navigation";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [step, setStep] = useState<"reason" | "verify">("reason");
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [verifyEmail, setVerifyEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reasons = [
        "더 이상 이용하지 않습니다.",
        "보안이 걱정됩니다.",
        "삭제하고 싶은 기록이 있습니다.",
        "다른 계정을 사용하고 싶습니다.",
        "기타 (직접 입력)"
    ];

    const handleSubmit = async () => {
        if (!user) return;
        if (verifyEmail !== user.email) {
            alert("이메일이 일치하지 않습니다.");
            return;
        }

        if (!confirm("정말로 탈퇴하시겠습니까? 돌이킬 수 없습니다.")) return;

        setIsSubmitting(true);
        const finalReason = reason === "기타 (직접 입력)" ? customReason : reason;

        try {
            const res = await fetch("/api/auth/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmEmail: verifyEmail,
                    reason: finalReason
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "탈퇴 처리 실패");
            }

            alert("회원 탈퇴가 완료되었습니다.");
            setUser(null);
            onClose();
            router.push("/");
            router.refresh(); // Refresh stored auth state

        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isNextDisabled = !reason || (reason === "기타 (직접 입력)" && !customReason.trim());

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">회원 탈퇴</h2>
                                <p className="text-slate-500 mt-2 text-sm">
                                    탈퇴 시 모든 데이터는 영구 삭제되며<br />복구할 수 없습니다.
                                </p>
                            </div>

                            {step === "reason" ? (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700">탈퇴하시는 이유가 무엇인가요?</h3>
                                    <div className="space-y-2">
                                        {reasons.map((r) => (
                                            <div
                                                key={r}
                                                onClick={() => setReason(r)}
                                                className={`p-3 rounded-xl border text-sm cursor-pointer transition-all ${reason === r
                                                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                                                    }`}
                                            >
                                                {r}
                                            </div>
                                        ))}
                                    </div>
                                    {reason === "기타 (직접 입력)" && (
                                        <textarea
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            placeholder="이유를 입력해주세요."
                                            className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                        />
                                    )}
                                    <Button
                                        onClick={() => setStep("verify")}
                                        disabled={isNextDisabled}
                                        className="w-full h-12 rounded-xl text-base font-bold mt-4"
                                    >
                                        다음
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-200">
                                        본인 확인을 위해 아래의 이메일을<br />
                                        <span className="font-bold text-slate-900">{user?.email}</span><br />
                                        정확하게 입력해주세요.
                                    </div>

                                    <input
                                        type="email"
                                        value={verifyEmail}
                                        onChange={(e) => setVerifyEmail(e.target.value)}
                                        placeholder="이메일 입력"
                                        className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-center font-medium placeholder:text-slate-400"
                                    />

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setStep("reason")}
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl font-bold"
                                        >
                                            이전
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={verifyEmail !== user?.email || isSubmitting}
                                            className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-200 disabled:text-slate-400"
                                        >
                                            {isSubmitting ? "처리 중..." : "영구 탈퇴"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
