"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { useMemoryStore } from "@/store/useMemoryStore";
import { SecureAvatar } from "@/components/ui/SecureAvatar";


import { createClient } from "@/lib/supabase/client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
    transparentOnTop?: boolean;
}

export function Header({ transparentOnTop = false }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, setUser, plan } = useMemoryStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileStatsOpen, setIsProfileStatsOpen] = useState(false);
    const [messageCount, setMessageCount] = useState(0);

    // Fetch message count for stats
    useEffect(() => {
        const fetchStats = async () => {
            if (isMobileMenuOpen && user) {
                const supabase = createClient();
                const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true });
                if (count !== null) setMessageCount(count);
            }
        };
        fetchStats();
    }, [isMobileMenuOpen, user]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const isTransparent = transparentOnTop && !isScrolled && !isMobileMenuOpen;

    const navLinks = [
        { name: "회사소개", href: "/about" },
        { name: "공지사항", href: "/notice" },
        { name: "월간 트렌드", href: "/newsletter" },
        { name: "추모관", href: "/memorial" },
    ];

    return (
        <>
            <header
                className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${isTransparent
                    ? "bg-transparent border-transparent"
                    : "bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-sm"
                    }`}
            >
                <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
                    {/* Left Side: Logo + Nav Links */}
                    <div className="flex items-center gap-8 md:gap-12">
                        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <span className="text-xl md:text-2xl font-black tracking-tighter text-blue-600">
                                AFTERM
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors ${pathname === link.href
                                        ? "text-blue-600 font-bold"
                                        : "text-slate-500 hover:text-blue-600"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex items-center gap-4 sm:gap-6">
                            <Link
                                href="/contact"
                                className="hidden sm:block text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                            >
                                문의하기
                            </Link>

                            {user ? (
                                <ProfileDropdown
                                    user={{
                                        name: user.name,
                                        email: user.email,
                                        image: user.user_metadata?.avatar_url || user.image
                                    }}
                                    plan={plan}
                                    onLogout={handleLogout}
                                    onNavigate={(path) => router.push(path)}
                                />
                            ) : (
                                <Link
                                    href="/login"
                                    className="rounded-lg px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all font-bold text-sm tracking-tight flex items-center justify-center hover:scale-[1.02]"
                                >
                                    로그인
                                </Link>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
                        >
                            <div className="px-6 py-6 space-y-6 flex flex-col">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`text-lg font-medium transition-colors ${pathname === link.href
                                            ? "text-blue-600 font-bold"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="h-px bg-slate-100 my-2" />

                                <Link
                                    href="/contact"
                                    className="text-lg font-medium text-slate-600"
                                >
                                    문의하기
                                </Link>

                                {!user && (
                                    <Link
                                        href="/login"
                                        className="pt-2 w-full flex items-center justify-center rounded-lg text-lg h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                    >
                                        로그인
                                    </Link>
                                )}

                                {user && (
                                    <div className="pt-2 flex flex-col gap-3">
                                        {/* Clickable Profile Card (Expands for Stats) */}
                                        <div
                                            onClick={() => setIsProfileStatsOpen(!isProfileStatsOpen)}
                                            className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${isProfileStatsOpen ? "bg-blue-50/50 ring-1 ring-blue-100" : "bg-slate-50 hover:bg-slate-100"
                                                }`}
                                        >
                                            {user.user_metadata?.avatar_url || user.image ? (
                                                <SecureAvatar
                                                    src={user.user_metadata?.avatar_url || user.image}
                                                    alt="Profile"
                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {user.name?.[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-lg">{user.name}</p>
                                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                                    </div>
                                                    <span className={`transform transition-transform ${isProfileStatsOpen ? "rotate-90" : ""}`}>
                                                        ›
                                                    </span>
                                                </div>

                                                {/* Expanded Stats Area */}
                                                <AnimatePresence>
                                                    {isProfileStatsOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-4 space-y-3 overflow-hidden"
                                                        >
                                                            <div className="h-px bg-blue-100/50 mb-3" />

                                                            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                                                                <div className="flex justify-between items-center text-sm mb-1">
                                                                    <span className="text-slate-500">남은 메시지</span>
                                                                    <span className="font-bold text-blue-600">
                                                                        {plan === 'pro' ? '무제한' : (1 - (messageCount || 0)) + '개'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-slate-500">남은 용량</span>
                                                                    <span className="font-bold text-slate-700">
                                                                        {plan === 'pro' ? '1GB' : '10MB'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push('/dashboard/memories');
                                                                    setIsMobileMenuOpen(false);
                                                                }}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-bold shadow-md shadow-blue-200"
                                                            >
                                                                💌 나의 기억 보관함
                                                            </Button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Settings Group */}
                                        <div className="space-y-1 pt-2">
                                            <p className="text-xs font-bold text-slate-400 px-1 mb-2">설정</p>
                                            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                                {[
                                                    { name: "내 정보", tab: "profile" },
                                                    { name: "계정 설정", tab: "security" },
                                                    { name: "멤버십", tab: "billing" }
                                                ].map((item, idx) => (
                                                    <div key={item.tab}>
                                                        <button
                                                            onClick={() => {
                                                                router.push(`/settings?tab=${item.tab}`);
                                                                setIsMobileMenuOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                                        >
                                                            {item.name}
                                                            <span className="text-slate-300">›</span>
                                                        </button>
                                                        {idx !== 2 && <div className="h-px bg-slate-50 mx-4" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            className="w-full h-12 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            로그아웃
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}
