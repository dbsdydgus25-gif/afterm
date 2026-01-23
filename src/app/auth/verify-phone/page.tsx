"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function VerifyPhonePage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"input" | "verify">("input");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Format: 010-0000-0000
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
            if (!response.ok) throw new Error(data.error || "인증번호 발송 실패");

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
                body: JSON.stringify({ phone: phone.replace(/[^0-9]/g, ''), otp })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "인증 실패");

            // Success -> Redirect to Profile Setup (Onboarding)
            router.push("/onboarding");
        } catch (err: any) {
            setError(err.message || "인증번호가 올바르지 않습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-28 pb-12">
                <div className="max-w-md w-full mb-8">
                    {/* 4-Step Progress Bar */}
                    <div className="flex items-center justify-between mb-8 px-1">
                        {/* Step 1: Agreements (Done) */}
                        <div className="flex flex-col items-center gap-2 text-blue-600">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-500">약관동의</span>
                        </div>
                        <div className="h-[2px] flex-1 bg-blue-600 mx-2" />

                        {/* Step 2: Verification (Active) */}
                        <div className="flex flex-col items-center gap-2 text-blue-600">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-blue-600 text-white shadow-md shadow-blue-200">
                                2
                            </div>
                            <span className="text-xs font-bold">본인인증</span>
                        </div>
                        <div className="h-[2px] flex-1 bg-slate-200 mx-2" />

                        {/* Step 3: Profile */}
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200">
                                3
                            </div>
                            <span className="text-xs font-bold">프로필</span>
                        </div>
                        <div className="h-[2px] flex-1 bg-slate-200 mx-2" />

                        {/* Step 4: Done */}
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200">
                                4
                            </div>
                            <span className="text-xs font-bold">완료</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
                        {/* Back Button inside the card or outside? Signup page has it inside as 'Previous'. 
                           User asked for "Back Tab" in the middle? "중간에 이전 탭도 만들어서".
                           Let's put a simple Back button top left of the card. */}
                        <button
                            onClick={() => {
                                if (step === 'verify') setStep('input');
                                else router.push('/auth/agreements');
                            }}
                            className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-8 mt-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">휴대폰 본인인증</h1>
                            <p className="text-slate-500 text-sm">
                                {step === "input" ? "안전한 서비스 이용을 위해 인증이 필요합니다." : "문자로 전송된 인증번호를 입력해주세요."}
                            </p>
                        </div>

                        {step === "input" ? (
                            <form onSubmit={handleRequestOtp} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">휴대폰 번호</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="010-0000-0000"
                                        className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg"
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    disabled={loading || phone.length < 12}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-xl text-md"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "인증번호 받기"}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">인증번호</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={otp}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 6) setOtp(e.target.value);
                                            }}
                                            placeholder="000000"
                                            className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg tracking-widest text-center"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="text-center mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep("input")}
                                            className="text-xs text-slate-400 underline hover:text-slate-600"
                                        >
                                            번호 수정하기
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl text-md"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "인증 완료"}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
