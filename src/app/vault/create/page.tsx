"use client";
// Last Deployed: 2026-02-04 00:42 (Force Update)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { encryptPassword } from "@/lib/crypto";
import {
    VAULT_CATEGORIES,
    VAULT_REQUEST_TYPES,
    SUBSCRIPTION_PLATFORMS,
    SNS_PLATFORMS,
    VaultCategory,
    VaultRequestType
} from "@/lib/vault-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VaultLegalConsent } from "@/components/vault/VaultLegalConsent";
import { ArrowLeft, User, Phone, Heart } from "lucide-react";
import { getErrorMessage } from "@/lib/error";

export default function VaultCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Step 0: Legal Consent
    const [legalConsents, setLegalConsents] = useState({
        financialConsent: false,
        platformConsent: false, // Legacy
        delegationConsent: false
    });

    // Step 1: Recipient
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [recipientRelationship, setRecipientRelationship] = useState('');
    const [isCustomRel, setIsCustomRel] = useState(false);
    const [recipientConsent, setRecipientConsent] = useState(false);

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



    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            if (!recipientConsent) {
                alert("알림 수신 및 개인정보 처리에 동의해주세요.");
                return;
            }
        } else if (currentStep === 2) {
            const finalPlatform = category === 'other' ? customPlatform : platformName;

            // Banned words check for custom platform
            if (category === 'other') {
                const bannedWords = ['은행', '뱅크', 'Bank', '증권', '투자', '카드', 'Card', '코인', 'Coin', '업비트', '빗썸', '지갑', 'Wallet', '인증서', 'OTP', '보안카드', '정부24', '홈택스'];
                const hasBannedWord = bannedWords.some(word => customPlatform.toLowerCase().includes(word.toLowerCase()));
                if (hasBannedWord) {
                    alert("금융 및 인증 정보는 법적으로 저장이 불가능합니다");
                    return;
                }
            }

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

            // Check vault count based on plan
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', user.id)
                .single();

            const plan = profile?.plan || 'basic';
            const maxVaults = plan === 'pro' ? 10 : 1;

            // Count existing vaults
            const { count } = await supabase
                .from('vault_items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (count !== null && count >= maxVaults) {
                alert(`${plan === 'pro' ? 'Pro' : 'Basic'} 플랜에서는 디지털 유산을 ${maxVaults}개까지만 저장할 수 있습니다.${plan === 'basic' ? '\nPro 플랜으로 업그레이드하시면 10개까지 저장 가능합니다.' : ''}`);
                router.push('/plans');
                return;
            }

            const finalPlatform = category === 'other' ? customPlatform : platformName;

            // Encrypt password
            const encryptedPassword = encryptPassword(password, pin);

            // Hash PIN for storage (동적 import 사용)
            const bcrypt = await import('bcryptjs');
            const pinHash = await bcrypt.default.hash(pin, 10);

            // Save to database with recipient info
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
                    recipient_name: recipientName,
                    recipient_phone: recipientPhone,
                    recipient_relationship: recipientRelationship,
                    pin_hint: pinHint,
                    pin_hash: pinHash,
                    legal_consent: true
                })
                .select()
                .single();

            if (error) {
                console.error("Vault creation error:", error);
                alert(`저장 중 오류가 발생했습니다.\n${getErrorMessage(error) || '알 수 없는 오류'}`);
                return;
            }

            if (!vaultItem) {
                alert("저장에 실패했습니다. 다시 시도해주세요.");
                return;
            }

            // Send SMS to recipient
            try {
                const senderName = user.user_metadata?.name || user.email?.split('@')[0] || '사용자';
                const vaultUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://afterm.co.kr'}/vault/view/${vaultItem.id}`;
                const message = `[에프텀] ${senderName}님이 보낸 디지털 유산이 도착했습니다. 아래 링크를 터치해서 확인해주세요.\n${vaultUrl}`;

                console.log('Sending SMS to:', recipientPhone);
                const smsResponse = await fetch('/api/sms/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: recipientPhone,
                        message: message
                    })
                });

                if (smsResponse.ok) {
                    await supabase
                        .from('vault_items')
                        .update({ notification_sent: true })
                        .eq('id', vaultItem.id);
                }
            } catch (smsError) {
                console.error("SMS error:", smsError);
            }

            alert("디지털 유산이 안전하게 저장되었습니다!");
            router.push("/vault");

        } catch (error: unknown) {
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



    const getStepTitle = () => {
        switch (currentStep) {
            case 0: return "서비스 이용 안내";
            case 1: return "수신인 지정";
            case 2: return "계정 정보 입력";
            case 3: return "PIN 및 힌트 설정";
            case 4: return "최종 확인";
            default: return "";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 h-14 flex items-center px-5 justify-between sticky top-0 z-50">
                <span className="text-lg font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => router.push('/')}>AFTERM</span>
                <div className="text-xs font-medium text-slate-500">
                    {getStepTitle()} ({currentStep + 1}/{TOTAL_STEPS})
                </div>
            </header>

            <main className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col justify-center animate-fade-in pb-24">
                {/* Step 0: Legal Consent */}
                {currentStep === 0 && (
                    <VaultLegalConsent onComplete={handleLegalConsentComplete} />
                )}

                {/* Step 1: Recipient */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2 mb-4">
                            <h1 className="text-lg font-bold text-slate-900">
                                누구에게 남기시겠습니까?
                            </h1>
                            <p className="text-xs text-slate-500">
                                사후에 이 정보를 전달받을 분을 지정해주세요.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                            {/* Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold leading-none flex items-center gap-1.5 text-slate-700">
                                    <User className="w-3.5 h-3.5 text-slate-500" /> 이름
                                </label>
                                <Input
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    placeholder="받으실 분의 성함"
                                    className="h-10 text-sm placeholder:text-slate-300"
                                />
                            </div>

                            {/* Phone Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold leading-none flex items-center gap-1.5 text-slate-700">
                                    <Phone className="w-3.5 h-3.5 text-slate-500" /> 연락처
                                </label>
                                <Input
                                    value={recipientPhone}
                                    onChange={(e) => setRecipientPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                    placeholder="010-0000-0000"
                                    className="h-10 text-sm placeholder:text-slate-300"
                                    maxLength={13}
                                />
                            </div>

                            {/* Relationship Select */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold leading-none flex items-center gap-1.5 text-slate-700">
                                    <Heart className="w-3.5 h-3.5 text-slate-500" /> 관계
                                </label>
                                <div className="space-y-2">
                                    <select
                                        value={isCustomRel ? '기타' : recipientRelationship}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '기타') {
                                                setIsCustomRel(true);
                                                setRecipientRelationship('');
                                            } else {
                                                setIsCustomRel(false);
                                                setRecipientRelationship(val);
                                            }
                                        }}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>관계를 선택해주세요</option>
                                        <option value="가족">가족</option>
                                        <option value="친구">친구</option>
                                        <option value="연인">연인</option>
                                        <option value="동료">동료</option>
                                        <option value="기타">기타 (직접 입력)</option>
                                    </select>

                                    {isCustomRel && (
                                        <Input
                                            value={recipientRelationship}
                                            onChange={(e) => setRecipientRelationship(e.target.value)}
                                            placeholder="직접 입력 (예: 이웃, 선생님)"
                                            className="h-10 text-sm animate-in fade-in slide-in-from-top-1"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex items-center space-x-2 px-1">
                            <input
                                type="checkbox"
                                id="recipientConsent"
                                checked={recipientConsent}
                                onChange={(e) => setRecipientConsent(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                                htmlFor="recipientConsent"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer"
                            >
                                알림 수신 및 개인정보 처리에 동의합니다. (필수)
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 2: Account Info */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2 mb-4">
                            <h1 className="text-lg font-bold text-slate-900">
                                어떤 계정을 정리할까요?
                            </h1>
                            <p className="text-sm text-slate-500">
                                정리하고 싶은 웹사이트나 앱 정보를 입력해주세요.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">카테고리</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(VAULT_CATEGORIES) as VaultCategory[]).map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setCategory(cat);
                                                setPlatformName('');
                                            }}
                                            className={`p-2 rounded-lg border text-xs font-medium transition-all h-10 ${category === cat
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">플랫폼</label>
                                    <select
                                        value={platformName}
                                        onChange={(e) => setPlatformName(e.target.value)}
                                        className="w-full h-12 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="">선택해주세요</option>
                                        {getPlatformOptions().map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">플랫폼 이름</label>
                                    <Input
                                        value={customPlatform}
                                        onChange={(e) => setCustomPlatform(e.target.value)}
                                        placeholder="직접 입력"
                                        className="h-12"
                                    />
                                </div>
                            )}

                            {/* Account ID & Password */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">아이디/이메일</label>
                                <Input
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    placeholder="user@example.com"
                                    className="h-12"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-12"
                                />
                            </div>

                            {/* Request Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">요청사항</label>
                                <div className="space-y-2">
                                    {(Object.keys(VAULT_REQUEST_TYPES) as VaultRequestType[]).map((type) => (
                                        <label key={type} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50">
                                            <input
                                                type="radio"
                                                name="requestType"
                                                value={type}
                                                checked={requestType === type}
                                                onChange={(e) => setRequestType(e.target.value as VaultRequestType)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm text-slate-700">{VAULT_REQUEST_TYPES[type]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: PIN & Hint */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2 mb-4">
                            <h1 className="text-lg font-bold text-slate-900">
                                안전하게 잠그기
                            </h1>
                            <p className="text-sm text-slate-500">
                                수신인만 열어볼 수 있도록 2차 비밀번호를 설정합니다.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">PIN 설정 (6자리)</label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="숫자 6자리 입력"
                                    className="h-14 text-center text-xl tracking-widest font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">PIN 힌트</label>
                                <Input
                                    value={pinHint}
                                    onChange={(e) => setPinHint(e.target.value)}
                                    placeholder="예: 우리집 강아지 생일 (월일)"
                                    className="h-12"
                                />
                                <p className="text-xs text-slate-500 mt-2 ml-1">
                                    * 수신인이 알 수 있는 힌트를 남겨주세요.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">추가 메모 (선택)</label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="수신인에게 남길 말이 있다면 적어주세요."
                                    className="min-h-[100px] text-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Final Confirmation */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2 mb-4">
                            <h1 className="text-lg font-bold text-slate-900">
                                마지막으로 확인해주세요
                            </h1>
                            <p className="text-sm text-slate-500">
                                작성하신 내용이 맞는지 확인해주세요.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-sm text-slate-500">수신인</span>
                                <span className="text-sm font-bold text-slate-900">{recipientName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-sm text-slate-500">연락처</span>
                                <span className="text-sm font-bold text-slate-900">{recipientPhone}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-sm text-slate-500">플랫폼</span>
                                <span className="text-sm font-bold text-slate-900">{category === 'other' ? customPlatform : platformName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-sm text-slate-500">아이디</span>
                                <span className="text-sm font-bold text-slate-900">{accountId}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-sm text-slate-500">요청사항</span>
                                <span className="text-sm font-bold text-blue-600">{VAULT_REQUEST_TYPES[requestType]}</span>
                            </div>
                            {notes && (
                                <div className="pt-2">
                                    <span className="text-sm text-slate-500 block mb-2">추가 메모</span>
                                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                                        {notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Inline Action Buttons */}
                {currentStep > 0 && (
                    <div className="mt-8 flex gap-3 pb-6">
                        <Button
                            onClick={handlePrevStep}
                            variant="outline"
                            className="flex-1 h-12 rounded-xl text-base font-bold bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        >
                            이전
                        </Button>
                        {currentStep < TOTAL_STEPS - 1 ? (
                            <Button
                                onClick={handleNextStep}
                                className="flex-[2] h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                            >
                                다음 단계로
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-[2] h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                            >
                                {loading ? "저장 중..." : "최종 저장하기"}
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
