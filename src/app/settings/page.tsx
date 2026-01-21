"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WithdrawModal } from "@/components/auth/WithdrawModal";
import { User, Shield, CreditCard, LogOut, ChevronRight, Camera } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";

import { MessageList } from "@/components/dashboard/MessageList";

// Sub-component for Memories Tab to handle its own data fetching
function MemoriesTabContent() {
    const { user, setMessage, setMessageId, setRecipient } = useMemoryStore();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) return;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) {
                setMessages(data || []);
                const urls: { [key: string]: string } = {};
                for (const msg of (data || [])) {
                    if (msg.file_path) {
                        const { data: signedData } = await supabase.storage
                            .from('memories')
                            .createSignedUrl(msg.file_path, 3600);
                        if (signedData?.signedUrl) {
                            urls[msg.id] = signedData.signedUrl;
                        }
                    }
                }
                setImageUrls(urls);
            }
            setLoading(false);
        };
        fetchMessages();
    }, [user]);

    const handleEdit = (msg: any) => {
        setMessage(msg.content);
        setMessageId(msg.id);

        let rel = msg.recipient_relationship || '';
        if (rel === 'family') rel = '가족';
        else if (rel === 'friend') rel = '친구';
        else if (rel === 'lover') rel = '연인';
        else if (rel === 'colleague') rel = '동료';
        else if (rel === 'other') rel = '기타';

        setRecipient({
            name: msg.recipient_name,
            phone: msg.recipient_phone || '',
            relationship: rel
        });
        router.push("/dashboard/edit");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말로 삭제하시겠습니까?")) return;
        const supabase = createClient();

        const { data: msg } = await supabase.from('messages').select('file_path').eq('id', id).single();

        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) { alert("삭제 실패"); return; }

        if (msg?.file_path) {
            await supabase.storage.from('memories').remove([msg.file_path]);
        }

        setMessages(prev => prev.filter(m => m.id !== id));
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">나의 기억</h2>
            <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                남겨둔 메시지를 확인하고 관리합니다.
            </p>
            <MessageList
                messages={messages}
                loading={loading}
                imageUrls={imageUrls}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateNew={() => router.push('/create')}
            />
        </div>
    );
}

import { useSearchParams } from "next/navigation";

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as "profile" | "security" | "billing" | "memories" || "profile";
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "billing" | "memories">(initialTab);
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
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            setCustomName(user.name || "");
            const metadata = user.user_metadata || {};
            setNickname(metadata.nickname || "");
            setBio(metadata.bio || "");
            setProfileImage(metadata.avatar_url || "");
            setIsAuthChecking(false);
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
                        <button
                            onClick={() => setActiveTab("memories")}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === "memories"
                                ? "bg-slate-100 text-slate-900 font-bold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <span className="w-4 h-4 flex items-center justify-center">💌</span>
                            나의 기억 (메시지)
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
                                                placeholder="이름"
                                            />
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
        </div>
    );
}
