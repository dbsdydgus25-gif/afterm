"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";

export default function OnboardingPage() {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [mounted, setMounted] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [profileImage, setProfileImage] = useState("");

    // Verification States
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [timer, setTimer] = useState(0);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            // Pre-fill if available
            setName(user.user_metadata?.full_name || user.name || "");
            setNickname(user.user_metadata?.nickname || "");
            setBio(user.user_metadata?.bio || "");
            const metaPhone = user.user_metadata?.phone || "";
            if (metaPhone) {
                setPhone(metaPhone.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`));
            }
            setProfileImage(user.user_metadata?.avatar_url || user.image || "");
        }
    }, [user]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCodeSent && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        } else if (timer === 0) {
            // clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isCodeSent, timer]);

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
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Storage upload failed:", uploadError);
                alert("이미지 업로드에 실패했습니다. (기본 이미지를 사용하거나 나중에 다시 시도해주세요)");
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setProfileImage(publicUrl);
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleSendVerification = async () => {
        if (!phone || phone.length < 10) {
            alert("올바른 휴대폰 번호를 입력해주세요.");
            return;
        }

        try {
            // Reset verification state if retrying
            setIsVerified(false);
            setVerificationCode("");

            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone })
            });
            const data = await res.json();

            if (data.success) {
                setIsCodeSent(true);
                setTimer(180); // 3 minutes
                alert("인증번호가 발송되었습니다.");
            } else {
                alert("발송 실패: " + data.error);
            }
        } catch (error) {
            console.error(error);
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
                setIsCodeSent(false); // Hide input or keep it showing verified status
                alert("인증이 완료되었습니다!");
            } else {
                alert("인증번호가 올바르지 않거나 만료되었습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("인증 확인 중 오류가 발생했습니다.");
        }
    };

    const handleComplete = async () => {
        if (!name.trim()) {
            alert("이름을 입력해주세요.");
            return;
        }
        if (!nickname.trim()) {
            alert("별명을 입력해주세요.");
            return;
        }
        if (!phone.trim()) {
            alert("휴대폰 번호를 입력해주세요.");
            return;
        }
        if (!isVerified) {
            alert("휴대폰 인증을 완료해주세요.");
            return;
        }

        if (!user) {
            alert("로그인 세션을 찾을 수 없습니다. 페이지를 새로고침 해주세요.");
            return;
        }
        setIsSaving(true);
        const supabase = createClient();

        try {
            const updates = {
                full_name: name,
                name: name,
                nickname: nickname,
                bio: bio,
                phone: phone.replace(/-/g, ''), // Save plain number
                avatar_url: profileImage,
                onboarding_completed: true
            };

            // 1. Insert/Update Public Profiles Table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: name,
                    nickname: nickname,
                    avatar_url: profileImage,
                    bio: bio,
                    phone: phone.replace(/-/g, ''),
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error("Profile save error:", profileError);
                throw new Error("프로필 저장에 실패했습니다.");
            }

            // 2. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: updates
            });

            if (authError) console.error("Auth metadata update failed:", authError);

            // 3. Send Welcome Email ONLY (New Requirement)
            try {
                const email = user.email;
                if (email) {
                    await fetch('/api/email/welcome', {
                        method: 'POST',
                        body: JSON.stringify({ email, name })
                    });
                }
            } catch (emailError) {
                console.error("Welcome email failed:", emailError);
            }

            // Force session refresh
            await supabase.auth.refreshSession();

            // Update local store
            setUser({
                ...user,
                name: name,
                image: profileImage,
                user_metadata: {
                    ...user.user_metadata,
                    ...updates
                }
            });

            router.replace("/dashboard");
        } catch (error: any) {
            console.error(error);
            alert(`저장에 실패했습니다: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500 relative">
                {/* Back/Logout Button */}
                <button
                    onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.replace("/login");
                    }}
                    className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                    aria-label="Go back to login"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="text-center mb-10 pt-4">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">환영합니다! 👋</h1>
                    <p className="text-slate-500">
                        서비스를 이용하기 전,<br />간단한 본인확인을 진행해주세요.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Profile Image */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 relative shadow-sm">
                                {profileImage ? (
                                    <SecureAvatar
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 font-bold text-3xl">
                                        {name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Default Avatars */}
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setProfileImage("https://api.dicebear.com/9.x/adventurer/svg?seed=Felix")} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors">👦 남성</button>
                        <button onClick={() => setProfileImage("https://api.dicebear.com/9.x/adventurer/svg?seed=Lisa")} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors">👧 여성</button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">이름 <span className="text-blue-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="실명을 입력하세요"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">별명 <span className="text-blue-500">*</span></label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="사용하실 별명을 입력하세요"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                            />
                        </div>

                        {/* Phone Verification Section */}
                        {/* Phone Verification Section */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">휴대폰 번호 <span className="text-blue-500">*</span></label>
                            <div className="flex gap-2 items-stretch">
                                <div className="relative flex-1">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                        placeholder="010-0000-0000"
                                        maxLength={13}
                                        disabled={isVerified}
                                        className="w-full h-12 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                </div>
                                <Button
                                    onClick={handleSendVerification}
                                    disabled={isVerified || (isCodeSent && timer > 0)}
                                    variant={isCodeSent ? "outline" : "default"}
                                    className={`h-12 whitespace-nowrap rounded-xl font-bold px-4 transition-all ${isCodeSent
                                            ? "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            : "bg-slate-800 hover:bg-slate-900 text-white"
                                        }`}
                                >
                                    {isVerified ? "인증완료" : isCodeSent ? "재전송" : "인증번호"}
                                </Button>
                            </div>

                            {/* Verification Code Input */}
                            {isCodeSent && !isVerified && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2 items-stretch">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                placeholder="인증번호 6자리"
                                                maxLength={6}
                                                className="w-full h-12 p-4 pr-16 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900 bg-blue-50/30"
                                            />
                                            {/* Timer inside input */}
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600Tab">
                                                {Math.floor(timer / 60)}:{((timer % 60)).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={handleConfirmVerification}
                                            className="h-12 whitespace-nowrap rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-500/20"
                                        >
                                            확인
                                        </Button>
                                    </div>
                                    <p className="text-xs text-blue-500 mt-2 ml-1">
                                        * 인증번호가 발송되었습니다. 3분 내에 입력해주세요.
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-slate-400 mt-1 pl-1">
                                {isVerified ? "✅ 휴대폰 인증이 완료되었습니다." : !isCodeSent && "본인 확인을 위해 휴대폰 인증이 필요합니다."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">한 줄 소개 <span className="text-slate-400 font-normal">(선택)</span></label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={2}
                                placeholder="자신을 소개하는 한 마디"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900 resize-none"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleComplete}
                        disabled={isSaving || !isVerified}
                        className="w-full h-14 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                    >
                        {isSaving ? "설정 저장 중..." : "시작하기"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
