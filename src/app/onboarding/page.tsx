"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";



export default function OnboardingPage() {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [mounted, setMounted] = useState(false);

    // Steps: 1 = Verification, 2 = Profile
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

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

            // Determine Starting Step
            let startStep = 1; // Default to Verification

            const isPhoneVerified = (user.user_metadata as any)?.phone_verified || (typeof window !== 'undefined' && sessionStorage.getItem('auth_verified') === 'true');

            if (isPhoneVerified) {
                startStep = 2; // Skip to Profile if verified
            }

            // Allow manual override via query param ?step=
            const params = new URLSearchParams(window.location.search);
            const queryStep = params.get("step");
            if (queryStep) {
                const s = parseInt(queryStep);
                // Map old step 3 to new step 2 for compatibility if needed, or just rely on new logic
                setStep(s > 2 ? 2 : s);
            } else {
                setStep(startStep);
            }
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

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pt-28 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 relative overflow-hidden">
                {/* Back Button */}
                <button
                    onClick={async () => {
                        // Intelligent Back Logic
                        if (step === 2) {
                            setStep(1);
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
                    {[1, 2].map((s) => (
                        <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? "bg-blue-600" : "bg-slate-200"}`} />
                    ))}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">
                        {step === 1 && "본인 확인"}
                        {step === 2 && "프로필 설정"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {step === 1 && "본인 명의의 휴대폰으로 인증해주세요."}
                        {step === 2 && "사용하실 프로필 정보를 입력해주세요."}
                    </p>
                </div>

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
