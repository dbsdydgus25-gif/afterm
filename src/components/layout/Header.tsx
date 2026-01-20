"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { useMemoryStore } from "@/store/useMemoryStore";

interface HeaderProps {
    transparentOnTop?: boolean;
}

export function Header({ transparentOnTop = false }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, setUser, plan } = useMemoryStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const { createClient } = require("@/lib/supabase/client");

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

    const isTransparent = transparentOnTop && !isScrolled;

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
                            {[
                                { name: "회사소개", href: "/about" },
                                { name: "공지사항", href: "/notice" },
                                { name: "월간 트렌드", href: "/newsletter" },
                                { name: "추모관", href: "/memorial" },
                            ].map((link) => (
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

                    <nav className="flex items-center gap-4 sm:gap-6">
                        <Link
                            href="/contact"
                            className="hidden sm:block text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            문의하기
                        </Link>

                        {!user ? (
                            <Link href="/login">
                                <Button
                                    className="rounded-lg px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all font-bold text-sm tracking-tight flex items-center justify-center hover:scale-[1.02]"
                                >
                                    로그인
                                </Button>
                            </Link>
                        ) : (
                            <ProfileDropdown
                                user={user}
                                plan={plan}
                                onLogout={handleLogout}
                                onDeleteAccount={() => {
                                    if (confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
                                        setUser(null);
                                        router.push("/");
                                    }
                                }}
                                onNavigate={(path) => router.push(path)}
                            />
                        )}
                    </nav>
                </div>
            </header>
        </>
    );
}
