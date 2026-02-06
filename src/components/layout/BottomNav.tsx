"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenLine, User, Users, Vault } from "lucide-react";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Home, label: "홈" },
        { href: "/create", icon: PenLine, label: "기억남기기" },
        { href: "/vault/create", icon: Vault, label: "디지털유산", color: "emerald" },
        { href: "/space", icon: Users, label: "기억공간" },
        { href: "/settings", icon: User, label: "내정보" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    const activeColor = item.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${isActive
                                ? activeColor
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
