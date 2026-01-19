import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { useState } from "react";
import { useMemoryStore } from "@/store/useMemoryStore";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: "Standard" | "Pro";
    price: string;
}

export function PaymentModal({ isOpen, onClose, planName, price }: PaymentModalProps) {
    const [step, setStep] = useState<"summary" | "processing" | "success">("summary");
    const { setPlan } = useMemoryStore();

    const handlePayment = () => {
        setStep("processing");
        setTimeout(() => {
            setStep("success");
            if (planName === "Pro") {
                setPlan("pro");
            }
        }, 2000);
    };

    const handleClose = () => {
        setStep("summary");
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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <button onClick={handleClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>

                            {step === "summary" && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-slate-900">결제 정보 확인</h2>
                                        <p className="text-slate-500 mt-2">선택하신 플랜을 확인해주세요.</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-600 font-medium">상품명</span>
                                            <span className="text-slate-900 font-bold text-lg">Afterm {planName}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">결제 금액</span>
                                            <span className="text-blue-600 font-black text-xl">{price}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button onClick={handlePayment} className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
                                            결제하기
                                        </Button>
                                        <p className="text-xs text-center text-slate-400">
                                            * 실제 결제가 이루어지지 않는 시뮬레이션입니다.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === "processing" && (
                                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900">결제 처리 중...</h3>
                                        <p className="text-slate-500">잠시만 기다려주세요.</p>
                                    </div>
                                </div>
                            )}

                            {step === "success" && (
                                <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                        <Check className="w-10 h-10" strokeWidth={3} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-slate-900">결제 완료!</h3>
                                        <p className="text-slate-500">이제 {planName} 플랜을 이용하실 수 있습니다.</p>
                                    </div>
                                    <Button onClick={handleClose} className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 rounded-xl mt-4">
                                        확인
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
