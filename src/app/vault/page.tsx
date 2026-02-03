"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VAULT_CATEGORIES, VAULT_REQUEST_TYPES } from "@/lib/vault-constants";
import { Button } from "@/components/ui/button";
import { Lock, Trash2, Plus, User, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryStore } from "@/store/useMemoryStore";

interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    account_id: string;
    request_type: string;
    notes: string;
    recipient_name: string;
    created_at: string;
}

export default function VaultListPage() {
    const router = useRouter();
    const { user, setUser, plan } = useMemoryStore();
    const [items, setItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        loadVaultItems();
    }, []);

    const loadVaultItems = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("vault_items")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Load error:", error);
                return;
            }

            setItems(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("vault_items")
                .delete()
                .eq("id", id);

            if (error) {
                console.error("Delete error:", error);
                alert("삭제 중 오류가 발생했습니다.");
                return;
            }

            loadVaultItems();
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    const getCategoryLabel = (category: string) => {
        return VAULT_CATEGORIES[category as keyof typeof VAULT_CATEGORIES] || category;
    };

    const getRequestTypeLabel = (type: string) => {
        return VAULT_REQUEST_TYPES[type as keyof typeof VAULT_REQUEST_TYPES] || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50">
                <Link href="/" className="text-xl font-black text-blue-600 tracking-tighter">AFTERM</Link>
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-slate-200"
                    >
                        {user?.image || user?.user_metadata?.avatar_url ? (
                            <SecureAvatar
                                src={user?.image || user?.user_metadata?.avatar_url}
                                alt="Profile"
                                className="w-8 h-8 rounded-full shadow-sm"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-500" />
                            </div>
                        )}
                        <span className="hidden md:block text-sm font-medium text-slate-700">{user?.name || '사용자'}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-slate-50">
                                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <div className="p-1">
                                    <Link
                                        href="/settings"
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" /> 내 정보
                                    </Link>
                                    <Link
                                        href="/plans"
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> 플랜 관리
                                        {plan === 'pro' && <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold">PRO</span>}
                                    </Link>
                                </div>
                                <div className="p-1 border-t border-slate-50">
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center gap-2 transition-colors">
                                        <LogOut className="w-4 h-4" /> 로그아웃
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Dashboard Tabs */}
            <DashboardTabs />

            <main className="max-w-3xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            내 디지털 유산
                        </h1>
                        <p className="text-sm md:text-base text-slate-500">
                            총 {items.length}개의 계정이 안전하게 보관되어 있습니다
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/vault/create")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm md:text-base"
                    >
                        <Plus className="w-4 h-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">새로 등록</span>
                        <span className="sm:hidden">등록</span>
                    </Button>
                </div>

                {/* Empty State */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                            <Lock className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            등록된 디지털 유산이 없습니다
                        </h3>
                        <p className="text-slate-500 mb-6 text-sm">
                            계정 정보를 안전하게 보관하고 사후에 전달하세요
                        </p>
                        <Button
                            onClick={() => router.push("/vault/create")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            첫 번째 유산 등록하기
                        </Button>
                    </div>
                ) : (
                    /* Items List */
                    <div className="space-y-3 md:space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-4 md:p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
                                            <span className="inline-block px-2 md:px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                                {getCategoryLabel(item.category)}
                                            </span>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900 truncate">
                                                {item.platform_name}
                                            </h3>
                                        </div>

                                        <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 w-16 md:w-20 flex-shrink-0">아이디:</span>
                                                <span className="text-slate-900 font-medium truncate">{item.account_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 w-16 md:w-20 flex-shrink-0">비밀번호:</span>
                                                <span className="text-slate-400 font-mono">••••••••</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 w-16 md:w-20 flex-shrink-0">수신인:</span>
                                                <span className="text-slate-900 truncate">{item.recipient_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 w-16 md:w-20 flex-shrink-0">요청:</span>
                                                <span className="text-slate-900">{getRequestTypeLabel(item.request_type)}</span>
                                            </div>
                                            {item.notes && (
                                                <div className="flex items-start gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-100">
                                                    <span className="text-slate-500 w-16 md:w-20 flex-shrink-0">메모:</span>
                                                    <span className="text-slate-600 flex-1 line-clamp-2">{item.notes}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 md:mt-4 text-xs text-slate-400">
                                            등록일: {new Date(item.created_at).toLocaleDateString('ko-KR')}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
