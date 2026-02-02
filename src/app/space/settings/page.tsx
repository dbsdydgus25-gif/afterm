"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, LogOut, Trash2, Share2, Copy, Check, Upload } from "lucide-react";

function SpaceSettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const spaceId = searchParams.get('space_id'); // Get space_id from URL

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [space, setSpace] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        bio: '',
        avatar: null as File | null
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchSpace = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // If space_id provided, fetch that space, otherwise fetch personal space
            let query = supabase.from('spaces').select('*').eq('owner_id', user.id);

            if (spaceId) {
                query = query.eq('id', spaceId);
            } else {
                query = query.eq('space_type', 'personal');
            }

            const { data: spaceData } = await query.single();

            if (spaceData) {
                setSpace(spaceData);
                setFormData({
                    name: spaceData.name || '',
                    handle: spaceData.handle || '',
                    bio: spaceData.bio || '',
                    avatar: null
                });
                setAvatarPreview(spaceData.avatar_url || null);
            }
            setLoading(false);
        };

        fetchSpace();
    }, [router, spaceId]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, avatar: file });
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();

        let avatarUrl = space.avatar_url;

        // Upload avatar if changed
        if (formData.avatar) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const fileExt = formData.avatar.name.split('.').pop();
                const fileName = `${user.id}-${space.handle}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, formData.avatar);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    avatarUrl = publicUrl;
                }
            }
        }

        const { error } = await supabase
            .from('spaces')
            .update({
                name: formData.name,
                bio: formData.bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', space.id);

        if (error) {
            alert('저장 실패: ' + error.message);
        } else {
            alert('저장되었습니다!');
            router.push(`/space/${space.handle}`);
        }
        setSaving(false);
    };

    const handleShare = () => {
        const url = `https://afterm.co.kr/space/${space.handle}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleDeleteSpace = async () => {
        if (space.space_type === 'personal') {
            alert('내 공간은 삭제할 수 없습니다');
            return;
        }

        if (!confirm('정말 이 공간을 삭제하시겠습니까?')) return;

        const supabase = createClient();
        await supabase.from('spaces').delete().eq('id', space.id);
        router.push('/space');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) return;

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('spaces').delete().eq('owner_id', user.id);
            await supabase.auth.signOut();
        }
        router.push('/');
    };

    if (loading) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
                <div className="text-[12px] text-gray-400">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="max-w-[430px] mx-auto min-h-screen bg-white">
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[14px] font-bold">
                        {space?.space_type === 'personal' ? '내 공간 설정' : '기억공간 설정'}
                    </h1>
                </div>
            </div>

            <div className="px-4 py-4 space-y-5">
                {/* Profile Edit */}
                <div className="space-y-3">
                    <h2 className="text-[13px] font-bold text-gray-900">프로필</h2>

                    {/* Avatar */}
                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">프로필 이미지</label>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    formData.name[0] || '?'
                                )}
                            </div>
                            <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-medium cursor-pointer flex items-center gap-1.5 transition-colors">
                                <Upload className="w-3 h-3" />
                                이미지 변경
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">이름</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="홍길동"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">핸들 (@username)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-gray-400">@</span>
                            <input
                                type="text"
                                value={formData.handle}
                                disabled
                                className="flex-1 px-3 py-2 text-[12px] border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                                placeholder="username"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                            핸들은 변경할 수 없습니다 (고유 ID)
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">소개</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            placeholder="나를 소개해보세요"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? '저장 중...' : '저장하기'}
                    </button>
                </div>

                {/* Share Profile */}
                <div className="border-t border-gray-100 pt-4">
                    <h2 className="text-[13px] font-bold text-gray-900 mb-2">공유</h2>

                    <button
                        onClick={handleShare}
                        className="w-full text-left px-3 py-2.5 text-[12px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                            {copied ? '복사됨!' : '프로필 공유하기'}
                        </span>
                        {!copied && <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* Account Actions */}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                    <h2 className="text-[13px] font-bold text-gray-900">계정</h2>

                    {space?.space_type !== 'personal' && (
                        <button
                            onClick={handleDeleteSpace}
                            className="w-full text-left px-3 py-2.5 text-[12px] font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            이 공간 삭제
                        </button>
                    )}

                    {space?.space_type === 'personal' && (
                        <>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                로그아웃
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="w-full text-left px-3 py-2.5 text-[12px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                계정 삭제
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SpaceSettings() {
    return (
        <Suspense fallback={
            <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
                <div className="text-[12px] text-gray-400">로딩 중...</div>
            </div>
        }>
            <SpaceSettingsContent />
        </Suspense>
    );
}
