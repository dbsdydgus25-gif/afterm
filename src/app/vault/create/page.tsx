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
import { VaultLegalConsent } from "@/components/vault/VaultLegalConsent";
import { VaultStepIndicator, VaultMobileProgress } from "@/components/vault/VaultStepIndicator";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function VaultCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [hasPin, setHasPin] = useState<boolean | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    // Step 0: Legal Consent
    const [legalConsents, setLegalConsents] = useState({
        financialConsent: false,
        platformConsent: false,
        delegationConsent: false
    });

    // Step 1: Recipient
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [recipientRelationship, setRecipientRelationship] = useState('');

    // Step 2: Account Info
    const [category, setCategory] = useState<VaultCategory>('subscription');
    const [platformName, setPlatformName] = useState('');
    const [customPlatform, setCustomPlatform] = useState('');
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [requestType, setRequestType] = useState<VaultRequestType>('cancel');

    // Step 3: PIN & Hint
    const [pin, setPin] = useState('');
    const [pinHint, setPinHint] = useState('');
    const [notes, setNotes] = useState('');

    const TOTAL_STEPS = 5;

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
                router.push("/vault/setup-pin");
                return;
            }

            setHasPin(true);
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleLegalConsentComplete = (consents: any) => {
        setLegalConsents(consents);
        setCurrentStep(1);
    };

    const handleNextStep = () => {
        // Validation for each step
        if (currentStep === 1) {
            if (!recipientName || !recipientPhone || !recipientRelationship) {
                alert("수신인 정보를 모두 입력해주세요.");
                return;
            }
        } else if (currentStep === 2) {
            const finalPlatform = category === 'other' ? customPlatform : platformName;
            if (!finalPlatform || !accountId || !password) {
                alert("계정 정보를 모두 입력해주세요.");
                return;
            }
        } else if (currentStep === 3) {
            if (!pin || !pinHint) {
                alert("PIN과 힌트를 입력해주세요.");
                return;
            }
        }

        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("로그인이 필요합니다.");
                router.push("/login");
                return;
            }

            // Check message count
            const { data: profile } = await supabase
                .from('profiles')
                .select('message_count')
                .eq('id', user.id)
                .single();

            if (!profile || profile.message_count <= 0) {
                alert("남은 메시지 횟수가 부족합니다. 플랜을 업그레이드해주세요.");
                router.push("/plans");
                return;
            }

            const finalPlatform = category === 'other' ? customPlatform : platformName;

            // Encrypt password
            const encryptedPassword = encryptPassword(password, pin);

            // Save to database
            const { data: vaultItem, error } = await supabase
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
                    legal_consent: true
                })
                .select()
                .single();

            if (error) {
                console.error("Vault creation error:", error);
                alert("저장 중 오류가 발생했습니다.");
                return;
            }

            // Deduct message count
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    message_count: profile.message_count - 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error("Message count update error:", updateError);
            }

            // Send notification to recipient (first time only)
            if (vaultItem && !vaultItem.notification_sent) {
                try {
                    await fetch('/api/vault/notify-recipient', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vaultItemId: vaultItem.id,
                            recipientPhone: recipientPhone,
                            recipientName: recipientName,
                            senderName: user.user_metadata?.name || user.email
                        })
                    });
                } catch (notifyError) {
                    console.error("Notification error:", notifyError);
                    // Don't block the flow if notification fails
                }
            }

            alert("디지털 유산이 안전하게 저장되었습니다!");
            router.push("/vault");

        } catch (error: any) {
            console.error(error);
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const getPlatformOptions = () => {
        if (category === 'subscription') return SUBSCRIPTION_PLATFORMS;
        if (category === 'sns') return SNS_PLATFORMS;
        return [];
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

            <main className="flex-1 px-4 md:px-6 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-8">
                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Mobile Progress */}
                            <VaultMobileProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                            {/* Step 0: Legal Consent */}
                            {currentStep === 0 && (
                                <VaultLegalConsent onComplete={handleLegalConsentComplete} />
                            )}

                            {/* Step 1: Recipient */}
                            {currentStep === 1 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
                                        수신인 지정
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                이름
                                            </label>
                                            <Input
                                                value={recipientName}
                                                onChange={(e) => setRecipientName(e.target.value)}
                                                placeholder="홍길동"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                휴대폰 번호
                                            </label>
                                            <Input
                                                value={recipientPhone}
                                                onChange={(e) => setRecipientPhone(e.target.value)}
                                                placeholder="010-1234-5678"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                관계
                                            </label>
                                            <Input
                                                value={recipientRelationship}
                                                onChange={(e) => setRecipientRelationship(e.target.value)}
                                                placeholder="가족, 친구 등"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Account Info */}
                            {currentStep === 2 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                                        계정 정보 입력
                                    </h2>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            카테고리
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(Object.keys(VAULT_CATEGORIES) as VaultCategory[]).map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(cat);
                                                        setPlatformName('');
                                                    }}
                                                    className={`p-2 md:p-3 rounded-lg border-2 text-xs md:text-sm font-medium transition-all ${category === cat
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {VAULT_CATEGORIES[cat]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Platform */}
                                    {category !== 'other' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                플랫폼
                                            </label>
                                            <select
                                                value={platformName}
                                                onChange={(e) => setPlatformName(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                            >
                                                <option value="">선택</option>
                                                {getPlatformOptions().map((p) => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                플랫폼 이름
                                            </label>
                                            <Input
                                                value={customPlatform}
                                                onChange={(e) => setCustomPlatform(e.target.value)}
                                                placeholder="직접 입력"
                                            />
                                        </div>
                                    )}

                                    {/* Account ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            아이디/이메일
                                        </label>
                                        <Input
                                            value={accountId}
                                            onChange={(e) => setAccountId(e.target.value)}
                                            placeholder="user@example.com"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            비밀번호
                                        </label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {/* Request Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            요청사항
                                        </label>
                                        <div className="space-y-2">
                                            {(Object.keys(VAULT_REQUEST_TYPES) as VaultRequestType[]).map((type) => (
                                                <label key={type} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="requestType"
                                                        value={type}
                                                        checked={requestType === type}
                                                        onChange={(e) => setRequestType(e.target.value as VaultRequestType)}
                                                        className="w-4 h-4"
                                                    />
                                                    {VAULT_REQUEST_TYPES[type]}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: PIN & Hint */}
                            {currentStep === 3 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                                        PIN 및 힌트 설정
                                    </h2>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            PIN 입력
                                        </label>
                                        <Input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                            placeholder="설정한 PIN"
                                            className="text-center text-lg tracking-widest"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            PIN 힌트
                                        </label>
                                        <Input
                                            value={pinHint}
                                            onChange={(e) => setPinHint(e.target.value)}
                                            placeholder="예: 엄마 생일"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            수신인이 PIN을 찾을 수 있도록 힌트를 남겨주세요
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            추가 메모 (선택)
                                        </label>
                                        <Textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="수신인에게 전달할 메시지"
                                            className="min-h-20 text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Final Confirmation */}
                            {currentStep === 4 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
                                        최종 확인
                                    </h2>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-slate-600">수신인</span>
                                            <span className="font-medium">{recipientName} ({recipientRelationship})</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-slate-600">플랫폼</span>
                                            <span className="font-medium">{category === 'other' ? customPlatform : platformName}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-slate-600">아이디</span>
                                            <span className="font-medium">{accountId}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-slate-600">요청사항</span>
                                            <span className="font-medium">{VAULT_REQUEST_TYPES[requestType]}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            {currentStep > 0 && (
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={handlePrevStep}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        이전
                                    </Button>
                                    {currentStep < TOTAL_STEPS - 1 ? (
                                        <Button
                                            onClick={handleNextStep}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            다음
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {loading ? "저장 중..." : "저장하기"}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step Indicator (Desktop) */}
                        <VaultStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
