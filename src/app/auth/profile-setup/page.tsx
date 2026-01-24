"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, Loader2 } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";

export default function ProfileSetupPage() {
    const router = useRouter();
    const { user, setUser } = useMemoryStore();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile fields
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState("");

    useEffect(() => {
        setMounted(true);
        if (user) {
            // Pre-fill from existing data
            setName(user.user_metadata?.full_name || user.name || "");
            setNickname(user.user_metadata?.nickname || "");
            setProfileImage(user.user_metadata?.avatar_url || user.image || "");
            setBio(user.user_metadata?.bio || "");
        }
    }, [user]);

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

    const handleSubmit = async () => {
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

            // Redirect to home
            router.replace("/");
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
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.replace("/login");
                    }}
                    className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">
                        프로필 설정
                    </h1>
                    <p className="text-sm text-slate-500">
                        사용하실 프로필 정보를 입력해주세요.
                    </p>
                </div>

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
                            <label className="text-sm font-bold text-slate-700">이름 <span className="text-red-500">*</span></label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="실명 입력"
                                className="w-full p-3 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">별명 <span className="text-red-500">*</span></label>
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
                        onClick={handleSubmit}
                        disabled={loading || !name || !nickname}
                        className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "시작하기"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
