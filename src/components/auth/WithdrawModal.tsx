"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Loader2, Phone, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMemoryStore } from "@/store/useMemoryStore";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [step, setStep] = useState<"reason" | "verify" | "confirm">("reason");
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    // Email Verification State
    const [verifyEmail, setVerifyEmail] = useState("");

    // SMS Verification State
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [timer, setTimer] = useState(0);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isSmsVerified, setIsSmsVerified] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const reasons = [
        "더 이상 이용하지 않습니다.",
        "보안이 걱정됩니다.",
        "삭제하고 싶은 기록이 있습니다.",
        "다른 계정을 사용하고 싶습니다.",
        "기타 (직접 입력)"
    ];

    const handleSendVerification = async () => {
        if (!phone) return;

        // Clean phone number
        const cleanPhone = phone.replace(/-/g, '');
        if (cleanPhone.length < 10) {
            alert("유효한 휴대폰 번호를 입력해주세요.");
            return;
        }

        setIsSendingCode(true);
        try {
            const res = await fetch("/api/verify/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: cleanPhone }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "인증번호 전송 실패");

            setIsCodeSent(true);
            setTimer(180); // 3 minutes
            alert("인증번호가 전송되었습니다.");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleConfirmVerification = async () => {
        if (!verificationCode) return;

        setIsVerifyingCode(true);
        const cleanPhone = phone.replace(/-/g, '');

        try {
            const res = await fetch("/api/verify/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: cleanPhone,
                    code: verificationCode
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "인증 실패");

            setIsSmsVerified(true);
            setTimer(0);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const handleNext = () => {
        if (step === 'verify') {
            if (verifyEmail !== user?.email) {
                alert("이메일이 일치하지 않습니다.");
                return;
            }
            if (!isSmsVerified) {
                alert("휴대폰 인증을 완료해주세요.");
                return;
            }
            setStep('confirm');
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
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

            const supabase = createClient();
            await supabase.auth.signOut(); // Explicitly sign out from Supabase

            alert("회원 탈퇴가 완료되었습니다.");
            setUser(null);
            onClose();
            router.push("/");
            router.refresh();

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
                            ) : step === 'verify' ? (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-200">
                                        본인 확인을 위해 이메일과 휴대폰 번호를<br />
                                        <span className="font-bold text-slate-900">모두 인증</span>해주세요.
                                    </div>

                                    {/* Email Verification */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">이메일 확인</label>
                                        <input
                                            type="email"
                                            value={verifyEmail}
                                            onChange={(e) => setVerifyEmail(e.target.value)}
                                            placeholder={user?.email || "이메일 입력"}
                                            className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-medium placeholder:text-slate-400"
                                        />
                                        {verifyEmail === user?.email && verifyEmail !== "" && (
                                            <p className="text-xs text-green-600 font-bold ml-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> 이메일이 일치합니다.
                                            </p>
                                        )}
                                    </div>

                                    {/* SMS Verification */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">휴대폰 번호 인증</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                                placeholder="010-0000-0000"
                                                disabled={isSmsVerified}
                                                className="flex-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                                                maxLength={13}
                                            />
                                            <Button
                                                onClick={handleSendVerification}
                                                disabled={isSmsVerified || isSendingCode || phone.length < 10 || (isCodeSent && timer > 0)}
                                                className="h-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl whitespace-nowrap"
                                            >
                                                {isSmsVerified ? "인증완료" : isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : isCodeSent ? "재전송" : "인증번호"}
                                            </Button>
                                        </div>

                                        {isCodeSent && !isSmsVerified && (
                                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={verificationCode}
                                                        onChange={(e) => setVerificationCode(e.target.value)}
                                                        placeholder="인증번호 6자리"
                                                        maxLength={6}
                                                        className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-500 font-medium">
                                                        {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <Button
                                                    onClick={handleConfirmVerification}
                                                    disabled={verificationCode.length !== 6 || isVerifyingCode}
                                                    className="h-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold whitespace-nowrap"
                                                >
                                                    {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "확인"}
                                                </Button>
                                            </div>
                                        )}

                                        {isSmsVerified && (
                                            <p className="text-xs text-green-600 font-bold ml-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> 휴대폰 인증이 완료되었습니다.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            onClick={() => setStep("reason")}
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl font-bold"
                                        >
                                            이전
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={verifyEmail !== user?.email || !isSmsVerified}
                                            className="flex-1 h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-400"
                                        >
                                            다음
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Final Confirmation Step
                                <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2">
                                        <AlertTriangle className="w-8 h-8" />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900">정말 떠나시겠습니까?</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            회원 탈퇴 시 모든 데이터는 즉시 삭제되며,<br />
                                            <span className="font-bold text-red-500">절대로 복구할 수 없습니다.</span>
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 border border-slate-200">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">탈퇴 사유</span>
                                            <span className="font-bold text-slate-900">{reason === "기타 (직접 입력)" ? "기타" : reason}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">계정</span>
                                            <span className="font-bold text-slate-900">{user?.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            onClick={() => setStep("verify")}
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl font-bold"
                                        >
                                            취소
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-200 disabled:text-slate-400"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    처리 중...
                                                </span>
                                            ) : "영구 탈퇴 확인"}
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
