"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError("가입되지 않은 이메일이거나 비밀번호가 올바르지 않습니다. (회원가입이 필요할 수 있습니다)");
            } else {
                // Check for returnTo param
                const params = new URLSearchParams(window.location.search);
                const returnTo = params.get("returnTo");
                if (returnTo) {
                    router.push(returnTo);
                } else {
                    router.push("/");
                }
            }
        } catch (err) {
            setError("로그인 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: "google" | "kakao") => {
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("returnTo") || "/";

        // Set cookie for robustness (in case query param is stripped by provider)
        document.cookie = `auth_return_to=${encodeURIComponent(returnTo)}; path=/; max-age=300`; // 5 mins expiration

        // Use hostname to determine if we're in production
        const isProduction = location.hostname === 'afterm.co.kr' || location.hostname === 'www.afterm.co.kr';
        const redirectUrl = isProduction
            ? 'https://www.afterm.co.kr/auth/callback'
            : `${location.origin}/auth/callback`;

        console.log("=== OAUTH LOGIN ===");
        console.log("Hostname:", location.hostname);
        console.log("Is production:", isProduction);
        console.log("Redirect URL:", redirectUrl);

        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${redirectUrl}?next=${encodeURIComponent(returnTo)}`,
                // We still pass next in URL as backup, but rely on cookie primarily in callback
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-28 pb-12">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">로그인</h1>
                        <p className="text-slate-500">
                            계정 정보를 입력하거나 SNS로 시작하세요.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 mb-8">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="이메일 주소"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}

                        <div className="flex justify-end mb-4 gap-3 text-xs text-slate-500">
                            <Link href="/auth/find-id" className="hover:text-blue-600 hover:underline">
                                아이디 찾기
                            </Link>
                            <span className="text-slate-300">|</span>
                            <Link href="/auth/find-password" className="hover:text-blue-600 hover:underline">
                                비밀번호 찾기
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg rounded-xl"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인"}
                        </Button>
                    </form>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">또는</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => handleSocialLogin("kakao")}
                            type="button"
                            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-slate-900 font-bold py-6 text-lg rounded-xl flex items-center justify-center gap-3 border-none"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3C6.48 3 2 6.48 2 10.77c0 2.8 1.94 5.23 4.88 6.66-.2 0.76-.74 2.76-.85 3.16-.04.14.06.2.18.12.98-.67 4.14-2.81 4.31-2.93.48.07.98.1 1.48.1 5.52 0 10-3.48 10-7.77S17.52 3 12 3z" />
                            </svg>
                            카카오로 시작하기
                        </Button>

                        <Button
                            onClick={() => handleSocialLogin("google")}
                            type="button"
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-6 text-lg rounded-xl flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            구글로 시작하기
                        </Button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            아직 계정이 없으신가요?{" "}
                            <Link href="/signup" className="text-blue-600 font-bold hover:underline">
                                회원가입
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
