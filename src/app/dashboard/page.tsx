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
import { SecureAvatar } from "@/components/ui/SecureAvatar";

import { StorageWidget } from "@/components/dashboard/StorageWidget";
import { MessageList } from "@/components/dashboard/MessageList";

interface Message {
    id: string;
    content: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_relationship: string;
    created_at: string;
    file_path?: string;
    file_size?: number;
    type?: "text" | "image" | "voice" | "video";
    status?: string;
    unlocked?: boolean;
}

export default function DashboardPage() {
    const router = useRouter();
    const { message, setMessage, setMessageId, recipient, setRecipient, user, setUser, plan } = useMemoryStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    // State for Signed URLs
    const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) return;
            if (!user.id) return;

            const supabase = createClient();

            // Build query with archived filter
            let query = supabase
                .from('messages')
                .select('*')
                .eq('user_id', user.id);

            // Basic users only see non-archived messages
            // Pro users see all messages
            if (plan !== 'pro') {
                query = query.eq('archived', false);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

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

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
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
                        {user?.image || user?.user_metadata?.avatar_url ? (
                            <SecureAvatar
                                src={user?.image || user?.user_metadata?.avatar_url}
                                alt="Profile"
                                className="w-8 h-8 rounded-full shadow-sm"
                            />
                        ) : (
                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {user?.name?.[0] || "U"}
                            </span>
                        )}
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
                                    <Link
                                        href="/settings"
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" /> 내 정보
                                    </Link>
                                    <Link
                                        href="/plans"
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> 플랜 관리
                                        {plan === 'pro' && <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold">PRO</span>}
                                    </Link>
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
                <Link
                    href="/settings"
                    className="group relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-200 hover:bg-slate-50/80 p-6 rounded-2xl transition-colors cursor-pointer block"
                >
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-medium text-slate-400 hover:text-blue-600">설정 ›</span>
                    </div>

                    <div className="relative">
                        {user?.image || user?.user_metadata?.avatar_url ? (
                            <SecureAvatar
                                src={user?.image || user?.user_metadata?.avatar_url}
                                alt="Profile"
                                className="w-20 h-20 rounded-full shadow-sm ring-4 ring-white"
                            />
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
                        <h1 className="text-2xl font-bold text-slate-900 mb-0.5 flex flex-col sm:block">
                            <span>{user?.name || "사용자"}</span>
                        </h1>
                        {user?.user_metadata?.username && (
                            <p className="text-sm font-medium text-slate-400">
                                @{user.user_metadata.username}
                            </p>
                        )}
                    </div>
                </Link>

                {/* Stats Section: Messages & Storage (Unified Compact Design) */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="grid grid-cols-2 gap-8 divide-x divide-slate-100">
                        {/* Left: Message Usage */}
                        <div className="px-2">
                            <h3 className="text-slate-500 font-bold text-xs mb-3">남은 메시지</h3>
                            <div className="flex items-end gap-1.5 mb-2">
                                <span className="text-2xl font-black text-slate-900 leading-none">
                                    {plan === 'pro' ? Math.max(0, 100 - messages.length) : Math.max(0, 1 - messages.length)}
                                </span>
                                <span className="text-xs text-slate-400 font-medium mb-0.5">
                                    / {plan === 'pro' ? '100' : '1'}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-slate-900 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: plan === 'pro'
                                            ? `${Math.min((messages.length / 100) * 100, 100)}%`
                                            : `${Math.min((messages.length / 1) * 100, 100)}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Right: Storage Usage */}
                        <div className="pl-6">
                            <h3 className="text-slate-500 font-bold text-xs mb-3">사용 중인 용량</h3>
                            <StorageWidget plan={plan} userId={user?.id} compact={true} />
                        </div>
                    </div>
                </section>

                <Button
                    onClick={() => router.push('/create')}
                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-base shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                    <span>✨</span> 새 기억 남기기
                </Button>

                {/* My Memories List */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 px-1">나의 기억 보관함</h2>

                    <MessageList
                        messages={messages.slice((currentPage - 1) * 3, currentPage * 3)}
                        loading={loading}
                        imageUrls={imageUrls}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCreateNew={() => {
                            setMessage('');
                            setMessageId(null);
                            setRecipient({ name: '', phone: '', relationship: '' });
                            router.push('/create');
                        }}
                    />

                    {/* Pagination */}
                    {messages.length > 3 && (
                        <div className="flex justify-center gap-2 pt-4 pb-8">
                            {Array.from({ length: Math.ceil(messages.length / 3) }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${currentPage === page
                                        ? "bg-slate-900 text-white"
                                        : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
