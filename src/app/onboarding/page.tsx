"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, ArrowRight, Loader2, Check, ChevronDown } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, THIRD_PARTY_PROVISION, ENTRUSTMENT } from "@/lib/compliance";



export default function OnboardingPage() {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [mounted, setMounted] = useState(false);

    // Steps: 0 = Agreements, 1 = Verification, 2 = Profile
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Step 0: Agreements
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedThirdParty, setAgreedThirdParty] = useState(false);
    const [agreedEntrustment, setAgreedEntrustment] = useState(false);
    const allAgreed = agreedTerms && agreedPrivacy && agreedThirdParty && agreedEntrustment;
    const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);

    // Step 1: Verification
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [timer, setTimer] = useState(0);

    // Step 2: Profile
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState("");


    useEffect(() => {
        setMounted(true);
        if (user) {
            // Pre-fill
            setName(user.user_metadata?.full_name || user.name || "");
            setNickname(user.user_metadata?.nickname || "");
            setProfileImage(user.user_metadata?.avatar_url || user.image || "");
            const metaPhone = user.user_metadata?.phone || "";
            if (metaPhone) {
                setPhone(metaPhone.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`));
            }

            // Determine Starting Step based on completion status
            const checkStartStep = async () => {
                const supabase = createClient();
                console.log("=== ONBOARDING STEP DETECTION START ===");
                console.log("User ID:", user.id);
                console.log("User email:", user.email);

                // First check if user already has nickname (onboarding complete)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', user.id)
                    .single();

                console.log("Profile data:", profile);
                console.log("Has nickname:", !!profile?.nickname);
                console.log("Nickname value:", profile?.nickname);

                // If user already completed onboarding, redirect to home
                if (profile?.nickname) {
                    console.log(">>> User already has nickname, redirecting to home");
                    router.replace("/");
                    return;
                }

                console.log(">>> User has no nickname, proceeding with onboarding");

                // Check agreements
                const { data: agreementRows } = await supabase
                    .from('user_agreements')
                    .select('*')
                    .eq('user_id', user.id)
                    .limit(1);

                const agreements = agreementRows?.[0];
                console.log("Agreements data:", agreements);
                const hasAgreed = agreements?.terms_agreed && agreements?.privacy_agreed && agreements?.third_party_agreed && agreements?.entrustment_agreed;
                console.log("Has agreed:", hasAgreed);

                // Check phone verification
                const isPhoneVerified = (user.user_metadata as any)?.phone_verified || (typeof window !== 'undefined' && sessionStorage.getItem('auth_verified') === 'true');
                console.log("Is phone verified:", isPhoneVerified);

                let startStep = 0; // Default to Agreements

                if (hasAgreed && !isPhoneVerified) {
                    startStep = 1; // Agreements done, need phone verification
                } else if (hasAgreed && isPhoneVerified) {
                    startStep = 2; // Both done, need profile
                }

                console.log("Starting step:", startStep);

                // Allow manual override via query param ?step=
                const params = new URLSearchParams(window.location.search);
                const queryStep = params.get("step");
                if (queryStep) {
                    const s = parseInt(queryStep);
                    setStep(s > 2 ? 2 : s);
                    console.log("Step overridden by query param:", s);
                } else {
                    setStep(startStep);
                }
                console.log("=== ONBOARDING STEP DETECTION END ===");
            };

            checkStartStep();
        }
    }, [user]);

    // Timer Logic
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
        try {
            setIsVerified(false);
            setVerificationCode("");
            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (data.success) {
                setIsCodeSent(true);
                setTimer(180);
                alert("인증번호가 발송되었습니다.");
            } else {
                alert("발송 실패: " + data.error);
            }
        } catch (error) {
            alert("발송 중 오류가 발생했습니다.");
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
                setIsVerified(true);
                setIsCodeSent(false);
                alert("인증이 완료되었습니다!");
                setTimeout(() => setStep(2), 500); // Auto advance to Profile
            } else {
                alert("인증번호가 올바르지 않거나 만료되었습니다.");
            }
        } catch (error) {
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

            // Save agreements to database
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

            if (error) throw error;

            // Move to next step (Phone Verification)
            setStep(1);
        } catch (error: any) {
            alert("처리 중 오류가 발생했습니다: " + (error.message || ""));
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
        if (!name.trim() || !nickname.trim()) {
            alert("이름과 별명을 입력해주세요.");
            return;
        }
        setLoading(true);
        const supabase = createClient();
        try {
            const updates = {
                full_name: name,
                name: name,
                nickname: nickname,
                bio: bio,
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

            // Send Welcome Email
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

            // Mark as verified since they just set the profile
            if (typeof window !== 'undefined') sessionStorage.setItem('auth_verified', 'true');

            // Handle Redirect
            const params = new URLSearchParams(window.location.search);
            const returnTo = params.get("returnTo");
            if (returnTo) {
                router.replace(returnTo);
            } else {
                router.replace("/");
            }
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
                        // Intelligent Back Logic
                        if (step === 2) {
                            setStep(1);
                        } else if (step === 1) {
                            setStep(0);
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

                {/* Progress Indicator */}
                <div className="flex justify-center mb-8 gap-2">
                    {[0, 1, 2].map((s) => (
                        <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? "bg-blue-600" : "bg-slate-200"}`} />
                    ))}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">
                        {step === 0 && "약관 동의"}
                        {step === 1 && "본인 확인"}
                        {step === 2 && "프로필 설정"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {step === 0 && "서비스 이용을 위해 필수 약관에 동의해주세요."}
                        {step === 1 && "본인 명의의 휴대폰으로 인증해주세요."}
                        {step === 2 && "사용하실 프로필 정보를 입력해주세요."}
                    </p>
                </div>

                {/* STEP 0: Agreements */}
                {step === 0 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        {/* All Agree */}
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

                        {/* Individual Agreements */}
                        <div className="space-y-2">
                            <div
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setAgreedTerms(!agreedTerms)}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedTerms ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {agreedTerms && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 서비스 이용약관</span>
                            </div>

                            <div
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setAgreedPrivacy(!agreedPrivacy)}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedPrivacy ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {agreedPrivacy && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 개인정보 수집 및 이용</span>
                            </div>

                            <div
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setAgreedThirdParty(!agreedThirdParty)}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedThirdParty ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {agreedThirdParty && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 제3자 정보 제공 동의</span>
                            </div>

                            <div
                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setAgreedEntrustment(!agreedEntrustment)}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedEntrustment ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {agreedEntrustment && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 개인정보 처리 위탁</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleAgreementsSubmit}
                            disabled={loading || !allAgreed}
                            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "다음으로"}
                        </Button>
                    </div>
                )}

                {/* STEP 1: Phone Verification */}
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">휴대폰 번호</label>
                            <div className="flex gap-2 items-stretch">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                    placeholder="010-0000-0000"
                                    maxLength={13}
                                    disabled={isVerified}
                                    className="flex-1 h-12 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                                <Button
                                    onClick={handleSendVerification}
                                    disabled={isVerified || (isCodeSent && timer > 0)}
                                    className="h-12 w-20 rounded-xl bg-slate-800 text-white font-bold text-sm"
                                >
                                    {isVerified ? "완료" : isCodeSent ? "재전송" : "전송"}
                                </Button>
                            </div>
                        </div>

                        {isCodeSent && !isVerified && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="인증번호 6자리"
                                    className="w-full h-12 p-3 pr-20 rounded-xl border border-blue-200 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 font-medium">
                                    {Math.floor(timer / 60)}:{((timer % 60)).toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}

                        {!isVerified ? (
                            <Button
                                onClick={handleConfirmVerification}
                                disabled={!verificationCode}
                                className="w-full h-14 mt-4 rounded-xl bg-blue-600 text-white font-bold text-lg"
                            >
                                인증하기
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setStep(2)}
                                className="w-full h-14 mt-4 rounded-xl bg-blue-600 text-white font-bold text-lg"
                            >
                                다음으로 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        )}
                    </div>
                )}


                {/* STEP 2: Profile Setup */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Profile Image */}
                        <div className="flex justify-center">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 bg-slate-50 relative">
                                    {profileImage ? (
                                        <SecureAvatar src={profileImage} alt="Profile" className="w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Camera className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-sm border border-slate-100">
                                    <Camera className="w-3 h-3 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-bold text-slate-700">이름</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="실명 입력"
                                    className="w-full p-3 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">별명</label>
                                <input
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="별명 입력"
                                    className="w-full p-3 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">한 줄 소개</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={2}
                                    placeholder="자기소개를 입력해주세요."
                                    className="w-full p-3 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleFinalSubmit}
                            disabled={loading || !name || !nickname}
                            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "시작하기"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
