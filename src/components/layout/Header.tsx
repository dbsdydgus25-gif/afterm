"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { useMemoryStore } from "@/store/useMemoryStore";


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
                                <Link href="/login">
                                    <Button
                                        className="rounded-lg px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all font-bold text-sm tracking-tight flex items-center justify-center hover:scale-[1.02]"
                                    >
                                        로그인
                                    </Button>
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
                                    <Link href="/login" className="pt-2">
                                        <Button className="w-full text-lg h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white">
                                            로그인
                                        </Button>
                                    </Link>
                                )}

                                {user && (
                                    <div className="pt-2 flex flex-col gap-3">
                                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                                            {user.user_metadata?.avatar_url || user.image ? (
                                                <img src={user.user_metadata?.avatar_url || user.image} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {user.name?.[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleLogout}
                                            variant="outline"
                                            className="w-full h-12 text-slate-600 border-slate-200"
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
