"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

/**
 * 토스페이먼츠 결제 실패 페이지
 * - 사용자가 결제를 취소하거나 오류가 발생했을 때 표시
 */
function PaymentFailContent() {
    const searchParams = useSearchParams();

    // 토스페이먼츠가 전달하는 오류 정보
    const errorCode = searchParams.get("code") || "";
    const errorMessage = searchParams.get("message") || "결제가 취소되었습니다.";

    // 사용자 취소인지 오류인지 구분
    const isUserCancel = errorCode === "PAY_PROCESS_CANCELED" || errorCode === "USER_CANCEL";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-3xl p-10 shadow-lg flex flex-col items-center gap-5 text-center">
                    {/* 아이콘 */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isUserCancel ? "bg-slate-100" : "bg-red-100"}`}>
                        <XCircle
                            className={`w-12 h-12 ${isUserCancel ? "text-slate-400" : "text-red-500"}`}
                            strokeWidth={2}
                        />
                    </div>

                    {/* 메시지 */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">
                            {isUserCancel ? "결제가 취소되었습니다" : "결제에 실패했습니다"}
                        </h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {isUserCancel
                                ? "언제든지 다시 시도하실 수 있습니다."
                                : errorMessage}
                        </p>
                        {errorCode && !isUserCancel && (
                            <p className="text-xs text-red-400 bg-red-50 px-3 py-1 rounded-lg font-mono">
                                오류 코드: {errorCode}
                            </p>
                        )}
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3 w-full mt-2">
                        <Link
                            href="/plans"
                            className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors text-sm"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            다시 시도
                        </Link>
                        <Link
                            href="/"
                            className="flex-1 h-12 border border-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            홈으로
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <PaymentFailContent />
        </Suspense>
    );
}
