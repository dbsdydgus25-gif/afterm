"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function FindIdPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [foundEmail, setFoundEmail] = useState<string | null>(null);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCodeSent && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCodeSent, timer]);

    const handleSendVerification = async () => {
        if (!phone || phone.length < 10) {
            alert("올바른 휴대폰 번호를 입력해주세요.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone, type: 'find' }) // 'find' type checks if phone exists
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

    const handleFindId = async () => {
        if (!verificationCode) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/find-id', {
                method: 'POST',
                body: JSON.stringify({ phone, code: verificationCode })
            });
            const data = await res.json();

            if (data.success) {
                setFoundEmail(data.email);
            } else {
                alert(data.error || "아이디 찾기 실패");
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
                    <h1 className="text-2xl font-black text-slate-900 mb-2">아이디 찾기</h1>
                    <p className="text-sm text-slate-500">
                        가입하신 휴대폰 번호로 아이디를 찾습니다.
                    </p>
                </div>

                {!foundEmail ? (
                    <div className="space-y-4">
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
                            onClick={handleFindId}
                            disabled={loading || !verificationCode}
                            className="w-full h-14 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "아이디 찾기"}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2">아이디를 찾았습니다!</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
                            <p className="text-lg font-medium text-slate-900">{foundEmail}</p>
                        </div>

                        <Link href="/login" className="block w-full">
                            <Button className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold text-lg">
                                로그인하러 가기
                            </Button>
                        </Link>

                        <Link href="/auth/find-password">
                            <button className="mt-4 text-sm text-slate-500 hover:text-slate-800 underline">
                                비밀번호도 잊으셨나요?
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
