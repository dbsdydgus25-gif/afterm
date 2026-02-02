"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
    transparentOnTop?: boolean;
}

export function Header({ transparentOnTop = false }: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isTransparent = transparentOnTop && !isScrolled;

    return (
        <header
            className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${isTransparent
                ? "bg-transparent border-transparent"
                : "bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-sm"
                }`}
        >
            <div className="max-w-[430px] mx-auto flex h-14 items-center justify-between px-4">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                    <span className="text-xl font-black tracking-tighter text-blue-600">
                        AFTERM
                    </span>
                </Link>
            </div>
        </header>
    );
}
