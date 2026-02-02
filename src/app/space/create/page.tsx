"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Heart } from "lucide-react";

export default function CreateSpace() {
    const router = useRouter();
    const [spaceType, setSpaceType] = useState<'personal' | 'memorial'>('personal');
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
                space_type: spaceType
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
                    <h1 className="text-[16px] font-bold">새 공간 만들기</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {/* Space Type */}
                <div className="space-y-3">
                    <h2 className="text-[14px] font-bold text-gray-900">공간 유형</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setSpaceType('personal')}
                            className={`p-4 rounded-lg border-2 transition-all ${spaceType === 'personal'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                        >
                            <User className={`w-8 h-8 mx-auto mb-2 ${spaceType === 'personal' ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                            <div className="text-[14px] font-semibold text-gray-900">내 공간</div>
                            <div className="text-[11px] text-gray-500 mt-1">나의 일상 기록</div>
                        </button>

                        <button
                            onClick={() => setSpaceType('memorial')}
                            className={`p-4 rounded-lg border-2 transition-all ${spaceType === 'memorial'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                        >
                            <Heart className={`w-8 h-8 mx-auto mb-2 ${spaceType === 'memorial' ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                            <div className="text-[14px] font-semibold text-gray-900">기억공간</div>
                            <div className="text-[11px] text-gray-500 mt-1">추모의 공간</div>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">이름</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={spaceType === 'personal' ? '홍길동' : '사랑하는 엄마'}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">핸들 (@username)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] text-gray-400">@</span>
                            <input
                                type="text"
                                value={formData.handle}
                                onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase() })}
                                className="flex-1 px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="username"
                            />
                        </div>
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
                        {loading ? '생성 중...' : '공간 만들기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
