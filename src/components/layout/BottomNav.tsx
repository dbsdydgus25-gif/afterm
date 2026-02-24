"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenLine, Users, Vault, Bot } from "lucide-react";

export function BottomNav() {
    const pathname = usePathname();

    // 1. Global Navigation (Main)
    const globalNavItems = [
        { href: "/", icon: Home, label: "홈" },
        { href: "/vault/create", icon: PenLine, label: "기억남기기" },
        { href: "/vault", icon: Vault, label: "디지털 유산" },
        { href: "/space", icon: Users, label: "디지털 추모관" },
        { href: "/ai-chat", icon: Bot, label: "AI 채팅" },
    ];

    // 2. Space Navigation (Only for Space Section)
    const spaceNavItems = [
        { href: "/", icon: Home, label: "홈" },
        { href: "/space/create", icon: PenLine, label: "만들기" },
    ];

    // Condition: Show Space Nav only when in "/space" related paths
    // BUT: If user explicitly said "Main" was wrong, we allow Space Nav in /space
    const isSpaceSection = pathname.startsWith("/space");

    const navItems = isSpaceSection ? spaceNavItems : globalNavItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    // Active state logic
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${isActive
                                ? "text-blue-600"
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
