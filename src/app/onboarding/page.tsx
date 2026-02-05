"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, ArrowRight, Loader2, Check, ChevronDown, CheckCircle2 } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, THIRD_PARTY_PROVISION, ENTRUSTMENT } from "@/lib/compliance";



export default function OnboardingPage() {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [mounted, setMounted] = useState(false);

    // Steps: 0 = Agreements, 1 = Account Setup (New), 2 = Verification, 3 = Profile
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Step 0: Agreements
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedThirdParty, setAgreedThirdParty] = useState(false);
    const [agreedEntrustment, setAgreedEntrustment] = useState(false);
    const allAgreed = agreedTerms && agreedPrivacy && agreedThirdParty && agreedEntrustment;
    const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);

    // Step 1: Account Setup (Password for Social Users)
    const [accountEmail, setAccountEmail] = useState("");
    const [accountProvider, setAccountProvider] = useState("");
    const [accountPassword, setAccountPassword] = useState("");
    const [accountConfirmPassword, setAccountConfirmPassword] = useState("");

    // Step 2: Verification
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const [sendingCode, setSendingCode] = useState(false);

    // Step 3: Profile
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState("");


    useEffect(() => {
        setMounted(true);
        if (user) {
            // Pre-fill
            setName(user.user_metadata?.full_name || user.name || "");
            setUsername(user.user_metadata?.username || "");
            setProfileImage(user.user_metadata?.avatar_url || user.image || "");
            const metaPhone = user.user_metadata?.phone || "";
            if (metaPhone) {
                setPhone(metaPhone.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`));
            }
            // For Step 1
            setAccountEmail(user.email || "");
            setAccountProvider(user.app_metadata?.provider || "social");

            // Determine Starting Step based on completion status
            const checkStartStep = async () => {
                const supabase = createClient();
                console.log("=== ONBOARDING STEP DETECTION START ===");

                const userMetadata = user.user_metadata;
                const isOnboardingComplete = userMetadata?.onboarding_completed === true;

                // If user already completed onboarding, redirect to home
                if (isOnboardingComplete) {
                    window.location.href = "/";
                    return;
                }

                // Check agreements
                let hasAgreed = false;
                if ((userMetadata as any)?.terms_agreed) {
                    hasAgreed = true;
                } else {
                    const { data: agreementRows } = await supabase
                        .from('user_agreements')
                        .select('terms_agreed')
                        .eq('user_id', user.id)
                        .limit(1);
                    if (agreementRows?.[0]?.terms_agreed) hasAgreed = true;
                }

                // Check Phone Verification
                // Note: We check if password is set? Hard to check directly, but social login usually has empty password hash until set.
                // However, we can track "account_setup_completed" metadata if we want strict enforcement.
                // For now, let's assume if they have agreements, they might need account setup if it's social.

                // Simpler logic:
                // If Agreements DONE -> Check if Password/Account DONE (via metadata flag) -> Check Phone -> Profile

                const isAccountSetup = (userMetadata as any)?.account_setup_completed === true || user.app_metadata?.provider === 'email'; // Email users already did this
                const isPhoneVerified = (user.user_metadata as any)?.phone_verified || (typeof window !== 'undefined' && sessionStorage.getItem('auth_verified') === 'true');

                let startStep = 0; // Default: Agreements

                if (hasAgreed) {
                    startStep = 1; // Need Account Setup
                    if (isAccountSetup) {
                        startStep = 2; // Need Phone
                        if (isPhoneVerified) {
                            startStep = 3; // Need Profile
                        }
                    }
                }

                // Allow manual override via query param ?step=
                const params = new URLSearchParams(window.location.search);
                const queryStep = params.get("step");
                if (queryStep) {
                    const s = parseInt(queryStep);
                    setStep(s > 3 ? 3 : s);
                } else {
                    setStep(startStep);
                }
            };

            checkStartStep();
        }
    }, [user]);

    // ... Timer Logic (unchanged) ...
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCodeSent && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCodeSent, timer]);

    const handleSendVerification = async () => {
        if (!phone || phone.length < 10) {
            alert("올바른 휴대폰 번호를 입력해주세요.");
            return;
        }
        setSendingCode(true);
        try {
            setIsVerified(false);
            setVerificationCode("");
            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone, type: 'signup' }) // Explicitly set type
            });
            const data = await res.json();
            if (data.success) {
                setIsCodeSent(true);
                setTimer(180);
                alert("인증번호가 발송되었습니다.");
            } else {
                if (data.error?.includes("이미 가입된")) {
                    alert("이미 가입된 휴대폰 번호입니다. 메인 화면으로 이동합니다.");
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                    return;
                }
                alert(data.error || "발송 실패");
            }
        } catch (error) {
            console.error(error);
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setSendingCode(false);
        }
    };

    const handleConfirmVerification = async () => {
        if (!verificationCode) return;
        try {
            const res = await fetch('/api/verify/confirm', {
                method: 'POST',
                body: JSON.stringify({ phone, code: verificationCode })
            });
            const data = await res.json();
            if (data.success) {
                const supabase = createClient();
                const cleanPhone = phone.replace(/-/g, '');

                const { error: opsError } = await supabase.auth.updateUser({
                    data: { phone_verified: true, phone: cleanPhone }
                });

                if (opsError) {
                    console.error("Update error:", opsError);
                    if (opsError.message?.includes("already registered") || opsError.message?.includes("unique")) {
                        alert("이미 가입된 휴대폰 번호입니다. 메인 화면으로 이동합니다.");
                        await supabase.auth.signOut();
                        window.location.href = "/";
                        return;
                    }
                }

                // Update Profiles
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: user!.id,
                    phone: cleanPhone,
                    updated_at: new Date().toISOString()
                });

                if (profileError) {
                    if (profileError.message?.includes("unique") || profileError.details?.includes("phone")) {
                        alert("이미 가입된 휴대폰 번호입니다. 메인 화면으로 이동합니다.");
                        await supabase.auth.signOut();
                        window.location.href = "/";
                        return;
                    }
                }

                setIsVerified(true);
                setIsCodeSent(false);
                alert("인증이 완료되었습니다!");
                setTimeout(() => setStep(3), 500); // Auto advance to Profile (Step 3)
            } else {
                alert(data.error || "인증번호가 올바르지 않거나 만료되었습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleAgreementsSubmit = async () => {
        if (!allAgreed) {
            alert("모든 필수 약관에 동의해주세요.");
            return;
        }
        setLoading(true);
        const supabase = createClient();
        try {
            if (!user) throw new Error("User not found");

            const { error: authError } = await supabase.auth.updateUser({
                data: { terms_agreed: true }
            });

            const { error } = await supabase
                .from('user_agreements')
                .upsert({
                    user_id: user.id,
                    terms_agreed: agreedTerms,
                    privacy_agreed: agreedPrivacy,
                    third_party_agreed: agreedThirdParty,
                    entrustment_agreed: agreedEntrustment,
                    marketing_agreed: false,
                    terms_version: '1.0',
                    agreed_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) console.error("DB agreements save error:", error);

            // Move to next step (Account Setup)
            setStep(1);
        } catch (error: any) {
            alert("처리 중 오류가 발생했습니다: " + (error.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleAccountSubmit = async () => {
        // Only needed for Social Users who need to set password
        if (accountProvider === 'email') {
            setStep(2); // Skip to phone
            return;
        }

        if (!accountPassword || accountPassword !== accountConfirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        // Validate Password (reuse logic if imported or check length)
        if (accountPassword.length < 8) {
            alert("비밀번호를 8자 이상 입력해주세요.");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        try {
            const { error } = await supabase.auth.updateUser({
                password: accountPassword,
                data: { account_setup_completed: true }
            });

            if (error) throw error;

            alert("비밀번호 설정이 완료되었습니다.");
            setStep(2); // Move to Phone
        } catch (error: any) {
            alert("설정 실패: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ... (checkUsernameAvailability, handleImageUpload, handleFinalSubmit same as before) ...
    // Note: handleFinalSubmit previously had logic for completion. Ensure it redirects.

    const checkUsernameAvailability = async () => {
        if (!username || username.length < 3) {
            setUsernameAvailable(false);
            setUsernameError("3자 이상이어야 합니다.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/user/check-username', {
                method: 'POST',
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            setUsernameAvailable(data.available);
            if (!data.available) {
                setUsernameError(data.message || data.error || "사용할 수 없는 아이디입니다.");
            } else {
                setUsernameError(null);
            }
        } catch (error) {
            console.error(error);
            setUsernameAvailable(false);
            setUsernameError("확인 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("이미지 크기는 2MB 이하여야 합니다.");
            return;
        }
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setProfileImage(publicUrl);
        } catch (error) {
            alert("이미지 업로드 실패");
        }
    };

    const handleFinalSubmit = async () => {
        if (!name.trim() || !username.trim()) {
            alert("이름과 아이디를 입력해주세요.");
            return;
        }
        setLoading(true);
        const supabase = createClient();
        try {
            const updates = {
                full_name: name,
                name: name,
                username: username,
                phone: phone.replace(/-/g, ''),
                avatar_url: profileImage,
                onboarding_completed: true
            };

            await supabase.from('profiles').upsert({
                id: user!.id,
                ...updates,
                updated_at: new Date().toISOString()
            });

            await supabase.auth.updateUser({ data: updates });

            if (user?.email) {
                fetch('/api/email/welcome', {
                    method: 'POST',
                    body: JSON.stringify({ email: user.email, name })
                }).catch(console.error);
            }

            await supabase.auth.refreshSession();

            setUser({
                ...user!,
                name: name,
                image: profileImage,
                user_metadata: { ...user!.user_metadata, ...updates }
            });

            if (typeof window !== 'undefined') sessionStorage.setItem('auth_verified', 'true');

            router.replace("/");
        } catch (error: any) {
            alert("저장 실패: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    if (!mounted || !user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pt-28 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 relative overflow-hidden">
                {/* Back Button */}
                <button
                    onClick={async () => {
                        if (step > 0) {
                            setStep(step - 1);
                        } else {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.replace("/login");
                        }
                    }}
                    className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Progress Indicator (4 Steps) */}
                <div className="flex justify-center mb-8 gap-2">
                    {[0, 1, 2, 3].map((s) => (
                        <div key={s} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${s <= step ? "bg-blue-600" : "bg-slate-200"}`} />
                    ))}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">
                        {step === 0 && "약관 동의"}
                        {step === 1 && "계정 정보"}
                        {step === 2 && "본인 확인"}
                        {step === 3 && "프로필 설정"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {step === 0 && "서비스 이용을 위해 필수 약관에 동의해주세요."}
                        {step === 1 && "계정 보안을 위한 정보를 설정합니다."}
                        {step === 2 && "본인 명의의 휴대폰으로 인증해주세요."}
                        {step === 3 && "사용하실 프로필 정보를 입력해주세요."}
                    </p>
                </div>

                {/* STEP 0: Agreements */}
                {step === 0 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        {/* [Agreements content same as before] */}
                        {/* We will reuse the same UI structure for brevity in replacement if possible, but full render here is safer */}
                        <div
                            className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => {
                                const newState = !allAgreed;
                                setAgreedTerms(newState);
                                setAgreedPrivacy(newState);
                                setAgreedThirdParty(newState);
                                setAgreedEntrustment(newState);
                            }}
                        >
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${allAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                {allAgreed && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-bold text-slate-900">약관 전체 동의</span>
                        </div>

                        <div className="h-px bg-slate-200 my-2" />

                        {/* Individual Agreements List */}
                        <div className="space-y-2">
                            {/* Terms */}
                            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setAgreedTerms(!agreedTerms)}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedTerms ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}> {agreedTerms && <Check className="w-3 h-3 text-white" />} </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 서비스 이용약관<button type="button" onClick={(e) => { e.stopPropagation(); setExpandedAgreement('terms'); }} className="ml-2 text-slate-500 underline hover:text-blue-600 text-xs">내용보기</button></span>
                            </div>
                            {/* Privacy */}
                            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setAgreedPrivacy(!agreedPrivacy)}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedPrivacy ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}> {agreedPrivacy && <Check className="w-3 h-3 text-white" />} </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 개인정보 수집 및 이용<button type="button" onClick={(e) => { e.stopPropagation(); setExpandedAgreement('privacy'); }} className="ml-2 text-slate-500 underline hover:text-blue-600 text-xs">내용보기</button></span>
                            </div>
                            {/* Third Party */}
                            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setAgreedThirdParty(!agreedThirdParty)}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedThirdParty ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}> {agreedThirdParty && <Check className="w-3 h-3 text-white" />} </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 제3자 제공<button type="button" onClick={(e) => { e.stopPropagation(); setExpandedAgreement('third-party'); }} className="ml-2 text-slate-500 underline hover:text-blue-600 text-xs">내용보기</button></span>
                            </div>
                            {/* Entrustment */}
                            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setAgreedEntrustment(!agreedEntrustment)}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedEntrustment ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}> {agreedEntrustment && <Check className="w-3 h-3 text-white" />} </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 개인정보 처리 위탁<button type="button" onClick={(e) => { e.stopPropagation(); setExpandedAgreement('entrustment'); }} className="ml-2 text-slate-500 underline hover:text-blue-600 text-xs">내용보기</button></span>
                            </div>
                        </div>

                        <Button onClick={handleAgreementsSubmit} disabled={loading || !allAgreed} className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "다음으로"}</Button>
                    </div>
                )}

                {/* STEP 1: Account Setup (Password - New) */}
                {step === 1 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        {/* Email Display (Read-only) */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={accountEmail}
                                    readOnly
                                    disabled
                                    className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none"
                                />
                                <div className="w-24 flex items-center justify-center rounded-xl bg-green-100 text-green-700 font-bold text-xs">
                                    인증됨
                                </div>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호 설정</label>
                                <input
                                    type="password"
                                    value={accountPassword}
                                    onChange={(e) => setAccountPassword(e.target.value)}
                                    placeholder="8자 이상 비밀번호 입력"
                                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호 확인</label>
                                <input
                                    type="password"
                                    value={accountConfirmPassword}
                                    onChange={(e) => setAccountConfirmPassword(e.target.value)}
                                    placeholder="비밀번호 다시 입력"
                                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {accountPassword && accountConfirmPassword && (
                                    <p className={`text-xs mt-2 ml-1 ${accountPassword === accountConfirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                        {accountPassword === accountConfirmPassword ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button onClick={handleAccountSubmit} disabled={loading || !accountPassword || accountPassword !== accountConfirmPassword} className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-4">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "다음으로"}</Button>
                    </div>
                )}

                {/* STEP 2: Phone Verification */}
                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        {/* [Phone Verification Content Same As Before] */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">휴대폰 번호</label>
                            <div className="flex gap-2 items-stretch">
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))} placeholder="010-0000-0000" maxLength={13} disabled={isVerified} className="flex-1 h-12 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                                <Button onClick={handleSendVerification} disabled={sendingCode || isVerified || (isCodeSent && timer > 0)} className="h-12 w-20 rounded-xl bg-slate-800 text-white font-bold text-sm">{sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : isVerified ? "완료" : isCodeSent ? "재전송" : "전송"}</Button>
                            </div>
                        </div>
                        {isCodeSent && !isVerified && (
                            <div className="relative">
                                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증번호 6자리" className="w-full h-12 p-3 pr-20 rounded-xl border border-blue-200 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 font-medium">{Math.floor(timer / 60)}:{((timer % 60)).toString().padStart(2, '0')}</span>
                            </div>
                        )}
                        {!isVerified ? (
                            <Button onClick={handleConfirmVerification} disabled={!verificationCode} className="w-full h-14 mt-4 rounded-xl bg-blue-600 text-white font-bold text-lg">인증하기</Button>
                        ) : (
                            <Button onClick={() => setStep(3)} className="w-full h-14 mt-4 rounded-xl bg-blue-600 text-white font-bold text-lg">다음으로 <ArrowRight className="ml-2 w-5 h-5" /></Button>
                        )}
                    </div>
                )}

                {/* STEP 3: Profile Setup */}
                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Profile Image & Inputs [Same as before] */}
                        <div className="flex justify-center">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 bg-slate-50 relative"> {profileImage ? (<SecureAvatar src={profileImage} alt="Profile" className="w-full h-full" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-8 h-8" /></div>)} </div>
                                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-sm border border-slate-100"><Camera className="w-3 h-3 text-slate-500" /></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-sm font-bold text-slate-700">이름</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="실명 입력" className="w-full p-3 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            <div><label className="text-sm font-bold text-slate-700">아이디 (ID)</label>
                                <div className="relative">
                                    <input type="text" value={username} onChange={(e) => { const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); setUsername(val); setUsernameAvailable(null); setUsernameError(null); }} onBlur={checkUsernameAvailability} placeholder="영문 소문자, 숫자, ., _" className={`w-full p-3 pl-10 rounded-xl border outline-none font-medium transition-all ${usernameAvailable === false ? 'border-red-300 bg-red-50 focus:border-red-500' : usernameAvailable === true ? 'border-green-300 bg-green-50 focus:border-green-500' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`} />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</div>
                                    {usernameAvailable === true && (<div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"><CheckCircle2 className="w-5 h-5" /></div>)}
                                    {loading && (<div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div></div>)}
                                </div>
                                <p className="text-xs mt-1.5 ml-1 h-4">{usernameAvailable === false ? (<span className="text-red-500 font-bold">{usernameError || "이미 사용 중인 아이디입니다."}</span>) : (<span className="text-slate-400">3자 이상, 특수문자는 . _ 만 가능합니다.</span>)}</p>
                            </div>
                        </div>
                        <Button onClick={handleFinalSubmit} disabled={loading || !name || !username || usernameAvailable !== true} className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "시작하기"}</Button>
                    </div>
                )}            </div>

            {/* Agreement Detail Modal */}
            {expandedAgreement && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setExpandedAgreement(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-900">
                                {expandedAgreement === 'terms' && '서비스 이용약관'}
                                {expandedAgreement === 'privacy' && '개인정보 수집 및 이용'}
                                {expandedAgreement === 'third-party' && '제3자 제공'}
                                {expandedAgreement === 'entrustment' && '개인정보 처리 위탁'}
                            </h3>
                            <button
                                onClick={() => setExpandedAgreement(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {expandedAgreement === 'terms' && TERMS_OF_SERVICE}
                            {expandedAgreement === 'privacy' && PRIVACY_POLICY}
                            {expandedAgreement === 'third-party' && THIRD_PARTY_PROVISION}
                            {expandedAgreement === 'entrustment' && ENTRUSTMENT}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
