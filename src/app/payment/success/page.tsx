"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { useMemoryStore } from "@/store/useMemoryStore";
import Link from "next/link";

/**
 * 토스페이먼츠 결제 성공 처리 페이지
 * - 토스페이먼츠로부터 paymentKey, orderId, amount를 받아 서버에서 결제 승인 처리
 * - 처리 완료 후 대시보드로 이동
 */
function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setPlan } = useMemoryStore();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [errorMessage, setErrorMessage] = useState("");
    const [newEndDate, setNewEndDate] = useState<string | null>(null);
    // 중복 실행 방지 플래그
    const confirmedRef = useRef(false);

    useEffect(() => {
        // 중복 실행 방지
        if (confirmedRef.current) return;
        confirmedRef.current = true;

        const confirmPayment = async () => {
            // 토스페이먼츠가 전달하는 결제 파라미터 추출
            const paymentKey = searchParams.get("paymentKey");
            const orderId = searchParams.get("orderId");
            const amount = searchParams.get("amount");
            const billingCycle = searchParams.get("billingCycle") || "monthly";
            const userId = searchParams.get("userId");

            if (!paymentKey || !orderId || !amount) {
                setStatus("error");
                setErrorMessage("결제 정보가 올바르지 않습니다.");
                return;
            }

            try {
                // 서버사이드 결제 승인 API 호출
                const response = await fetch("/api/payment/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        paymentKey,
                        orderId,
                        amount: Number(amount),
                        billingCycle,
                        userId,
                    }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || "결제 승인에 실패했습니다.");
                }

                // 클라이언트 상태 즉시 업데이트
                setPlan("pro");
                setNewEndDate(data.newEndDate);
                setStatus("success");

                // 3초 후 대시보드로 이동
                setTimeout(() => {
                    router.push("/dashboard");
                }, 3000);

            } catch (err: unknown) {
                const error = err as Error;
                console.error("결제 승인 오류:", error);
                setStatus("error");
                setErrorMessage(error?.message || "결제 처리 중 오류가 발생했습니다.");
            }
        };

        confirmPayment();
    }, [searchParams, router, setPlan]);

    // 결제 만료일 포맷
    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">

                {/* 처리 중 */}
                {status === "processing" && (
                    <div className="bg-white rounded-3xl p-10 shadow-lg flex flex-col items-center gap-5 text-center">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">결제 확인 중...</h2>
                            <p className="text-sm text-slate-400">잠시만 기다려주세요</p>
                        </div>
                    </div>
                )}

                {/* 결제 성공 */}
                {status === "success" && (
                    <div className="bg-white rounded-3xl p-10 shadow-lg flex flex-col items-center gap-5 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">결제 완료! 🎉</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                AFTERM PRO 이용권이 활성화되었습니다.
                                <br />
                                모든 기능을 제한 없이 사용하세요.
                            </p>
                        </div>

                        {newEndDate && (
                            <div className="w-full bg-blue-50 rounded-2xl p-4">
                                <p className="text-xs text-blue-400 mb-1">구독 만료일</p>
                                <p className="text-base font-bold text-blue-700">{formatDate(newEndDate)}</p>
                            </div>
                        )}

                        <p className="text-xs text-slate-400">3초 후 대시보드로 이동합니다...</p>

                        <Link
                            href="/dashboard"
                            className="w-full h-12 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            대시보드로 이동
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* 결제 오류 */}
                {status === "error" && (
                    <div className="bg-white rounded-3xl p-10 shadow-lg flex flex-col items-center gap-5 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl">
                            ❌
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900">결제 실패</h2>
                            <p className="text-sm text-red-500">{errorMessage}</p>
                            <p className="text-xs text-slate-400">
                                결제가 완료되지 않았습니다. 다시 시도해주세요.
                            </p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <Link
                                href="/plans"
                                className="flex-1 h-12 border border-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors text-sm"
                            >
                                플랜으로
                            </Link>
                            <Link
                                href="/"
                                className="flex-1 h-12 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-colors text-sm gap-1"
                            >
                                <Home className="w-4 h-4" />
                                홈으로
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
