"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenLine, Vault, Bot, Search } from "lucide-react";
import { motion } from "framer-motion";

/**
 * 모바일 앱스타일 하단 네비게이션 바
 * - iOS/Android 네이티브 앱의 탭바 형태
 * - 활성 탭에 강조 인디케이터 + 애니메이션
 * - Safe Area (홈버튼 영역) 대응
 */
export function BottomNav() {
    const pathname = usePathname();

    // 글로벌 네비게이션 아이템
    const globalNavItems = [
        { href: "/", icon: Home, label: "홈" },
        { href: "/create", icon: PenLine, label: "메시지" },
        { href: "/vault/create", icon: Vault, label: "유산보관" },
        { href: "/ai-chat", icon: Bot, label: "AI채팅" },
        { href: "/guardians/open", icon: Search, label: "유산찾기" },
    ];

    // 스페이스 섹션에서는 별도 네비 불필요 (스페이스 내부 nav 별도 존재)
    // 하지만 일단 글로벌 nav 유지
    const navItems = globalNavItems;

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{
                // iOS Safari safe area 대응
                paddingBottom: "env(safe-area-inset-bottom)",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.04)",
            }}
        >
            <div className="flex items-stretch h-[60px]">
                {navItems.map((item) => {
                    // 활성 상태 판별
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 gap-0.5 relative py-2 transition-opacity active:opacity-70"
                        >
                            {/* 활성 인디케이터 (상단 바) */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-8 bg-blue-600 rounded-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                />
                            )}

                            {/* 활성 시 배경 원 */}
                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute inset-x-2 inset-y-1 rounded-xl bg-blue-50"
                                />
                            )}

                            {/* 아이콘 */}
                            <div className="relative z-10">
                                <Icon
                                    className={`w-[22px] h-[22px] transition-colors ${isActive ? "text-blue-600" : "text-slate-400"}`}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                            </div>

                            {/* 레이블 */}
                            <span
                                className={`relative z-10 text-[10px] font-semibold tracking-tight leading-none transition-colors ${isActive ? "text-blue-600" : "text-slate-400"}`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
