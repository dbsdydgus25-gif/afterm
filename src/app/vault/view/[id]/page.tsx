"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Lock, AlertTriangle } from "lucide-react";

export default function VaultViewPage() {
    const router = useRouter();
    const params = useParams();
    const vaultId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [vaultExists, setVaultExists] = useState(false);

    useEffect(() => {
        checkVaultExists();
    }, [vaultId]);

    const checkVaultExists = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('vault_items')
                .select('id')
                .eq('id', vaultId)
                .single();

            if (data && !error) {
                setVaultExists(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        router.push(`/vault/view/${vaultId}/auth`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500">로딩 중...</div>
            </div>
        );
    }

    if (!vaultExists) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            디지털 유산을 찾을 수 없습니다
                        </h1>
                        <p className="text-slate-600">
                            유효하지 않은 링크입니다.
                        </p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full space-y-6">
                    {/* Icon */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
                            <Lock className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            디지털 유산
                        </h1>
                        <p className="text-slate-600 leading-relaxed">
                            소중한 분이 남긴 디지털 유산입니다.<br />
                            확인하시려면 아래 버튼을 눌러주세요.
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-amber-900 mb-1">
                                    주의사항
                                </h3>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    이 정보는 고인이 생전에 남긴 소중한 유산입니다.
                                    계정 정보를 확인하신 후, 고인의 뜻에 따라
                                    계정을 정리해주시기 바랍니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                        디지털 유산 확인하기
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
