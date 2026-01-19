"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react"; // Added useState import

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false); // Added isLoading state

    const handleLogin = () => { // Renamed handleCallback to handleLogin
        setIsLoading(true);
        // Simulate successful login
        setTimeout(() => {
            setIsLoading(false);
            onClose(); // Close modal
            router.push("/create"); // Redirect to Create/Edit page first, not recipient
        }, 1500);
    };

    const handleGoogleLogin = () => { // Added handleGoogleLogin
        setIsLoading(true);
        // Simulate Google login
        setTimeout(() => {
            setIsLoading(false);
            onClose();
            router.push("/create"); // Redirect to Create/Edit page
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-background p-8 shadow-2xl ring-1 ring-black/5">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex flex-col items-center space-y-6 text-center">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        {isLoading ? "잠시만 기다려주세요..." : "시작하기"}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        나의 가장 소중한 이야기를 남겨보세요.
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder="이메일"
                                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        <input
                                            type="password"
                                            placeholder="비밀번호"
                                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleLogin} className="flex-1 rounded-xl h-12 text-base font-bold">
                                            로그인
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl h-12 text-base font-bold bg-slate-50 text-slate-600 border-slate-200">
                                            회원가입
                                        </Button>
                                    </div>

                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-slate-200" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">
                                                또는
                                            </span>
                                        </div>
                                    </div>

                                    <Button variant="outline" onClick={handleGoogleLogin} className="w-full rounded-xl h-12 text-base font-medium relative overflow-hidden group border-slate-300">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                        </span>
                                        Google로 시작하기
                                    </Button>
                                    <p className="text-xs text-slate-400 mt-2">
                                        구글 로그인 시 간편하게 연동됩니다. (닉네임 설정 필요)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
