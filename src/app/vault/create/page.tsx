"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { encryptPassword } from "@/lib/crypto";
import {
    VAULT_CATEGORIES,
    VAULT_REQUEST_TYPES,
    SUBSCRIPTION_PLATFORMS,
    SNS_PLATFORMS,
    isFinancialPlatform,
    VaultCategory,
    VaultRequestType
} from "@/lib/vault-constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lock, AlertTriangle } from "lucide-react";

export default function VaultCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [hasPin, setHasPin] = useState<boolean | null>(null);

    // Form states
    const [category, setCategory] = useState<VaultCategory>('subscription');
    const [platformName, setPlatformName] = useState('');
    const [customPlatform, setCustomPlatform] = useState('');
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [requestType, setRequestType] = useState<VaultRequestType>('cancel');
    const [notes, setNotes] = useState('');
    const [legalConsent, setLegalConsent] = useState(false);
    const [pin, setPin] = useState('');

    // Check if user has PIN set up
    useEffect(() => {
        checkPinStatus();
    }, []);

    const checkPinStatus = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data } = await supabase
                .from("vault_pins")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!data) {
                // No PIN set, redirect to setup
                router.push("/vault/setup-pin");
                return;
            }

            setHasPin(true);
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    const getPlatformOptions = () => {
        if (category === 'subscription') return SUBSCRIPTION_PLATFORMS;
        if (category === 'sns') return SNS_PLATFORMS;
        return [];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!legalConsent) {
            alert("법적 동의가 필요합니다.");
            return;
        }

        if (!pin) {
            alert("PIN을 입력해주세요.");
            return;
        }

        const finalPlatform = category === 'other' ? customPlatform : platformName;

        if (!finalPlatform) {
            alert("플랫폼을 선택하거나 입력해주세요.");
            return;
        }

        // Check for financial keywords
        if (isFinancialPlatform(finalPlatform)) {
            if (!confirm("금융 관련 정보는 권장하지 않습니다. 계속하시겠습니까?")) {
                return;
            }
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

            // Encrypt password with PIN
            const encryptedPassword = encryptPassword(password, pin);

            // Save to database
            const { error } = await supabase
                .from("vault_items")
                .insert({
                    user_id: user.id,
                    category,
                    platform_name: finalPlatform,
                    custom_platform: category === 'other' ? customPlatform : null,
                    account_id: accountId,
                    password_encrypted: encryptedPassword,
                    request_type: requestType,
                    notes,
                    legal_consent: legalConsent
                });

            if (error) {
                console.error("Vault creation error:", error);
                alert("저장 중 오류가 발생했습니다.");
                return;
            }

            alert("디지털 유산이 안전하게 저장되었습니다!");
            router.push("/vault");

        } catch (error: any) {
            console.error(error);
            if (error.message?.includes("Invalid PIN")) {
                alert("PIN이 올바르지 않습니다.");
            } else {
                alert("오류가 발생했습니다.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (hasPin === null) {
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
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                            <Lock className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            디지털 유산 등록
                        </h1>
                        <p className="text-slate-500">
                            계정 정보를 안전하게 암호화하여 보관합니다
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">

                        {/* Category Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                카테고리 선택
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.keys(VAULT_CATEGORIES) as VaultCategory[]).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            setCategory(cat);
                                            setPlatformName('');
                                            setCustomPlatform('');
                                        }}
                                        className={`p-3 rounded-xl border-2 font-medium transition-all ${category === cat
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        {VAULT_CATEGORIES[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Platform Selection */}
                        {category !== 'other' ? (
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-3">
                                    플랫폼 선택
                                </label>
                                <select
                                    value={platformName}
                                    onChange={(e) => setPlatformName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">선택해주세요</option>
                                    {getPlatformOptions().map((platform) => (
                                        <option key={platform} value={platform}>
                                            {platform}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-3">
                                    플랫폼 이름 (직접 입력)
                                </label>
                                <Input
                                    value={customPlatform}
                                    onChange={(e) => setCustomPlatform(e.target.value)}
                                    placeholder="예: 개인 블로그, 쇼핑몰 등"
                                    required
                                />
                            </div>
                        )}

                        {/* Account ID */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                아이디 / 이메일
                            </label>
                            <Input
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                placeholder="로그인 ID 또는 이메일"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                비밀번호
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="계정 비밀번호"
                                required
                            />
                        </div>

                        {/* Financial Warning */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 leading-relaxed">
                                <strong>중요:</strong> 은행, 증권, 카드 등 금융 관련 비밀번호는 입력하지 마세요.
                                법적 책임 문제가 발생할 수 있습니다.
                            </p>
                        </div>

                        {/* Request Type */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                요청 사항
                            </label>
                            <div className="space-y-2">
                                {(Object.keys(VAULT_REQUEST_TYPES) as VaultRequestType[]).map((type) => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="requestType"
                                            value={type}
                                            checked={requestType === type}
                                            onChange={(e) => setRequestType(e.target.value as VaultRequestType)}
                                            className="w-4 h-4 text-emerald-600"
                                        />
                                        <span className="text-sm text-slate-700">
                                            {VAULT_REQUEST_TYPES[type]}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                추가 메모 (선택)
                            </label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="지정인에게 전달할 추가 메시지나 안내사항"
                                className="min-h-24"
                            />
                        </div>

                        {/* Legal Consent */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={legalConsent}
                                    onChange={(e) => setLegalConsent(e.target.checked)}
                                    className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                                    required
                                />
                                <span className="text-sm text-slate-700 leading-relaxed">
                                    본인은 지정인(수신자)에게 해당 계정의 접속 및 정리를 위임함에 동의합니다. (필수)
                                </span>
                            </label>
                        </div>

                        {/* PIN Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                PIN 입력 (암호화 키)
                            </label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="설정한 PIN을 입력하세요"
                                className="text-center text-xl tracking-widest"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                비밀번호 암호화를 위해 PIN이 필요합니다
                            </p>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading || !legalConsent}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                        >
                            {loading ? "저장 중..." : "안전하게 저장하기"}
                        </Button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
