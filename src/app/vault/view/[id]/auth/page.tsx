"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decryptPassword } from "@/lib/crypto";
// import { Header } from "@/components/layout/Header"; // Remove Header for immersive view
// import { Footer } from "@/components/layout/Footer"; // Remove Footer for immersive view
import { Lock, Eye, EyeOff, Copy, Check, ChevronLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VaultAuthPage() {
    const router = useRouter();
    const params = useParams();
    const vaultId = params.id as string;

    const [pin, setPin] = useState("");
    const [pinHint, setPinHint] = useState("");
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [vaultData, setVaultData] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        loadPinHint();
    }, [vaultId]);

    const loadPinHint = async () => {
        try {
            const res = await fetch(`/api/vault/${vaultId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.exists && data.hint) {
                    setPinHint(data.hint);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleVerifyPin = async () => {
        if (!pin || pin.length < 4) {
            alert("PIN을 입력해주세요.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/vault/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: vaultId, pin })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    alert("PIN이 일치하지 않습니다. 다시 시도해주세요.");
                    setPin("");
                } else {
                    alert(data.error || "오류가 발생했습니다.");
                }
                return;
            }

            const decryptedPassword = decryptPassword(data.vault.password_encrypted, pin);

            setVaultData({
                ...data.vault,
                password_decrypted: decryptedPassword
            });
            setVerified(true);

        } catch (error) {
            console.error(error);
            alert("PIN 검증 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            alert("복사에 실패했습니다.");
        }
    };

    // --- Verified View (Unlocked) ---
    if (verified && vaultData) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col p-6 font-sans">
                {/* Top Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-sm font-bold text-zinc-500">DIGITAL LEGACY</span>
                    <div className="w-8" />
                </div>

                <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center space-y-8 animate-fade-in-up">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4 ring-1 ring-blue-500/30">
                            <Lock className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            {vaultData.recipient_name}님을 위한<br />
                            디지털 유산 정보
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            확인 후 안전하게 보관하거나 처리해주세요.
                        </p>
                    </div>

                    <div className="bg-zinc-900 rounded-3xl p-6 space-y-6 border border-zinc-800 shadow-xl">
                        {/* Platform Name */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Platform</label>
                            <div className="text-lg font-bold text-white">{vaultData.platform_name}</div>
                        </div>

                        {/* ID */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">ID / Email</label>
                            <div className="flex items-center justify-between bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                <span className="font-mono text-zinc-200">{vaultData.account_id}</span>
                                <button
                                    onClick={() => handleCopy(vaultData.account_id, 'id')}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                >
                                    {copiedField === 'id' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Password</label>
                            <div className="flex items-center justify-between bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                <span className="font-mono text-zinc-200">
                                    {showPassword ? vaultData.password_decrypted : '••••••••'}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleCopy(vaultData.password_decrypted, 'password')}
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                    >
                                        {copiedField === 'password' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Request Type */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Request</label>
                            <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-lg border border-blue-500/30">
                                {vaultData.request_type === 'cancel' && '계정 해지'}
                                {vaultData.request_type === 'withdraw' && '회원 탈퇴'}
                                {vaultData.request_type === 'backup_delete' && '백업 후 삭제'}
                            </div>
                        </div>

                        {/* Note */}
                        {vaultData.notes && (
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Note</label>
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                    {vaultData.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-8">
                        <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                            © AFTERM Digital Legacy
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // --- PIN Entry View (Black Screen) ---
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle Gradient Spot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-sm w-full space-y-8 relative z-10 animate-fade-in text-center">

                <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                        <Lock className="w-5 h-5 text-zinc-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">보안 접근</h1>
                    <p className="text-zinc-500 text-sm">
                        디지털 유산을 확인하려면 설정된 PIN을 입력하세요.
                    </p>
                </div>

                {/* PIN Input Area */}
                <div className="space-y-6">
                    {/* Hint */}
                    {pinHint && (
                        <div className="flex flex-col items-center animate-pulse-slow">
                            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-800/50">
                                <Lightbulb className="w-3 h-3" />
                                <span>힌트: {pinHint}</span>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="PIN 6자리" // Placeholder text might be hidden by styling, keeping simple
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-5 text-center text-3xl tracking-[0.5em] font-mono text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none placeholder:text-zinc-800 placeholder:text-base placeholder:tracking-normal placeholder:font-sans"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleVerifyPin();
                                }
                            }}
                        />
                    </div>

                    <Button
                        onClick={handleVerifyPin}
                        disabled={loading || pin.length < 4}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all"
                    >
                        {loading ? "확인 중..." : "확인"}
                    </Button>
                </div>

                <div className="pt-8">
                    <button onClick={() => router.push('/')} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                        취소하고 홈으로
                    </button>
                </div>
            </div>
        </div>
    );
}
