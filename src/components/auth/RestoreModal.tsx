"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCcw, LogOut } from "lucide-react";

interface RestoreModalProps {
    isOpen: boolean;
    deletedAt: string;
    onRestore: () => void;
    onLogout: () => void;
    isRestoring: boolean;
}

export function RestoreModal({ isOpen, deletedAt, onRestore, onLogout, isRestoring }: RestoreModalProps) {
    const deletedDate = new Date(deletedAt);
    const deadline = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 z-[110] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-2xl text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <RefreshCcw className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">계정 복구 가능</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                현재 <span className="text-red-500 font-bold">탈퇴 처리된 계정</span>입니다.<br />
                                30일 이내 로그인 시 복구가 가능합니다.<br />
                                <span className="text-sm text-slate-400 mt-2 block">(복구 가능 기간: {daysLeft}일 남음)</span>
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={onRestore}
                                    disabled={isRestoring}
                                    className="w-full h-14 rounded-xl text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                                >
                                    {isRestoring ? "복구 중..." : "계정 복구하고 다시 시작하기"}
                                </Button>
                                <Button
                                    onClick={onLogout}
                                    variant="ghost"
                                    className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 font-medium"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    취소하고 로그아웃
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
