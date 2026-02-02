"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Building, User } from "lucide-react";
import { useMemoryStore } from "@/store/useMemoryStore";
import { SecureAvatar } from "@/components/ui/SecureAvatar";

export function BottomNav() {
    const pathname = usePathname();
    const { user } = useMemoryStore();

    const tabs = [
        { name: "홈", href: "/", icon: Home },
        { name: "커뮤니티", href: "/community", icon: Users, disabled: true },
        { name: "기억공간", href: "/memorial", icon: Building, disabled: true },
        { name: "내정보", href: "/dashboard", icon: User, useAvatar: true },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="max-w-[430px] mx-auto flex justify-around items-center h-16 px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    if (tab.disabled) {
                        return (
                            <div key={tab.name} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-300">
                                <Icon className="w-6 h-6" />
                                <span className="text-[10px] font-medium">준비중</span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.useAvatar && user ? (
                                <SecureAvatar
                                    src={user.user_metadata?.avatar_url}
                                    alt={user.user_metadata?.nickname || user.name || "User"}
                                    className="w-6 h-6 rounded-full"
                                />
                            ) : (
                                <Icon className="w-6 h-6" />
                            )}
                            <span className="text-[10px] font-medium">{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
