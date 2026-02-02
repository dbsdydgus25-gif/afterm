"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Heart, AlertCircle, Upload } from "lucide-react";

export default function CreateSpace() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        bio: '',
        avatar: null as File | null
    });
    const [loading, setLoading] = useState(false);
    const [handleError, setHandleError] = useState('');
    const [checkingHandle, setCheckingHandle] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const validateHandle = (handle: string) => {
        if (!handle) return '';
        const validFormat = /^[a-zA-Z0-9._]+$/.test(handle);
        if (!validFormat) return '영문, 숫자, . 그리고 _ 만 사용 가능합니다';
        if (handle.length < 3) return '최소 3자 이상이어야 합니다';
        return '';
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

    const checkHandleAvailability = async (handle: string) => {
        if (!handle || validateHandle(handle)) return;
        setCheckingHandle(true);
        const supabase = createClient();
        const { data } = await supabase.from('spaces').select('id').eq('handle', handle.toLowerCase()).single();
        setHandleError(data ? '이미 사용 중인 핸들입니다' : '');
        setCheckingHandle(false);
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.handle) {
            alert('이름과 핸들을 입력해주세요');
            return;
        }
        if (handleError || checkingHandle) {
            alert('유효한 핸들을 입력해주세요');
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        let avatarUrl = null;
        if (formData.avatar) {
            const fileExt = formData.avatar.name.split('.').pop();
            const fileName = `${user.id}-${formData.handle}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, formData.avatar);
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = publicUrl;
            }
        }

        const { data, error } = await supabase.from('spaces').insert({
            owner_id: user.id,
            handle: formData.handle.toLowerCase(),
            name: formData.name,
            bio: formData.bio,
            space_type: 'memorial',
            avatar_url: avatarUrl
        }).select().single();

        setLoading(false);
        if (error) {
            if (error.code === '23505') setHandleError('이미 사용 중인 핸들입니다');
            else alert('생성 실패: ' + error.message);
        } else {
            router.push(`/space/${data.handle}`);
        }
    };

    return (
        <div className="max-w-[430px] mx-auto min-h-screen bg-white">
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[14px] font-bold">새 기억공간 만들기</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4 text-blue-600" />
                        <h2 className="text-[13px] font-bold text-gray-900">기억공간</h2>
                    </div>
                    <p className="text-[11px] text-gray-600">소중한 사람을 기억하고 추모하는 공간입니다</p>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] text-gray-500 font-medium">프로필 이미지</label>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (formData.name[0] || '?')}
                        </div>
                        <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-medium cursor-pointer flex items-center gap-1.5 transition-colors">
                            <Upload className="w-3 h-3" />
                            이미지 업로드
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">이름 *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="사랑하는 엄마"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">핸들 (@username) *</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-gray-400">@</span>
                            <input
                                type="text"
                                value={formData.handle}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
                                    setFormData({ ...formData, handle: value });
                                    if (value.length >= 3) checkHandleAvailability(value);
                                }}
                                className={`flex-1 px-3 py-2 text-[12px] border rounded-lg focus:outline-none focus:ring-2 ${handleError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                                    }`}
                                placeholder="memorial_mom"
                            />
                        </div>
                        <div className="min-h-[12px]">
                            {handleError ? (
                                <div className="flex items-center gap-1 text-red-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <p className="text-[10px]">{handleError}</p>
                                </div>
                            ) : checkingHandle ? (
                                <p className="text-[10px] text-gray-400">확인 중...</p>
                            ) : formData.handle && !handleError ? (
                                <p className="text-[10px] text-green-600">✓ 사용 가능</p>
                            ) : (
                                <p className="text-[10px] text-gray-400">영문, 숫자, . _ 만 (변경 불가)</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] text-gray-500 font-medium">소개</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            placeholder="이 공간에 대해 소개해주세요"
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading || !!handleError || checkingHandle || !formData.name || !formData.handle}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? '생성 중...' : '기억공간 만들기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
