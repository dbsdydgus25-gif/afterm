"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, LogOut, Trash2, Share2, Copy, Check, Upload, Plus, Edit2, Heart } from "lucide-react";

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'profile';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [personalSpace, setPersonalSpace] = useState<any>(null);
    const [memorialSpaces, setMemorialSpaces] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        bio: '',
        avatar: null as File | null
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            router.push('/login');
            return;
        }

        setUser(authUser);

        // Get personal space
        const { data: personal } = await supabase
            .from('spaces')
            .select('*')
            .eq('owner_id', authUser.id)
            .eq('space_type', 'personal')
            .single();

        if (personal) {
            setPersonalSpace(personal);
            setFormData({
                name: personal.name || '',
                handle: personal.handle || '',
                bio: personal.bio || '',
                avatar: null
            });
            setAvatarPreview(personal.avatar_url || null);
        }

        // Get memorial spaces
        const { data: memorials } = await supabase
            .from('spaces')
            .select('*')
            .eq('owner_id', authUser.id)
            .eq('space_type', 'memorial')
            .order('created_at', { ascending: false });

        setMemorialSpaces(memorials || []);
        setLoading(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, avatar: file });
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!personalSpace) return;

        setSaving(true);
        const supabase = createClient();

        let avatarUrl = personalSpace.avatar_url;

        if (formData.avatar) {
            const fileExt = formData.avatar.name.split('.').pop();
            const fileName = `${user.id}-${personalSpace.handle}-${Date.now()}.${fileExt}`;

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

        const { error } = await supabase
            .from('spaces')
            .update({
                name: formData.name,
                bio: formData.bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', personalSpace.id);

        if (error) {
            alert('저장 실패: ' + error.message);
        } else {
            alert('저장되었습니다!');
            fetchData();
        }
        setSaving(false);
    };

    const handleShare = () => {
        if (!personalSpace) return;
        const url = `https://afterm.co.kr/space/${personalSpace.handle}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) return;

        const supabase = createClient();
        await supabase.from('spaces').delete().eq('owner_id', user.id);
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleDeletePage = async (pageId: string) => {
        if (!confirm('이 페이지를 삭제하시겠습니까?')) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('spaces')
            .delete()
            .eq('id', pageId);

        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            fetchData();
        }
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
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[14px] font-bold">설정</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2.5 text-[12px] font-medium transition-colors ${activeTab === 'profile'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                            }`}
                    >
                        프로필
                    </button>
                    <button
                        onClick={() => setActiveTab('pages')}
                        className={`flex-1 py-2.5 text-[12px] font-medium transition-colors ${activeTab === 'pages'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                            }`}
                    >
                        페이지
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2.5 text-[12px] font-medium transition-colors ${activeTab === 'settings'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                            }`}
                    >
                        계정
                    </button>
                </div>
            </div>

            <div className="px-4 py-4">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-3">
                        <h2 className="text-[13px] font-bold text-gray-900">프로필 편집</h2>

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
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
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
                                placeholder="이름"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] text-gray-500 font-medium">핸들</label>
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] text-gray-400">@</span>
                                <input
                                    type="text"
                                    value={formData.handle}
                                    disabled
                                    className="flex-1 px-3 py-2 text-[12px] border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400">핸들은 변경할 수 없습니다</p>
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
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? '저장 중...' : '저장하기'}
                        </button>

                        <div className="border-t pt-3 mt-3">
                            <button
                                onClick={handleShare}
                                className="w-full text-left px-3 py-2.5 text-[12px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                                    {copied ? '복사됨!' : '프로필 공유'}
                                </span>
                                {!copied && <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Pages Tab */}
                {activeTab === 'pages' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[13px] font-bold text-gray-900">내 페이지</h2>
                            <button
                                onClick={() => router.push('/space/create')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                새 페이지
                            </button>
                        </div>

                        {memorialSpaces.length === 0 ? (
                            <div className="text-center py-8">
                                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-[12px] text-gray-500 mb-1">아직 페이지가 없습니다</p>
                                <p className="text-[10px] text-gray-400">소중한 사람을 기억하는 페이지를 만들어보세요</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {memorialSpaces.map((space) => (
                                    <div
                                        key={space.id}
                                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0 overflow-hidden">
                                                {space.avatar_url ? (
                                                    <img src={space.avatar_url} alt={space.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    space.name[0]
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[13px] font-semibold text-gray-900 truncate">{space.name}</h3>
                                                <p className="text-[11px] text-gray-500">@{space.handle}</p>
                                                {space.bio && (
                                                    <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">{space.bio}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => router.push(`/space/settings?tab=pages&edit=${space.id}`)}
                                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePage(space.id)}
                                                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-3">
                        <h2 className="text-[13px] font-bold text-gray-900">계정 설정</h2>

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
                    </div>
                )}
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
            <SettingsContent />
        </Suspense>
    );
}
