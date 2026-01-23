"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/reset-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "오류가 발생했습니다.");
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
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">이메일 발송 완료</h1>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            <strong>{email}</strong> 주소로 비밀번호 재설정 링크를 보냈습니다.<br />
                            메일함을 확인해주세요.
                        </p>
                        <Link href="/login">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl">
                                로그인으로 돌아가기
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
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-6 h-6 text-slate-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">비밀번호 찾기</h1>
                        <p className="text-slate-500 text-sm">
                            가입한 이메일 주소를 입력하시면<br />
                            재설정 링크를 보내드립니다.
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-4 mb-6">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="이메일 주소"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-xl"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "재설정 링크 받기"}
                        </Button>
                    </form>

                    <div className="text-center">
                        <Link href="/login" className="text-slate-500 text-sm font-bold hover:underline">
                            로그인으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
