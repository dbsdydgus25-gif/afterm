"use client";

import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { User, LogOut, CreditCard, Trash2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { StorageWidget } from "@/components/dashboard/StorageWidget";

interface Message {
    id: string;
    content: string;
    recipient_name: string;
    created_at: string;
    file_path?: string;
    file_size?: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { message, setMessage, setMessageId, recipient, setRecipient, user, setUser, plan } = useMemoryStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    // State for Signed URLs
    const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) return;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching messages:", error);
            } else {
                setMessages(data || []);

                // Fetch Signed URLs for all messages with files
                const urls: { [key: string]: string } = {};
                for (const msg of (data || [])) {
                    if (msg.file_path) {
                        const { data: signedData } = await supabase.storage
                            .from('memories')
                            .createSignedUrl(msg.file_path, 3600); // Valid for 1 hour

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

    // Initial check for user (simplified protection)
    // useEffect(() => {
    //     if (!user) router.push("/");
    // }, [user, router]);

    const handleEdit = (msg: Message | any) => {
        setMessage(msg.content);
        setMessageId(msg.id); // Set ID for update

        // Map legacy English relationships to Korean
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
        // We navigate to the unified edit page now
        router.push("/dashboard/edit");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말로 삭제하시겠습니까?")) return;

        const supabase = createClient();

        // 1. Get message details first to find file info
        const { data: msg } = await supabase
            .from('messages')
            .select('file_path, file_size, content')
            .eq('id', id)
            .single();

        // 2. Delete Message
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            alert("삭제 실패");
            console.error(error);
            return;
        }

        // 3. Cleanup Storage & Profile
        if (msg) {
            // Delete file if exists
            if (msg.file_path) {
                await supabase.storage
                    .from('memories')
                    .remove([msg.file_path]);
            }

            // Decrement Storage Usage
            const textBytes = new Blob([msg.content]).size;
            const totalBytesToRemove = (msg.file_size || 0) + textBytes;

            // Fetch current usage
            const { data: profile } = await supabase
                .from('profiles')
                .select('storage_used')
                .eq('id', user?.id)
                .single();

            if (profile) {
                const newUsage = Math.max(0, profile.storage_used - totalBytesToRemove);
                await supabase
                    .from('profiles')
                    .update({ storage_used: newUsage, updated_at: new Date().toISOString() })
                    .eq('id', user?.id);
            }
        }

        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const handleLogout = () => {
        setUser(null); // Clear user state
        router.push("/");
    };

    const handleDeleteAccount = () => {
        if (confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
            setUser(null);
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50">
                <Link href="/" className="text-xl font-black text-blue-600 tracking-tighter">AFTERM</Link>
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-slate-200"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user?.name?.[0] || "U"}
                        </div>
                        <span className="text-sm font-bold text-slate-700 hidden sm:block">{user?.name || "사용자"}</span>
                        {plan === 'pro' && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">PRO</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-slate-50">
                                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => router.push('/settings')}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" /> 내 정보
                                    </button>
                                    <button
                                        onClick={() => router.push('/plans')}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> 플랜 관리
                                        {plan === 'pro' && <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold">PRO</span>}
                                    </button>
                                </div>
                                <div className="p-1 border-t border-slate-50">
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg flex items-center gap-2 transition-colors">
                                        <LogOut className="w-4 h-4" /> 로그아웃
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-10">

                {/* Profile Section (Editable) */}
                <section
                    onClick={() => router.push('/settings')}
                    className="group relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-200 hover:bg-slate-50/80 p-6 rounded-2xl transition-colors cursor-pointer"
                >
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600">설정 ›</Button>
                    </div>

                    <div className="relative">
                        {user?.image || user?.user_metadata?.avatar_url ? (
                            <img src={user?.image || user?.user_metadata?.avatar_url} alt="Profile" className="w-20 h-20 rounded-full object-cover shadow-sm ring-4 ring-white" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl shadow-inner ring-4 ring-white">
                                {user?.name?.[0] || "U"}
                            </div>
                        )}
                        {plan === 'pro' && (
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-600 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-xs">PRO</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center sm:justify-start gap-2">
                            {user?.name || "사용자"}
                            {user?.user_metadata?.nickname && (
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    @{user.user_metadata.nickname}
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-600 mb-2 whitespace-pre-line text-sm max-w-lg">
                            {user?.user_metadata?.bio || "자기소개를 입력해주세요."}
                        </p>
                        {plan === 'pro' && (
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">PRO MEMBER</span>
                        )}
                    </div>
                </section>

                {/* Stats Section: Messages & Storage */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Message Usage */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-500 font-medium mb-4 text-sm">남은 메시지</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-bold text-slate-900">
                                {plan === 'pro' ? '∞' : Math.max(0, 1 - messages.length)}
                            </span>
                            <span className="text-sm text-slate-400 mb-1">
                                / {plan === 'pro' ? '무제한' : '1개'}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: plan === 'pro' ? '100%' : `${(messages.length / 1) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Right: Storage Usage */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <StorageWidget plan={plan} userId={user?.id} />
                    </div>
                </section>

                {/* My Memories List (Text Centric) */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">나의 기억 보관함</h2>
                        <Button onClick={() => router.push('/dashboard/memories')} variant="ghost" size="sm" className="text-slate-500">전체보기</Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-slate-400">로딩 중...</div>
                    ) : messages.length > 0 ? (
                        <div className="space-y-4">
                            {messages.map((msg: any) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleDateString()} 작성</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                To. {msg.recipient_name || '수신인 미지정'}
                                            </h3>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button onClick={() => handleEdit(msg)} variant="ghost" size="sm" className="h-8">수정</Button>
                                            <Button onClick={() => handleDelete(msg.id)} variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">삭제</Button>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-4 rounded-xl text-sm">
                                        {msg.content}
                                    </p>

                                    {imageUrls[msg.id] && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-100">
                                            <img
                                                src={imageUrls[msg.id]}
                                                alt="Attachment"
                                                className="w-full h-auto max-h-64 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement?.style.setProperty('display', 'none');
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 font-medium">
                                        <span className="flex items-center gap-1">📄 텍스트</span>
                                        {msg.file_path && <span className="flex items-center gap-1">📷 사진/영상 첨부됨</span>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div onClick={() => {
                            setMessage('');
                            setMessageId(null);
                            setRecipient({ name: '', phone: '', relationship: '' });
                            router.push('/create');
                        }} className="cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-110 transition-transform">✍️</div>
                            <p className="text-slate-900 font-bold mb-1">첫 번째 기억을 남겨보세요</p>
                            <p className="text-slate-500 text-sm">무료로 최대 1명에게 마음을 전할 수 있습니다.</p>
                        </div>
                    )}
                </section>

                {/* Upgrade CTA */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h3 className="text-2xl font-bold mb-2 relative z-10">더 많은 분들에게 마음을 전하고 싶으신가요?</h3>
                    <p className="text-slate-400 mb-6 relative z-10">Pro 플랜으로 업그레이드하고<br />무제한 메시지와 100GB 저장 공간을 이용해보세요.</p>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-6 rounded-xl text-lg relative z-10 shadow-lg shadow-blue-900/50">
                        Pro 플랜 알아보기
                    </Button>
                </div>

            </main>
        </div>
    );
}
