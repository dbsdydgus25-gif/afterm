"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decryptPassword } from "@/lib/crypto";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Lock, Eye, EyeOff, Copy, Check } from "lucide-react";

export default function VaultAuthPage() {
    const router = useRouter();
    const params = useParams();
    const vaultId = params.id as string;

    const [pin, setPin] = useState("");
    const [pinHint, setPinHint] = useState("");
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [vaultData, setVaultData] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        loadPinHint();
    }, [vaultId]);

    const loadPinHint = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('vault_items')
                .select('pin_hint')
                .eq('id', vaultId)
                .single();

            if (data?.pin_hint) {
                setPinHint(data.pin_hint);
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
            const supabase = createClient();

            // Get vault data with pin_hash
            const { data: vault, error } = await supabase
                .from('vault_items')
                .select('*')
                .eq('id', vaultId)
                .single();

            if (error || !vault) {
                alert("디지털 유산을 찾을 수 없습니다.");
                return;
            }

            // Verify PIN
            const bcrypt = require('bcryptjs');
            const isValid = await bcrypt.compare(pin, vault.pin_hash);

            if (!isValid) {
                alert("PIN이 일치하지 않습니다. 다시 시도해주세요.");
                setPin("");
                return;
            }

            // Decrypt password
            const decryptedPassword = decryptPassword(vault.password_encrypted, pin);

            setVaultData({
                ...vault,
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

    if (verified && vaultData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />

                <main className="flex-1 p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                                <Lock className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                                디지털 유산 정보
                            </h1>
                            <p className="text-slate-600">
                                고인이 남긴 계정 정보입니다
                            </p>
                        </div>

                        {/* Account Info */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    플랫폼
                                </label>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="font-medium">{vaultData.platform_name}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    아이디/이메일
                                </label>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="font-mono text-sm">{vaultData.account_id}</span>
                                    <button
                                        onClick={() => handleCopy(vaultData.account_id, 'id')}
                                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        {copiedField === 'id' ? (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-slate-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    비밀번호
                                </label>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="font-mono text-sm">
                                        {showPassword ? vaultData.password_decrypted : '••••••••'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4 text-slate-600" />
                                            ) : (
                                                <Eye className="w-4 h-4 text-slate-600" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleCopy(vaultData.password_decrypted, 'password')}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            {copiedField === 'password' ? (
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-slate-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    요청사항
                                </label>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm">
                                        {vaultData.request_type === 'cancel' && '계정 해지'}
                                        {vaultData.request_type === 'withdraw' && '회원 탈퇴'}
                                        {vaultData.request_type === 'backup_delete' && '백업 후 삭제'}
                                    </span>
                                </div>
                            </div>

                            {vaultData.notes && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        추가 메모
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{vaultData.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
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
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
                            <Lock className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            PIN 입력
                        </h1>
                        <p className="text-slate-600 leading-relaxed">
                            디지털 유산을 확인하려면<br />
                            PIN을 입력해주세요
                        </p>
                    </div>

                    {/* PIN Hint */}
                    {pinHint && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                            <div className="text-center">
                                <p className="text-sm font-medium text-blue-900 mb-1">
                                    💡 PIN 힌트
                                </p>
                                <p className="text-blue-800 font-medium">
                                    {pinHint}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* PIN Input */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="PIN 입력"
                            className="w-full h-14 px-4 text-center text-2xl tracking-widest border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleVerifyPin();
                                }
                            }}
                        />
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={handleVerifyPin}
                        disabled={loading || pin.length < 4}
                        className={`w-full h-14 font-bold text-lg rounded-xl transition-all ${loading || pin.length < 4
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                            }`}
                    >
                        {loading ? '확인 중...' : '확인'}
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
