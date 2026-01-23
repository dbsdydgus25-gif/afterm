"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Loader2, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function FindPasswordPage() {
    const [step, setStep] = useState<"input" | "otp" | "done">("input");
    const [name, setName] = useState(""); // Optional? No, find PW usually needs stricter checks.
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Send OTP to Phone (Verify it matches Email first?)
    // Actually, we can't easily verify if Email & Phone match before OTP because of privacy/security enumeration?
    // But for Find Password, we usually require Email + Phone.
    // Our API `send-otp` just sends to phone. 
    // We will verify the match AFTER OTP is verified in the final step.
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "인증번호 발송 실패");

            setStep("otp");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and Trigger Password Reset Email
    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Call Special API: verify-and-reset
            const res = await fetch("/api/auth/find-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, phone, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "확인 실패");

            setStep("done");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-6 h-6 text-slate-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">비밀번호 찾기</h1>
                        <p className="text-slate-500 text-sm">
                            가입한 이메일과 휴대폰 번호로<br />
                            본인 인증을 진행해주세요.
                        </p>
                    </div>

                    {step === "input" && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">이메일</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">휴대폰 번호</label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="숫자만 입력"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-xl">
                                {loading ? <Loader2 className="animate-spin" /> : "인증번호 받기"}
                            </Button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyAndReset} className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl mb-4 text-sm text-blue-800">
                                <strong>{phone}</strong>으로 발송된<br />인증번호를 입력해주세요.
                            </div>
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="인증번호 6자리"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl">
                                {loading ? <Loader2 className="animate-spin" /> : "본인인증 및 재설정 메일받기"}
                            </Button>
                        </form>
                    )}

                    {step === "done" && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">재설정 메일 발송 완료</h2>
                            <p className="text-slate-600 mb-8">
                                <strong>{email}</strong> 주소로<br />
                                비밀번호 재설정 링크를 보냈습니다.<br />
                                메일을 확인해주세요.
                            </p>
                            <Link href="/login">
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl">
                                    로그인으로 돌아가기
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
