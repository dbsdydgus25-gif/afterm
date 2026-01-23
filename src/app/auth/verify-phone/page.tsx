"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, CheckCircle2 } from "lucide-react";

export default function VerifyPhonePage() {
    const router = useRouter();
    const supabase = createClient();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"input" | "verify">("input");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            setError("올바른 휴대전화 번호를 입력해주세요.");
            setLoading(false);
            return;
        }

        try {
            // Request OTP via existing server action (reusing logic or calling API)
            // For now, we will use a direct API call to existing verify logic if possible, 
            // but we need a specific 'send-otp' endpoint for ONBOARDING.
            // Since we don't have a dedicated onboarding OTP API yet, we'll assume we need to create one or reuse.
            // Let's reuse the recipient verification API logic but adapt it? 
            // NO, recipient verification is for MESSAGES. We need User Verification.
            // We should use Supabase Auth OTP with Phone if enabled? 
            // BUT Solapi was required for cost/customization reasons in previous context.
            // For this MVP step, let's implement a Server Action for this.

            // To keep it simple and safe for this turn, I'll mock the internal call to a Server Action we define.
            // Actually, we'll verify via the same Server Action style used in 'recipient'.
            // Blocked: We need a server action for this. I'll create it in next step.
            // UI Only for now.

            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to send OTP");

            setStep("verify");
        } catch (err: any) {
            setError(err.message || "인증번호 발송에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.replace(/[^0-9]/g, ''), token: otp })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Verification failed");

            // Success! Redirect to Dashboard
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "인증번호가 올바르지 않습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Phone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">휴대폰 본인인증</h1>
                    <p className="text-slate-500 text-sm">
                        안전한 서비스 이용을 위해 본인 명의의 휴대폰으로 인증해주세요.
                    </p>
                </div>

                {step === "input" ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="생년월일이나 비밀번호가 포함되지 않은 휴대폰 번호"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-center text-lg tracking-widest"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 text-lg rounded-xl"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "인증번호 받기"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="text-center mb-4">
                            <span className="text-slate-900 font-bold text-lg">{phone}</span>
                            <button
                                type="button"
                                onClick={() => setStep("input")}
                                className="ml-2 text-xs text-slate-400 underline"
                            >
                                수정
                            </button>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="인증번호 6자리"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-bold"
                                maxLength={6}
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-xl"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "인증 완료하기"}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
