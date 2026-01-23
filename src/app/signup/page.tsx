"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { validatePassword } from "@/lib/compliance";

export default function SignupPage() {
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Real-time validation
    const passwordValidation = validatePassword(password, email);
    const isPasswordValid = password.length > 0 && passwordValidation.isValid;
    const isMatch = password === confirmPassword && password.length > 0;

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            setError(passwordValidation.message);
            return;
        }

        if (!isMatch) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: email.split('@')[0], // Default name
                    }
                },
            });

            if (error) throw error;

            if (data.user) {
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || "회원가입 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                <Header />
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">인증 메일 발송 완료</h1>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            <strong>{email}</strong> 주소로 인증 메일을 보냈습니다.<br />
                            메일의 링크를 클릭하여 회원가입을 완료해주세요.
                        </p>
                        <Link href="/login">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl">
                                로그인 페이지로 이동
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 mt-20 md:mt-0">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">회원가입</h1>
                        <p className="text-slate-500 text-sm">
                            안전한 서비스 이용을 위해 계정을 생성하세요.
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-5 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">이메일</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="10자 이상, 대/소문자/숫자/특수문자 포함"
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${password.length > 0 && !isPasswordValid
                                        ? 'border-red-200 focus:ring-red-200 bg-red-50'
                                        : 'border-slate-200 focus:ring-blue-500 focus:border-transparent'
                                    }`}
                            />
                            {password.length > 0 && !isPasswordValid && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {passwordValidation.message}
                                </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1 pl-1">
                                * 영문 대/소문자, 숫자, 특수문자 포함 10자 이상
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">비밀번호 확인</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호 재입력"
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${confirmPassword.length > 0 && !isMatch
                                        ? 'border-red-200 focus:ring-red-200 bg-red-50'
                                        : 'border-slate-200 focus:ring-blue-500 focus:border-transparent'
                                    }`}
                            />
                            {confirmPassword.length > 0 && !isMatch && (
                                <p className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !isPasswordValid || !isMatch}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-xl transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입하기"}
                        </Button>
                    </form>

                    <div className="text-center">
                        <p className="text-slate-500 text-sm">
                            이미 계정이 있으신가요?{" "}
                            <Link href="/login" className="text-blue-600 font-bold hover:underline">
                                로그인
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
