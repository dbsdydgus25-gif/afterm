"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, Vault } from "lucide-react";

export function DashboardTabs() {
    const pathname = usePathname();
    const router = useRouter();

    const isVault = pathname.startsWith('/vault');

    const tabs = [
        { id: 'messages', label: '나의 기억 보관함', icon: Inbox, href: '/dashboard', color: 'blue' },
        { id: 'vault', label: '내 디지털 유산', icon: Vault, href: '/vault', color: 'emerald' }
    ];

    return (
        <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex gap-1 md:gap-2">
                    {tabs.map((tab) => {
                        const isActive = tab.id === 'vault' ? isVault : !isVault;
                        const Icon = tab.icon;
                        const activeColor = tab.color === 'emerald'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-blue-500 text-blue-600';

                        return (
                            <button
                                key={tab.id}
                                onClick={() => router.push(tab.href)}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 transition-colors text-sm md:text-base font-medium ${isActive
                                        ? activeColor
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.id === 'vault' ? '디지털유산' : '기억보관함'}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
