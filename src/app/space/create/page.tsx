"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";

function CreateForm() {
    const router = useRouter();
    const supabase = createClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
            .from('user_uploads')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('user_uploads')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            // 1. Create Space First (to get ID for folder structure, or just use temp folder? 
            // Actually, better to use user ID or specific 'memorial_assets' path)
            // Let's create space first to get ID.

            // Wait, we can generate a UUID client side or just use generic folder. 
            // Let's use 'memorial-assets' folder.

            let profileUrl = "";
            let bgUrl = "";

            if (profileFile) {
                profileUrl = await uploadFile(profileFile, `profiles/${user.id}`);
            }

            if (bgFile) {
                bgUrl = await uploadFile(bgFile, `backgrounds/${user.id}`);
            }

            // Create Memorial Space
            const { data, error } = await supabase
                .from("memorial_spaces")
                .insert({
                    owner_id: user.id,
                    title,
                    description,
                    is_public: false,
                    theme: {
                        color: 'blue',
                        profileImage: profileUrl,
                        backgroundImage: bgUrl
                    }
                })
                .select()
                .single();

            if (error) throw error;

            // Add self as Host
            if (data) {
                await supabase
                    .from("space_members")
                    .insert({
                        space_id: data.id,
                        user_id: user.id,
                        role: 'host',
                        status: 'active'
                    });

                router.push(`/space/${data.id}`);
                router.refresh();
            }

        } catch (error) {
            console.error("Error creating space:", error);
            alert("공간 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header omitted for brevity, keeping existing */}
            <header className="fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden">
                <div className="flex items-center justify-between h-14 px-4">
                    <Link href="/space" className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-slate-900 text-sm">기억 공간 만들기</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-20 md:py-20">
                <div className="text-center mb-10 space-y-2">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        새로운 추모 공간
                    </h1>
                    <p className="text-slate-500 text-sm">
                        지금 바로 소중한 사람을 위한 추억의 공간을 만들어보세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">공간 이름 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: 사랑하는 OOO을 기억하며"
                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300 font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">소개글</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="이 공간에 대한 짧은 소개를 남겨주세요."
                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[120px] resize-none placeholder:text-slate-300 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 block">대표 사진</label>
                            <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
                                />
                                {profileFile ? (
                                    <img src={URL.createObjectURL(profileFile)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Sparkles size={18} />
                                        </div>
                                        <span className="text-xs font-medium">사진 업로드</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 block">배경 사진</label>
                            <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setBgFile(e.target.files?.[0] || null)}
                                />
                                {bgFile ? (
                                    <img src={URL.createObjectURL(bgFile)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Sparkles size={18} />
                                        </div>
                                        <span className="text-xs font-medium">배경 업로드</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="w-full py-7 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-200 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "공간 생성 완료"}
                    </Button>
                </form>
            </main>
        </div>
    );
}

// Wrap in Suspense to avoid de-opt
export default function CreateSpacePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateForm />
        </Suspense>
    );
}
