"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, CheckCircle2 } from "lucide-react";
import { validatePassword } from "@/lib/compliance";

export default function SignupPage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // --- Info & Verification State ---
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Email Verification
    const [emailCode, setEmailCode] = useState("");
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    // --- Handlers ---

    // 2. Send Email Verification Code
    const sendEmailVerification = async () => {
        if (!email || !email.includes("@")) {
            alert("올바른 이메일 주소를 입력해주세요.");
            return;
        }
        setSendingEmail(true);
        try {
            const res = await fetch('/api/email/verify/send', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setIsEmailCodeSent(true);
                alert("인증번호가 이메일로 발송되었습니다.");
            } else {
                alert(data.error || "이메일 발송 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setSendingEmail(false);
        }
    };

    // 3. Register User (Verify Email Code -> Create User -> Auto Login)
    const handleRegister = async () => {
        if (!email || !password || !emailCode) return;

        // Validate Password
        const pwCheck = validatePassword(password, email);
        if (!pwCheck.isValid) {
            alert(pwCheck.message);
            return;
        }
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);
        try {
            // A. Register API (Verifies Code + Creates User)
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, code: emailCode })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "회원가입 실패");
            }

            // B. Auto Login
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) throw loginError;

            // Note: We do NOT insert agreements here anymore.
            // Agreements will be handled in /onboarding Step 0.

            // C. Redirect to Onboarding
            router.replace("/onboarding");

        } catch (error: any) {
            alert(error.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="max-w-md mx-auto px-6 pt-32 pb-20 animate-in fade-in duration-500">

                {/* Header Text */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">회원가입</h1>
                    <p className="text-slate-500">
                        계정 정보를 입력해주세요.
                    </p>
                </div>

                {/* --- Step 2: Info & Verification (Directly Shown) --- */}
                <div className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                disabled={isEmailCodeSent}
                                className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                                onClick={sendEmailVerification}
                                disabled={sendingEmail || isEmailCodeSent}
                                className="w-24 rounded-xl bg-slate-800 text-white font-bold text-xs"
                            >
                                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : isEmailCodeSent ? "완료" : "인증"}
                            </Button>
                        </div>
                    </div>

                    {/* Verification Code */}
                    {isEmailCodeSent && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">인증번호</label>
                            <input
                                type="text"
                                value={emailCode}
                                onChange={(e) => setEmailCode(e.target.value)}
                                placeholder="이메일로 전송된 6자리 코드"
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold tracking-widest"
                                maxLength={6}
                            />
                            <p className="text-xs text-blue-600 mt-2 ml-1">인증번호가 발송되었습니다. 이메일을 확인해주세요.</p>
                        </div>
                    )}

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호 확인</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 다시 입력해주세요"
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {password && confirmPassword && (
                            <p className={`text-xs mt-2 ml-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                {password === confirmPassword ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleRegister}
                        disabled={loading || !emailCode || !password || password !== confirmPassword}
                        className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-8"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입하기"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
