"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePin } from "@/lib/crypto";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import bcrypt from "bcryptjs";

export default function SetupPinPage() {
    const router = useRouter();
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate PIN format
        const validation = validatePin(pin);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        // Check if PINs match
        if (pin !== confirmPin) {
            alert("PIN이 일치하지 않습니다.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("로그인이 필요합니다.");
                router.push("/login");
                return;
            }

            // Hash PIN with bcrypt
            const pinHash = await bcrypt.hash(pin, 10);

            // Save to database
            const { error } = await supabase
                .from("vault_pins")
                .insert({
                    user_id: user.id,
                    pin_hash: pinHash
                });

            if (error) {
                console.error("PIN setup error:", error);
                alert("PIN 설정 중 오류가 발생했습니다.");
                return;
            }

            alert("PIN이 설정되었습니다!");
            router.push("/vault/create");

        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                <span className="text-3xl">🔐</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                            PIN 설정
                        </h1>
                        <p className="text-sm text-slate-500 text-center mb-8">
                            디지털 유산을 안전하게 보호하기 위해<br />
                            4-6자리 숫자 PIN을 설정해주세요
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    PIN 입력
                                </label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="4-6자리 숫자"
                                    className="text-center text-2xl tracking-widest"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    PIN 확인
                                </label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="PIN 재입력"
                                    className="text-center text-2xl tracking-widest"
                                    required
                                />
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    ⚠️ PIN을 분실하면 저장된 비밀번호를 복구할 수 없습니다.
                                    안전한 곳에 별도로 기록해두세요.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !pin || !confirmPin}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                            >
                                {loading ? "설정 중..." : "PIN 설정 완료"}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
