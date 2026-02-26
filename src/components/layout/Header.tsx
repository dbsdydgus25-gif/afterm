"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { useMemoryStore } from "@/store/useMemoryStore";

import { createClient } from "@/lib/supabase/client";

import { Menu, X, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
    transparentOnTop?: boolean;
}

const serviceSubLinks = [
    { name: "메시지 남기기", href: "/create" },
    { name: "디지털 유산", href: "/vault/create" },
    { name: "디지털 추모관", href: "/space" },
    { name: "AI 채팅", href: "/ai-chat" },
];

const centerNavLinks = [
    { name: "주요 서비스", href: "#", hasDropdown: true },
    { name: "주간 트렌드", href: "/newsletter", hasDropdown: false },
    { name: "회사소개", href: "/about", hasDropdown: false },
    { name: "문의하기", href: "/contact", hasDropdown: false },
];

export function Header({ transparentOnTop = false }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, setUser, plan } = useMemoryStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileServiceOpen, setIsMobileServiceOpen] = useState(false);
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const serviceDropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
            router.push("/");
        } catch (error) {
            console.error("Logout failed", error);
            window.location.href = "/";
        }
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Close service dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
                setIsServiceDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isTransparent = transparentOnTop && !isScrolled && !isMobileMenuOpen;

    return (
        <>
            <header
                className={`fixed top-0 z-[60] w-full transition-all duration-300 border-b ${isTransparent
                    ? "bg-transparent border-transparent"
                    : "bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-sm"
                    }`}
            >
                <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
                        <span className="text-xl font-black tracking-tighter text-blue-600">
                            AFTERM
                        </span>
                    </Link>

                    {/* Center: Nav Links (Desktop Only) */}
                    <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                        {/* 주요 서비스 with dropdown */}
                        <div className="relative" ref={serviceDropdownRef}>
                            <button
                                onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isServiceDropdownOpen ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"}`}
                            >
                                주요 서비스
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isServiceDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {isServiceDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                                    >
                                        {serviceSubLinks.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsServiceDropdownOpen(false)}
                                                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-600 ${pathname === item.href ? "text-blue-600 bg-blue-50" : "text-slate-700"}`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {centerNavLinks.filter(l => !l.hasDropdown).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === link.href
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Right: Dashboard Button + Profile */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Desktop Only */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                내 대시보드
                            </Link>

                            {user ? (
                                <ProfileDropdown
                                    user={{
                                        name: user.name,
                                        email: user.email,
                                        image: user.user_metadata?.avatar_url || user.image,
                                        user_metadata: user.user_metadata
                                    }}
                                    plan={plan}
                                    onLogout={handleLogout}
                                    onNavigate={(path) => router.push(path)}
                                />
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                                >
                                    로그인
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Hamburger Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
                        >
                            <div className="px-5 py-6 space-y-1 flex flex-col">
                                {/* 주요 서비스 accordion */}
                                <button
                                    onClick={() => setIsMobileServiceOpen(!isMobileServiceOpen)}
                                    className="flex items-center justify-between w-full text-left px-3 py-3 text-base font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <span>주요 서비스</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isMobileServiceOpen ? "rotate-180" : ""}`} />
                                </button>

                                <AnimatePresence>
                                    {isMobileServiceOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pl-4 border-l-2 border-blue-100 ml-3"
                                        >
                                            {serviceSubLinks.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="block px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {centerNavLinks.filter(l => !l.hasDropdown).map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`px-3 py-3 text-base font-semibold rounded-lg transition-colors ${pathname === link.href ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"}`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="h-px bg-slate-100 my-2" />

                                {/* Dashboard */}
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-3 py-3 text-base font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    내 대시보드
                                </Link>

                                {user ? (
                                    <>
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="px-3 py-3 text-base font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            마이페이지
                                        </Link>
                                        <Button
                                            onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                            variant="ghost"
                                            className="justify-start px-3 h-12 text-base font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            로그아웃
                                        </Button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="mt-2 w-full flex items-center justify-center rounded-xl text-base h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                    >
                                        로그인
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}
