"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";

interface ProfileDropdownProps {
    user: {
        name: string;
        email: string;
    };
    plan: string;
    onLogout: () => void;
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

export function ProfileDropdown({ user, plan, onLogout, onNavigate }: ProfileDropdownProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.name?.[0] || "U"}
                </div>
                <span className="text-sm font-bold text-slate-700 hidden sm:block">
                    {user?.name || "사용자"}
                </span>
                {plan === 'pro' && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                        PRO
                    </span>
                )}
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                    >
                        <div className="p-3 border-b border-slate-50">
                            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                            <button
                                onClick={() => { setIsMenuOpen(false); onNavigate("/dashboard"); }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                            >
                                <User className="w-4 h-4" /> 내 정보
                            </button>
                            <button
                                onClick={() => { setIsMenuOpen(false); onNavigate("/settings"); }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" /> 설정
                            </button>
                        </div>
                        <div className="p-1 border-t border-slate-50">
                            <button
                                onClick={() => { setIsMenuOpen(false); onLogout(); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> 로그아웃
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
