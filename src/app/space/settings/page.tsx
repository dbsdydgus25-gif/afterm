"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, LogOut, Trash2, Share2, Copy, Check } from "lucide-react";

export default function SpaceSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [space, setSpace] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        bio: ''
    });

    useEffect(() => {
        const fetchSpace = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: spaceData } = await supabase
                .from('spaces')
                .select('*')
                .eq('owner_id', user.id)
                .eq('space_type', 'personal')
                .single();

            if (spaceData) {
                setSpace(spaceData);
                setFormData({
                    name: spaceData.name || '',
                    handle: spaceData.handle || '',
                    bio: spaceData.bio || ''
                });
            }
            setLoading(false);
        };

        fetchSpace();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('spaces')
            .update({
                name: formData.name,
                bio: formData.bio,
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

    const handleDeleteAccount = async () => {
        if (!confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) return;

        const supabase = createClient();
        await supabase.from('spaces').delete().eq('id', space.id);
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
                <div className="text-[14px] text-gray-400">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="max-w-[430px] mx-auto min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[16px] font-bold">환경설정</h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-6">
                {/* Profile Edit */}
                <div className="space-y-4">
                    <h2 className="text-[14px] font-bold text-gray-900">프로필</h2>

                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">이름</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="홍길동"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">핸들 (@username)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] text-gray-400">@</span>
                            <input
                                type="text"
                                value={formData.handle}
                                disabled
                                className="flex-1 px-3 py-2 text-[14px] border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                                placeholder="username"
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            핸들은 변경할 수 없습니다 (고유 ID)
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] text-gray-500 font-medium">소개</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            placeholder="나를 소개해보세요"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? '저장 중...' : '저장하기'}
                    </button>
                </div>

                {/* Share Profile */}
                <div className="border-t border-gray-100 pt-6">
                    <h2 className="text-[14px] font-bold text-gray-900 mb-3">공유</h2>

                    <button
                        onClick={handleShare}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between"
                    >
                        <span className="flex items-center gap-3">
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            {copied ? '복사됨!' : '프로필 공유하기'}
                        </span>
                        {!copied && <Copy className="w-4 h-4" />}
                    </button>
                </div>

                {/* Account Actions */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                    <h2 className="text-[14px] font-bold text-gray-900">계정</h2>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                    >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                    </button>

                    <button
                        onClick={handleDeleteAccount}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                    >
                        <Trash2 className="w-4 h-4" />
                        계정 삭제
                    </button>
                </div>
            </div>
        </div>
    );
}
