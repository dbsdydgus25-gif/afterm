"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useMemoryStore } from "@/store/useMemoryStore";

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useMemoryStore();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("결제를 확인하고 있습니다...");

    useEffect(() => {
        const verifyPayment = async () => {
            const paymentKey = searchParams.get("paymentKey");
            const orderId = searchParams.get("orderId");
            const amount = searchParams.get("amount");
            const billingCycle = searchParams.get("billingCycle");

            if (!paymentKey || !orderId || !amount) {
                setStatus("error");
                setMessage("결제 정보가 올바르지 않습니다.");
                console.error("Missing payment params:", { paymentKey, orderId, amount });
                return;
            }

            try {
                const response = await fetch("/api/payment/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        paymentKey,
                        orderId,
                        amount: Number(amount),
                        billingCycle,
                        userId: user?.id,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Payment verification failed");
                }

                setStatus("success");
                setMessage("결제가 성공적으로 완료되었습니다! 이용권이 갱신되었습니다.");

                // Redirect after 3 seconds
                setTimeout(() => router.replace("/plans"), 3000);

            } catch (error: any) {
                console.error("Payment confirmation error:", error);
                setStatus("error");
                setMessage(`결제 승인 중 오류가 발생했습니다: ${error.message}`);
            }
        };

        if (user?.id) {
            verifyPayment();
        }
        // If user ID is missing (not logged in or loading), we wait. 
        // In a real app, we might handle "not logged in" state more gracefully here.
    }, [searchParams, user?.id, router]);

    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="mb-6 flex justify-center">
                {status === "loading" && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>}
                {status === "success" && <div className="text-5xl">🎉</div>}
                {status === "error" && <div className="text-5xl">⚠️</div>}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {status === "loading" && "결제 확인 중..."}
                {status === "success" && "결제 완료!"}
                {status === "error" && "결제 실패"}
            </h2>

            <p className="text-slate-600 mb-8 leading-relaxed">
                {message}
            </p>

            <button
                onClick={() => router.replace("/plans")}
                className="w-full py-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
                돌아가기
            </button>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <main className="pt-32 pb-20 px-6 max-w-lg mx-auto text-center">
                <Suspense fallback={
                    <div className="bg-white rounded-3xl p-8 shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">로딩 중...</h2>
                    </div>
                }>
                    <PaymentSuccessContent />
                </Suspense>
            </main>
        </div>
    );
}
