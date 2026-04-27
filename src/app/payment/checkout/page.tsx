"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useMemoryStore } from "@/store/useMemoryStore";
import { ArrowLeft, Shield, Lock, CreditCard } from "lucide-react";
import Link from "next/link";

// 토스페이먼츠 클라이언트 키 (테스트 키)
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

/**
 * 결제 금액을 플랜과 결제 주기에 따라 반환하는 함수
 */
function getPrice(planId: string, cycle: string): number {
    if (planId === "pro") {
        return cycle === "yearly" ? 1000 : 100;
    }
    return 0;
}

/**
 * 토스페이먼츠 결제 위젯 페이지
 * - /payment/checkout?planId=pro&cycle=monthly 형태로 접근
 */
function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useMemoryStore();

    // URL 파라미터에서 플랜 정보 추출
    const planId = searchParams.get("planId") || "pro";
    const cycle = searchParams.get("cycle") || "monthly";
    const amount = getPrice(planId, cycle);

    // 주문 ID 생성 (고유값)
    const [orderId] = useState(() => `AFTERM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
    const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 토스페이먼츠 SDK 초기화
    const initPayment = useCallback(async () => {
        if (!user?.id) {
            router.push("/login?returnTo=/plans");
            return;
        }

        try {
            setIsLoading(true);
            // 고객 키: 토스페이먼츠 고객 식별자 (userId 기반)
            const customerKey = `AFTERM-USER-${user.id.replace(/-/g, "").slice(0, 16)}`;

            const tossPayments = await loadTossPayments(CLIENT_KEY);
            const widgetInstance = tossPayments.widgets({ customerKey });

            // 결제 금액 설정
            await widgetInstance.setAmount({
                currency: "KRW",
                value: amount,
            });

            setWidgets(widgetInstance);
            setIsLoading(false);
        } catch (err) {
            console.error("토스페이먼츠 초기화 오류:", err);
            setError("결제 모듈 로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
            setIsLoading(false);
        }
    }, [user, amount, router]);

    useEffect(() => {
        initPayment();
    }, [initPayment]);

    // 결제 위젯 렌더링
    useEffect(() => {
        if (!widgets) return;

        const renderWidgets = async () => {
            try {
                // 결제 방법 위젯 렌더링
                await widgets.renderPaymentMethods({
                    selector: "#payment-method",
                    variantKey: "DEFAULT",
                });

                // 약관 동의 위젯 렌더링
                await widgets.renderAgreement({
                    selector: "#agreement",
                    variantKey: "AGREEMENT",
                });

                setIsReady(true);
            } catch (err) {
                console.error("위젯 렌더링 오류:", err);
                setError("결제 화면 로드에 실패했습니다.");
            }
        };

        renderWidgets();
    }, [widgets]);

    /**
     * 결제 요청 핸들러
     * - 토스페이먼츠 결제창을 열고, 성공/실패 URL로 리다이렉트
     */
    const handlePayment = async () => {
        if (!widgets || !isReady) return;

        try {
            await widgets.requestPayment({
                orderId,
                orderName: `AFTERM PRO ${cycle === "yearly" ? "연간" : "월간"} 이용권`,
                successUrl: `${window.location.origin}/payment/success?billingCycle=${cycle}&userId=${user?.id}`,
                failUrl: `${window.location.origin}/payment/fail`,
                customerEmail: user?.email || undefined,
                customerName: user?.name || undefined,
            });
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            // 사용자가 결제창을 닫은 경우 무시
            if (error?.code === "USER_CANCEL") return;
            console.error("결제 요청 오류:", err);
            setError(error?.message || "결제 요청 중 오류가 발생했습니다.");
        }
    };

    const planLabel = cycle === "yearly" ? "연간" : "월간";
    const priceLabel = amount.toLocaleString("ko-KR");

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* 헤더 */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
                <Link href="/plans" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-base font-bold text-slate-900">결제하기</h1>
                    <p className="text-xs text-slate-400">안전한 토스페이먼츠 결제</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>SSL 보안</span>
                </div>
            </header>

            {/* 본문 */}
            <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5 pb-36">
                {/* 주문 요약 카드 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">결제 상품</p>
                            <p className="text-sm font-bold text-slate-900">AFTERM PRO {planLabel} 이용권</p>
                        </div>
                    </div>
                    <div className="h-px bg-slate-100 my-3" />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">결제 금액</span>
                        <span className="text-xl font-black text-blue-600">{priceLabel}원</span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                        <span className="text-xs text-slate-400">주문번호</span>
                        <span className="text-xs text-slate-400 font-mono">{orderId.slice(0, 20)}...</span>
                    </div>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* 로딩 상태 */}
                {isLoading && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">결제 모듈 불러오는 중...</p>
                    </div>
                )}

                {/* 토스페이먼츠 위젯 영역 */}
                <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${isLoading ? "hidden" : ""}`}>
                    <div id="payment-method" className="w-full" />
                </div>

                {/* 약관 동의 영역 */}
                <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${isLoading ? "hidden" : ""}`}>
                    <div id="agreement" className="w-full" />
                </div>

                {/* 보안 배지 */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Shield className="w-4 h-4" />
                    <span>토스페이먼츠의 안전한 보안 결제 시스템이 적용되어 있습니다</span>
                </div>
            </main>

            {/* 하단 고정 결제 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-bottom">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handlePayment}
                        disabled={!isReady || isLoading}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:shadow-none"
                    >
                        {isReady ? `${priceLabel}원 결제하기` : "로딩 중..."}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        결제 버튼 클릭 시 약관에 동의한 것으로 간주합니다
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
