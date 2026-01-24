"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function FindPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"verify" | "reset" | "success">("verify");

    // Step 1: Verification
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const [loading, setLoading] = useState(false);

    // Step 2: Reset
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCodeSent && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCodeSent, timer]);

    const handleSendVerification = async () => {
        if (!email || !phone) {
            alert("이메일과 휴대폰 번호를 모두 입력해주세요.");
            return;
        }
        if (phone.length < 10) {
            alert("올바른 휴대폰 번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone, type: 'find' }) // 'find' checks validation
            });
            const data = await res.json();

            if (data.success) {
                setIsCodeSent(true);
                setTimer(180);
                alert("인증번호가 발송되었습니다.");
            } else {
                alert(data.error || "발송 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                body: JSON.stringify({ phone, code: verificationCode })
            });
            const data = await res.json();

            if (data.success) {
                setIsCodeVerified(true);
                setStep("reset");
            } else {
                alert(data.error || "인증번호가 올바르지 않습니다.");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            alert("새 비밀번호를 입력해주세요.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (newPassword.length < 6) {
            alert("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        // KHIDI / KISA Password Rules (Simple Check)
        // const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,20}$/;
        // if (!passwordRegex.test(newPassword)) { ... }
        // For now, keep it simple or match existing rules

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    phone,
                    code: verificationCode,
                    newPassword
                })
            });
            const data = await res.json();

            if (data.success) {
                setStep("success");
            } else {
                alert(data.error || "비밀번호 재설정 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden">
                <Link
                    href="/login"
                    className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <div className="flex justify-center mb-6">
                    <Image src="/logo.jpg" alt="Logo" width={60} height={60} className="rounded-xl shadow-sm" />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">비밀번호 찾기</h1>
                    <p className="text-sm text-slate-500">
                        {step === "verify" && "가입된 정보로 본인인증을 진행합니다."}
                        {step === "reset" && "새로운 비밀번호를 입력해주세요."}
                        {step === "success" && "비밀번호가 성공적으로 변경되었습니다."}
                    </p>
                </div>

                {step === "verify" && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">이메일 (아이디)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="w-full h-12 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">휴대폰 번호</label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                    placeholder="010-0000-0000"
                                    maxLength={13}
                                    className="flex-1 h-12 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                                <Button
                                    onClick={handleSendVerification}
                                    disabled={loading || (isCodeSent && timer > 0)}
                                    className="h-12 w-20 rounded-xl bg-slate-900 text-white font-bold text-sm"
                                >
                                    {loading && !isCodeSent ? <Loader2 className="w-4 h-4 animate-spin" /> : isCodeSent ? "재전송" : "전송"}
                                </Button>
                            </div>
                        </div>

                        {isCodeSent && (
                            <div className="relative animate-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="인증번호 6자리"
                                    className="w-full h-12 p-3 pr-20 rounded-xl border border-blue-200 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 font-medium">
                                    {Math.floor(timer / 60)}:{((timer % 60)).toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}

                        <Button
                            onClick={handleVerifyCode}
                            disabled={loading || !verificationCode}
                            className="w-full h-14 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "확인"}
                        </Button>
                    </div>
                )}

                {step === "reset" && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                                className="w-full h-12 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호 다시 입력"
                                className="w-full h-12 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>

                        <Button
                            onClick={handleResetPassword}
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full h-14 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "비밀번호 변경하기"}
                        </Button>
                    </div>
                )}

                {step === "success" && (
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2">변경 완료!</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
                            <p className="text-slate-600">
                                비밀번호가 성공적으로 변경되었습니다.<br />
                                새 비밀번호로 로그인해주세요.
                            </p>
                        </div>

                        <Link href="/login" className="block w-full">
                            <Button className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold text-lg">
                                로그인하러 가기
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
