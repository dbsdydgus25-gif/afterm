"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function VerifyPhonePage() {
    const router = useRouter();
    const supabase = createClient();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"input" | "verify">("input");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Format phone number with dashes as user types
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 3 && value.length <= 7) {
            formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
        } else if (value.length > 7) {
            formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
        }
        setPhone(formatted);
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            setError("올바른 휴대전화 번호를 입력해주세요.");
            setLoading(false);
            return;
        }

        try {
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
                body: JSON.stringify({ phone: phone.replace(/[^0-9]/g, ''), otp }) // Logic uses 'otp' key not 'token'
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "인증 실패");

            // Redirect to Dashboard or Main
            router.push("/");
        } catch (err: any) {
            setError(err.message || "인증번호가 올바르지 않습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
                <div className="max-w-md w-full">
                    {/* Back Button */}
                    <div className="mb-8">
                        <button
                            onClick={() => {
                                if (step === 'verify') setStep('input');
                                else router.push('/auth/agreements'); // Or back to agreements/login
                            }}
                            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-1" />
                            이전
                        </button>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            {step === "input" ? "휴대폰 번호를 입력해주세요" : "인증번호를 입력해주세요"}
                        </h1>
                        <p className="text-slate-500 text-lg">
                            {step === "input"
                                ? "안전한 서비스 이용을 위해 본인인증이 필요합니다."
                                : `${phone}으로 전송된 6자리 번호를 입력해주세요.`}
                        </p>
                    </div>

                    {step === "input" ? (
                        <form onSubmit={handleRequestOtp} className="space-y-8">
                            <div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="010-0000-0000"
                                    className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-300 py-4 border-b-2 border-slate-200 focus:border-blue-600 outline-none transition-colors bg-transparent"
                                    autoFocus
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || phone.length < 12} // 010-xxxx-xxxx is 13 chars, 010-xxx-xxxx is 12
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-16 text-xl rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "인증번호 받기"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-8">
                            <div>
                                <input
                                    type="number"
                                    value={otp}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 6) setOtp(e.target.value);
                                    }}
                                    placeholder="000000"
                                    className="w-full text-4xl font-bold text-slate-900 placeholder:text-slate-300 py-4 border-b-2 border-slate-200 focus:border-blue-600 outline-none transition-colors bg-transparent tracking-widest text-center"
                                    autoFocus
                                    inputMode="numeric"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-16 text-xl rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "인증 완료하기"}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep("input")}
                                    className="text-slate-500 underline text-sm hover:text-slate-900"
                                >
                                    휴대폰 번호 수정하기
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
