"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleUnsubscribe = async () => {
        if (!email) return;

        setStatus("loading");
        const supabase = createClient();

        try {
            // Update status to 'unsubscribed'
            const { error } = await supabase
                .from("newsletter_subscribers")
                .update({ 
                    status: "unsubscribed",
                    unsubscribed_at: new Date().toISOString()
                })
                .eq("email", email);

            if (error) throw error;
            setStatus("success");
        } catch (error) {
            console.error("Unsubscribe error:", error);
            setStatus("error");
        }
    };

    if (!email) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">잘못된 접근입니다.</p>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">구독이 취소되었습니다</h2>
                <p className="text-slate-500 mb-6">
                    {email}님의 이메일이<br />
                    구독 목록에서 제외되었습니다.
                </p>
                <Button 
                    className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                    onClick={() => window.location.href = '/'}
                >
                    홈으로 돌아가기
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">구독을 취소하시겠습니까?</h2>
            <p className="text-slate-500 mb-8">
                매월 1일 발송되는<br />
                웰다잉 트렌드 리포트를 더 이상 받지 않습니다.
            </p>
            <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 font-medium mb-4">
                    {email}
                </div>
                <Button 
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl text-base font-bold"
                    onClick={handleUnsubscribe}
                    disabled={status === "loading"}
                >
                    {status === "loading" ? "처리 중..." : "구독 취소하기"}
                </Button>
                <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-xl text-slate-500"
                    onClick={() => window.location.href = '/'}
                >
                    아니요, 계속 구독할게요
                </Button>
            </div>
            {status === "error" && (
                <p className="text-red-500 text-sm mt-4">
                    오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                </p>
            )}
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <div className="min-h-screen bg-slate-50 px-6">
            <Suspense fallback={<div>Loading...</div>}>
                <UnsubscribeContent />
            </Suspense>
        </div>
    );
}
