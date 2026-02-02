"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Heart } from "lucide-react";

export default function CreateSpace() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        bio: ''
    });
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!formData.name || !formData.handle) {
            alert('이름과 핸들을 입력해주세요');
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const { data, error } = await supabase
            .from('spaces')
            .insert({
                owner_id: user.id,
                handle: formData.handle.toLowerCase(),
                name: formData.name,
                bio: formData.bio,
                space_type: 'memorial'
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            alert('생성 실패: ' + error.message);
        } else {
            router.push(`/space/${data.handle}`);
        }
    };

    return (
        <div className="max-w-[430px] mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[16px] font-bold">새 기억공간 만들기</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {/* Memorial Type Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-6 h-6 text-blue-600" />
                        <h2 className="text-[15px] font-bold text-gray-900">기억공간</h2>
                    </div>
                    <p className="text-[13px] text-gray-600">
                        소중한 사람을 기억하고 추모하는 공간입니다
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">이름 *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="사랑하는 엄마"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">핸들 (@username) *</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] text-gray-400">@</span>
                            <input
                                type="text"
                                value={formData.handle}
                                onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase() })}
                                className="flex-1 px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="memorial_mom"
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            한 번 설정하면 변경할 수 없습니다
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">소개</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            placeholder="이 공간에 대해 소개해주세요"
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? '생성 중...' : '기억공간 만들기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
