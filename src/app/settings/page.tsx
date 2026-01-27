"use client";

import { useState, useEffect, Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WithdrawModal } from "@/components/auth/WithdrawModal";
import { User, Shield, CreditCard, LogOut, ChevronRight, Camera } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
import { PhoneUpdateModal } from "@/components/settings/PhoneUpdateModal";





import { useSearchParams } from "next/navigation";

function PasswordChangeForm({ userPhone }: { userPhone: string }) {
    const [step, setStep] = useState<"verify" | "active">("verify");
    const [isEditing, setIsEditing] = useState(false);

    // Step 1: Verification
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);

    // Step 2: New Password
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCodeSent && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCodeSent, timer]);

    const handleSendVerification = async () => {
        if (!userPhone) {
            alert("등록된 전화번호가 없습니다. 전화번호를 먼저 등록해주세요.");
            return;
        }
        setLoading(true);
        try {
            // Use 'find' type to check existence, or just standard check since we know user has phone
            // We use 'signup' type in verify/send to check duplication, 'find' to check existence.
            // Here we just want to send code to HIS phone. 
            // Let's use 'find' type as it validates existence.
            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone: userPhone, type: 'find' })
            });
            const data = await res.json();

            if (data.success) {
                setIsCodeSent(true);
                setTimer(180);
                alert("인증번호가 발송되었습니다.");
            } else {
                alert(data.error || "발송 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                body: JSON.stringify({ phone: userPhone, code: verificationCode })
            });
            const data = await res.json();

            if (data.success) {
                setStep("active"); // Move to password input
            } else {
                alert(data.error || "인증번호가 올바르지 않습니다.");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            alert("새 비밀번호를 입력해주세요.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (newPassword.length < 6) {
            alert("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            alert("비밀번호가 성공적으로 변경되었습니다.");
            setIsEditing(false);
            setStep("verify");
            setVerificationCode("");
            setIsCodeSent(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            alert("비밀번호 변경 실패: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="text-xs font-bold border-slate-200"
            >
                비밀번호 변경
            </Button>
        );
    }

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in slide-in-from-top-2">
            <div className="space-y-4 max-w-sm">

                {/* Step 1: Verification */}
                {step === "verify" && (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 mb-2">보안을 위해 본인인증이 필요합니다.</p>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">휴대폰 번호</label>
                            <div className="flex gap-2">
                                <input
                                    value={userPhone}
                                    disabled
                                    className="flex-1 p-2.5 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500"
                                />
                                <Button
                                    onClick={handleSendVerification}
                                    disabled={loading || (isCodeSent && timer > 0)}
                                    className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold whitespace-nowrap"
                                >
                                    {loading && !isCodeSent ? "전송 중..." : isCodeSent ? "재전송" : "인증번호 전송"}
                                </Button>
                            </div>
                        </div>

                        {isCodeSent && (
                            <div className="animate-in slide-in-from-top-2">
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="인증번호 6자리"
                                        className="w-full p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium">
                                        {Math.floor(timer / 60)}:{((timer % 60)).toString().padStart(2, '0')}
                                    </span>
                                </div>
                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={loading || !verificationCode}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                >
                                    {loading ? "확인 중..." : "인증번호 확인"}
                                </Button>
                            </div>
                        )}
                        <Button
                            onClick={() => setIsEditing(false)}
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-slate-700 text-xs mt-2"
                        >
                            취소
                        </Button>
                    </div>
                )}

                {/* Step 2: New Password */}
                {step === "active" && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호 입력"
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호 다시 입력"
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUpdatePassword}
                                disabled={loading}
                                className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold"
                            >
                                {loading ? "변경 중..." : "변경하기"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsEditing(false);
                                    setStep("verify");
                                    setVerificationCode("");
                                }}
                                variant="ghost"
                                className="text-slate-500 hover:text-slate-700 text-xs"
                            >
                                취소
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as "profile" | "security" | "billing" | "memories" || "profile";
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "billing" | "memories">(initialTab);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab') as "profile" | "security" | "billing" | "memories";
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const { user, setUser, plan } = useMemoryStore();
    const router = useRouter();
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Profile Edit States
    const [customName, setCustomName] = useState("");
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [phone, setPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
    const [renewalDate, setRenewalDate] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (user) {
            setCustomName(user.name || "");
            const metadata = user.user_metadata || {};
            setNickname(metadata.nickname || "");
            setBio(metadata.bio || "");
            setProfileImage(metadata.avatar_url || "");
            setIsAuthChecking(false);

            // Fetch Phone from Profiles
            const fetchProfile = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from('profiles')
                    .select('phone')
                    .eq('id', user.id)
                    .single();
                if (data?.phone) setPhone(data.phone);
            };
            fetchProfile();
        }
    }, [user]);

    // Removed direct redirect to prevent loops
    // AuthProvider handles main protection

    if (!mounted || isAuthChecking) return <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;

    // Fallback if user is null but auth check passed (rare)
    if (!user) return <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limiting file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            alert("이미지 크기는 2MB 이하여야 합니다.");
            return;
        }

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Storage upload failed:", uploadError);
                alert("이미지 업로드에 실패했습니다. (스토리지 버킷 설정을 확인해주세요)");
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setProfileImage(publicUrl);
        } catch (error) {
            console.error(error);
            alert("이미지 업로드 중 오류가 발생했습니다.");
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        const supabase = createClient();

        try {
            const updates = {
                name: customName, // Allow updating display name in metadata
                nickname: nickname,
                bio: bio,
                avatar_url: profileImage
            };

            // 1. Update Auth Metadata (Backup / Session)
            const { error: authError } = await supabase.auth.updateUser({
                data: updates
            });

            if (authError) throw authError;

            // 2. Update Public Profiles Table (Persistence)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: customName,
                    nickname: nickname,
                    avatar_url: profileImage,
                    phone: phone, // Save Phone
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            await supabase.auth.refreshSession();

            // Update local store
            setUser({
                ...user,
                name: customName,
                image: profileImage, // Force update local image
                user_metadata: {
                    ...user.user_metadata,
                    ...updates
                }
            });

            alert("프로필이 업데이트되었습니다.");
        } catch (error: any) {
            console.error(error);
            alert(`저장에 실패했습니다: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
            router.push("/");
            // Force a small delay to ensure state clears if needed, though router.push is immediate
        } catch (error) {
            console.error("Logout failed", error);
            // Fallback
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="flex max-w-7xl mx-auto pt-24 min-h-[calc(100vh-80px)]">
                {/* Left Sidebar (Notion Style) */}
                <aside className="w-64 flex-shrink-0 px-4 py-8 border-r border-slate-100 hidden md:block">
                    <div className="mb-6 px-3">
                        <p className="text-xs font-bold text-slate-400 mb-2">계정</p>
                        <div className="flex items-center gap-3 mb-6">
                            {user.image || user.user_metadata?.avatar_url ? (
                                <SecureAvatar
                                    src={user.image || user.user_metadata?.avatar_url}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-md"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                    {user.name?.[0] || "U"}
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === "profile"
                                ? "bg-slate-100 text-slate-900 font-bold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            내 정보
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === "security"
                                ? "bg-slate-100 text-slate-900 font-bold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Shield className="w-4 h-4" />
                            계정 설정
                        </button>
                        <button
                            onClick={() => setActiveTab("billing")}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === "billing"
                                ? "bg-slate-100 text-slate-900 font-bold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <CreditCard className="w-4 h-4" />
                            멤버십
                        </button>

                        <div className="border-t border-slate-100 my-2 pt-2">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="w-4 h-4" />
                                로그아웃
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Right Content Area */}
                <main className="flex-1 px-8 py-8 md:px-12">
                    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* 1. Profile Tab */}
                        {activeTab === "profile" && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">내 정보</h2>
                                <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                                    프로필 사진과 개인 정보를 수정할 수 있습니다.
                                </p>

                                <div className="grid gap-8">
                                    {/* Profile Image - Horizontal Layout */}
                                    <div className="flex items-start gap-8">
                                        <div className="w-24 flex-shrink-0">
                                            <span className="text-sm font-bold text-slate-700">프로필 사진</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-6">
                                                <div className="relative group">
                                                    <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-50 relative">
                                                        {profileImage ? (
                                                            <SecureAvatar
                                                                src={profileImage}
                                                                alt="Profile"
                                                                className="w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-2xl">
                                                                {customName?.[0] || "U"}
                                                            </div>
                                                        )}
                                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                            <Camera className="w-5 h-5 text-white" />
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setProfileImage("https://api.dicebear.com/9.x/adventurer/svg?seed=Felix")} className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors">남자 캐릭터</button>
                                                    <button onClick={() => setProfileImage("https://api.dicebear.com/9.x/adventurer/svg?seed=Lisa")} className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors">여자 캐릭터</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    {/* Fields */}
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
                                            <label className="w-24 pt-3 text-sm font-bold text-slate-700">이름</label>
                                            <input
                                                type="text"
                                                value={customName}
                                                onChange={(e) => setCustomName(e.target.value)}
                                                className="flex-1 p-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
                                            <label className="w-24 pt-3 text-sm font-bold text-slate-700">전화번호</label>
                                            <div className="flex-1">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        disabled
                                                        className="flex-1 p-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                                                        placeholder="등록된 전화번호 없음"
                                                    />
                                                    <Button
                                                        onClick={() => setIsPhoneModalOpen(true)}
                                                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 rounded-lg text-xs"
                                                    >
                                                        {phone ? "번호 변경" : "번호 등록"}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    * 생존 확인(Dead Man's Switch) 기능을 위해 본인 명의 휴대폰 번호가 필요합니다.<br />
                                                    * 수신인 인증 시, 이 번호로 인증번호가 발송됩니다.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
                                            <label className="w-24 pt-3 text-sm font-bold text-slate-700">별명</label>
                                            <input
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                className="flex-1 p-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                placeholder="별명을 입력하세요"
                                            />
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
                                            <label className="w-24 pt-3 text-sm font-bold text-slate-700">소개</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={3}
                                                className="flex-1 p-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                                placeholder="자기소개를 간단히 남겨주세요."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-lg text-sm">
                                            {isSaving ? "저장 중..." : "변경사항 저장"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Security Tab */}
                        {activeTab === "security" && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">계정 설정</h2>
                                <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                                    계정 보안 및 로그인 관련 설정을 관리합니다.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between py-4 border-b border-slate-50">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">이메일</h3>
                                            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Password Change Section (Local Users Only) */}
                                    {user.app_metadata?.provider === 'email' && (
                                        <div className="py-4 border-b border-slate-50">
                                            <h3 className="font-bold text-slate-900 text-sm mb-4">비밀번호 변경</h3>
                                            <PasswordChangeForm userPhone={phone} />
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-4 text-red-600">위험 구역</h3>
                                        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-red-700 text-sm">회원 탈퇴</h4>
                                                    <p className="text-xs text-red-500 mt-1">계정을 영구적으로 삭제하거나 비활성화합니다.</p>
                                                </div>
                                                <Button
                                                    onClick={() => setIsWithdrawModalOpen(true)}
                                                    variant="ghost"
                                                    className="text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold"
                                                >
                                                    탈퇴하기
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Billing Tab */}
                        {activeTab === "billing" && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">멤버십</h2>
                                <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                                    현재 이용 중인 플랜을 확인하고 관리합니다.
                                </p>

                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium mb-1">현재 플랜</p>
                                            <h3 className="text-2xl font-bold text-slate-900">
                                                {plan === 'pro' ? 'PRO Plan' : 'Free Plan'}
                                            </h3>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {plan === 'pro' ? 'Active' : 'Basic'}
                                        </div>
                                    </div>
                                    {plan === 'pro' && renewalDate && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-900">
                                                <span className="font-semibold">다음 갱신일:</span> {new Date(renewalDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                    <Link href="/plans" className="w-full">
                                        <div
                                            className="w-full h-10 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 text-sm flex items-center justify-center cursor-pointer transition-colors"
                                        >
                                            플랜 업그레이드 / 관리
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />

            <PhoneUpdateModal
                isOpen={isPhoneModalOpen}
                onClose={() => setIsPhoneModalOpen(false)}
                currentEmail={user.email || ""}
                onSuccess={(newPhone) => setPhone(newPhone)}
            />
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>}>
            <SettingsContent />
        </Suspense>
    );
}
