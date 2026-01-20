"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function LoginPage() {
    const supabase = createClient();

    const handleLogin = async (provider: "google" | "kakao") => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">로그인</h1>
                    <p className="text-slate-500 mb-8">
                        SNS 계정으로 간편하게 시작하세요.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => handleLogin("kakao")}
                            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-slate-900 font-bold py-6 text-lg rounded-xl flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">💬</span> 카카오로 시작하기
                        </Button>

                        <Button
                            onClick={() => handleLogin("google")}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-6 text-lg rounded-xl flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">G</span> 구글로 시작하기
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
