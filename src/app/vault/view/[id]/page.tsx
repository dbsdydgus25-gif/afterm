"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyVaultOwner } from "@/app/actions/notifyVaultOwner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function VaultViewPage() {
    const router = useRouter();
    const params = useParams();
    const vaultId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [vaultExists, setVaultExists] = useState(false);
    const [senderName, setSenderName] = useState("");

    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        checkVaultExists();
    }, [vaultId]);

    const checkVaultExists = async () => {
        try {
            const res = await fetch(`/api/vault/${vaultId}`);

            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    setVaultExists(true);
                    // Fetch sender name if possible, or use generic
                    // The API returns 'vault' object inside data?
                    // Let's check api/vault/[id] logic. Usually it returns minimal info.
                    // If we want sender name, we might need it.
                    // Assuming API returns enough info or we can fetch profile.
                    // Let's assume generic for now or updated API.
                    // Actually, let's look at the previous file content: "const data = await res.json();"
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!vaultExists) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
                <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">접근 불가</h1>
                        <p className="text-zinc-500 text-sm">
                            유효하지 않은 링크이거나 삭제된 디지털 유산입니다.
                        </p>
                    </div>
                    <Link href="/" className="block">
                        <Button className="w-full rounded-xl h-12">홈으로 돌아가기</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />

            <div className="w-full max-w-[400px] z-10 animate-fade-in-up">

                {/* Brand / Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ring-white dark:ring-zinc-900 hover:opacity-90 transition-opacity active:scale-95 duration-200">
                        <Image
                            src="/logo.jpg"
                            alt="AFTERM Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                    </Link>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl p-8 space-y-8 ring-1 ring-black/5 dark:ring-white/10">

                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-bold leading-snug text-zinc-900 dark:text-zinc-100">
                            당신에게 남겨진<br />
                            <span className="text-blue-600 dark:text-blue-400">디지털 유산</span>이 있습니다
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            이 정보는 작성자가 <strong className="text-amber-600 dark:text-amber-400">문제가 있을 시에만</strong><br />
                            열람할 수 있도록 설정되어 있습니다
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setShowWarningModal(true)}
                            className="w-full h-14 text-lg font-bold rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200"
                        >
                            디지털 유산 확인하기
                        </button>
                    </div>

                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        떠난 후에도 당신이 기억 되도록. 에프텀
                    </p>
                    <div className="text-[10px] text-zinc-300/50 font-mono">
                        Ref: {vaultId?.slice(0, 8)}...
                    </div>
                </div>
            </div>

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                잠시만요!
                            </h3>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 leading-relaxed break-keep">
                                <p className="font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    이 정보는 작성자의 부재 시에만<br />열람해야 하는 소중한 유산입니다.
                                </p>
                                <p>
                                    확인을 누르시면 <strong className="text-zinc-900 dark:text-zinc-100">작성자에게 열람 알림 메일이 발송됩니다.</strong>
                                </p>
                                <p className="text-xs text-zinc-500">
                                    계속 진행하시겠습니까?
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowWarningModal(false)}
                                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800"
                            >
                                취소
                            </Button>
                            <Button
                                disabled={isProcessing}
                                onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                        // 메일 발송
                                        await notifyVaultOwner(vaultId);
                                        // 인증 페이지로 이동
                                        router.push(`/vault/view/${vaultId}/auth`);
                                    } catch (e) {
                                        console.error(e);
                                        setIsProcessing(false);
                                        alert("처리 중 오류가 발생했습니다.");
                                    }
                                }}
                                className="h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        처리 중...
                                    </>
                                ) : (
                                    "확인 (알림 발송)"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
