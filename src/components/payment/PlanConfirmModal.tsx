import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface PlanConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetPlan: "free" | "pro";
    currentPlan: "free" | "pro";
    remainingDays?: number;
    endDate?: string;
    onConfirm: () => Promise<void>;
    billingCycle?: "monthly" | "yearly";
}

export function PlanConfirmModal({ isOpen, onClose, targetPlan, currentPlan, remainingDays, endDate, onConfirm, billingCycle = "monthly" }: PlanConfirmModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const planName = targetPlan === "pro" ? "AFTERM Pro" : "AFTERM Basic";

    // Determine price based on plan and billing cycle
    let price = "무료";
    if (targetPlan === "pro") {
        price = billingCycle === "yearly" ? "9,900원 / 년" : "990원 / 월";
    }

    // Determine title and message
    let title = "결제 정보 확인";
    let warningMessage = "";

    if (currentPlan === "pro" && targetPlan === "free") {
        title = "이용권 연장 취소";
        warningMessage = "현재 이용 중인 혜택은 만료일까지 유지됩니다.";
    } else if (currentPlan === "free" && targetPlan === "pro") {
        warningMessage = "결제 즉시 보관된 메시지가 모두 복원됩니다.";
    } else if (currentPlan === "pro" && targetPlan === "pro") {
        warningMessage = "현재 만료일에서 이용 기간이 추가로 연장됩니다.";
    }

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Plan change error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
                                <p className="text-slate-500">선택하신 플랜을 확인해주세요.</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">상품명</span>
                                    <span className="text-slate-900 font-bold text-lg">{planName}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-slate-600 font-medium">결제 금액</span>
                                    <span className="text-blue-600 font-black text-xl">{price}</span>
                                </div>
                                {targetPlan === "pro" && (
                                    <div className="flex justify-between items-center py-3 border-t border-slate-100">
                                        <span className="text-slate-600 font-medium">결제 주기</span>
                                        <span className="text-slate-900 font-bold text-lg">
                                            {billingCycle === "yearly" ? "연간 결제 (17% 할인)" : "월간 결제"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {warningMessage && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-amber-800 text-center">
                                        ⚠️ {warningMessage}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={onClose}
                                    disabled={isProcessing}
                                    className="flex-1 h-14 text-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                                >
                                    취소
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                    className="flex-1 h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30"
                                >
                                    {isProcessing ? "처리 중..." : "결제하기"}
                                </Button>
                            </div>

                            <p className="text-xs text-center text-slate-400 mt-4">
                                * 실제 결제가 이루어지지 않는 시뮬레이션입니다.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
