"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMemoryStore } from "@/store/useMemoryStore";

export default function VerifyPasswordPage() {
    const supabase = createClient();
    const router = useRouter();
    const { user } = useMemoryStore();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!user || !user.email) {
            setError("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            setLoading(false);
            return;
        }

        try {
            // Re-authenticate with password
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password,
            });

            if (error) {
                setError("비밀번호가 올바르지 않습니다.");
            } else {
                // Success
                sessionStorage.setItem('auth_verified', 'true');

                // Check if there was a redirected page we were trying to get to? 
                // Since this page intercepts a flow, we might need a stored redirect, 
                // but for now, we will default to dashboard or home.
                // However, the user said "If writing message -> login -> back to writing".
                // If this is part of that flow, we should check returnTo in URL if present.
                const params = new URLSearchParams(window.location.search);
                const returnTo = params.get("returnTo") || "/dashboard";
                // Default to dashboard for post-verification unless specified, 
                // but user asked for Home generally.
                // Let's assume if this challenge happens, it's mostly on login.
                // If it happens mid-flow, we'd need returnTo passed here too.

                router.replace(returnTo);
            }
        } catch (err) {
            setError("인증 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">보안 확인</h1>
                    <p className="text-slate-500">
                        회원님의 안전한 정보 보호를 위해<br />
                        비밀번호를 한 번 더 입력해주세요.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "확인"}
                    </Button>

                    <button
                        type="button"
                        onClick={() => {
                            supabase.auth.signOut().then(() => router.replace("/login"));
                        }}
                        className="w-full text-slate-400 text-sm hover:text-slate-600 mt-4"
                    >
                        다른 계정으로 로그인 (로그아웃)
                    </button>
                </form>
            </div>
        </div>
    );
}
