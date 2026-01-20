"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WithdrawModal } from "@/components/auth/WithdrawModal";
import { User, Shield, CreditCard, LogOut, ChevronRight, Camera } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "billing">("profile");
    const { user, setUser, plan } = useMemoryStore();
    const router = useRouter();
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Profile Edit States
    const [customName, setCustomName] = useState("");
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            setCustomName(user.name || "");
            // Initialize other fields from metadata if available (assuming user object has them or we fetch them)
            // For now, we will rely on what's in user object or empty strings
            // Ideally user object in store should be updated with metadata
            const metadata = user.user_metadata || {};
            setNickname(metadata.nickname || "");
            setBio(metadata.bio || "");
            setProfileImage(metadata.avatar_url || "");
        }
    }, [user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limiting file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            alert("이미지 크기는 2MB 이하여야 합니다.");
            return;
        }

        // For MVP, we can Convert to Base64 to store in metadata (Not recommended for large apps but fine for MVP/Soft Delete context if small)
        // OR better: Upload to Supabase Storage 'avatars' bucket.
        // Let's try Supabase Storage first.
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                // Fallback: If storage not set up, just use base64 for small preview or alert
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

            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;

            // Update local store
            setUser({
                ...user,
                name: customName,
                user_metadata: {
                    ...user.user_metadata,
                    ...updates
                }
            });

            alert("프로필이 저장되었습니다.");
        } catch (error) {
            console.error(error);
            alert("프로필 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    if (!mounted) return null;

    if (!user) {
        router.push("/login"); // Redirect if not logged in
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">설정</h1>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-10 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`pb-4 px-1 min-w-[100px] text-sm font-bold border-b-2 transition-colors mr-8 ${activeTab === "profile"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        프로필 편집
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`pb-4 px-1 min-w-[100px] text-sm font-bold border-b-2 transition-colors mr-8 ${activeTab === "security"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        계정 및 보안
                    </button>
                    <button
                        onClick={() => setActiveTab("billing")}
                        className={`pb-4 px-1 min-w-[100px] text-sm font-bold border-b-2 transition-colors ${activeTab === "billing"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        결제 및 멤버십
                    </button>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* 1. Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="max-w-xl animate-in fade-in duration-500">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">프로필 편집</h2>

                            <div className="space-y-8">
                                {/* Profile Image Section */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-4">프로필 사진</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 relative">
                                                {/* Image Preview */}
                                                {profileImage ? (
                                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold text-3xl">
                                                        {customName?.[0] || "U"}
                                                    </div>
                                                )}

                                                {/* Upload Overlay */}
                                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <Camera className="w-6 h-6 text-white" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setProfileImage("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix")}
                                                className="w-12 h-12 rounded-full border-2 border-slate-100 hover:border-blue-500 transition-all overflow-hidden bg-slate-50"
                                                title="기본 남성 아이콘"
                                            >
                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Male" />
                                            </button>
                                            <button
                                                onClick={() => setProfileImage("https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka")}
                                                className="w-12 h-12 rounded-full border-2 border-slate-100 hover:border-blue-500 transition-all overflow-hidden bg-slate-50"
                                                title="기본 여성 아이콘"
                                            >
                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="Female" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">이름</label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder="이름을 입력하세요"
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-slate-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">별명 (Nickname)</label>
                                        <input
                                            type="text"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            placeholder="별명을 입력하세요"
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-slate-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">한 줄 소개</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="자신을 소개하는 한 마디를 남겨주세요."
                                            rows={3}
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-slate-900 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="rounded-xl px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        {isSaving ? "저장 중..." : "변경 사항 저장"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Security Tab */}
                    {activeTab === "security" && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">계정 및 보안</h2>

                            <div className="space-y-8">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">로그인 계정</h3>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-8">
                                    <h3 className="font-bold text-slate-900 mb-4">계정 관리</h3>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group mb-2"
                                    >
                                        <span className="font-medium text-slate-600 group-hover:text-slate-900">로그아웃</span>
                                        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                    </button>

                                    <button
                                        onClick={() => setIsWithdrawModalOpen(true)}
                                        className="w-full text-left p-4 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-red-600">회원 탈퇴</span>
                                            <span className="text-xs text-red-400 mt-0.5">계정과 모든 데이터를 영구적으로 삭제합니다.</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-red-200 group-hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Billing Tab */}
                    {activeTab === "billing" && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">결제 및 멤버십</h2>

                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">현재 멤버십</p>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {plan === 'pro' ? 'PRO Plan' : 'Basic Plan'}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${plan === 'pro'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {plan === 'pro' ? 'Active' : 'Free'}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => router.push("/plans")}
                                    className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                                >
                                    멤버십 관리 / 업그레이드
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
        </div>
    );
}
