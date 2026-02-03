"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VAULT_CATEGORIES, VAULT_REQUEST_TYPES } from "@/lib/vault-constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Lock, Trash2, Plus } from "lucide-react";

interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    account_id: string;
    request_type: string;
    notes: string;
    created_at: string;
}

export default function VaultListPage() {
    const router = useRouter();
    const [items, setItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);

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

            // Reload list
            loadVaultItems();
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
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
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                디지털 유산 관리
                            </h1>
                            <p className="text-slate-500">
                                총 {items.length}개의 계정 정보가 안전하게 보관되어 있습니다
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push("/vault/create")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            새로 등록
                        </Button>
                    </div>

                    {/* Empty State */}
                    {items.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <Lock className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                등록된 디지털 유산이 없습니다
                            </h3>
                            <p className="text-slate-500 mb-6">
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
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {item.platform_name}
                                                </h3>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 w-20">아이디:</span>
                                                    <span className="text-slate-900 font-medium">{item.account_id}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 w-20">비밀번호:</span>
                                                    <span className="text-slate-400 font-mono">••••••••</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 w-20">요청사항:</span>
                                                    <span className="text-slate-900">{getRequestTypeLabel(item.request_type)}</span>
                                                </div>
                                                {item.notes && (
                                                    <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-100">
                                                        <span className="text-slate-500 w-20">메모:</span>
                                                        <span className="text-slate-600 flex-1">{item.notes}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 text-xs text-slate-400">
                                                등록일: {new Date(item.created_at).toLocaleDateString('ko-KR')}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
