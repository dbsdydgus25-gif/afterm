"use client";

import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SecureAvatar } from "@/components/ui/SecureAvatar";
import { User, LogOut, CreditCard, ChevronDown, Plus, MessageSquare, Lock, Trash2, ShieldCheck, FileKey, Database, CheckSquare, Square, Pencil } from "lucide-react";

import { MessageList } from "@/components/dashboard/MessageList";
import { VAULT_CATEGORIES, VAULT_REQUEST_TYPES } from "@/lib/vault-constants";

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
    is_unlocked?: boolean;
    message_attachments?: { file_type: string }[];
}

interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    account_id: string;
    password?: string;
    notes: string;
    created_at: string;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DashboardPage() {
    const router = useRouter();
    const { message, setMessage, setMessageId, recipient, setRecipient, user, setUser, plan } = useMemoryStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Data States
    const [messages, setMessages] = useState<Message[]>([]);
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [storageUsed, setStorageUsed] = useState(0);

    // UI States
    const [currentPage, setCurrentPage] = useState(1);
    const [vaultCurrentPage, setVaultCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<"messages" | "vault">("messages");
    const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

    // Vault Edit States
    const [editingVaultId, setEditingVaultId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<VaultItem>>({});
    const vaultItemsPerPage = 5;

    // Bulk Select States
    const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
    const [selectedVaultIds, setSelectedVaultIds] = useState<Set<string>>(new Set());
    const [msgSelectMode, setMsgSelectMode] = useState(false);
    const [vaultSelectMode, setVaultSelectMode] = useState(false);

    // Limits based on plan
    const maxMessages = plan === 'pro' ? 100 : 1;
    const maxVault = plan === 'pro' ? 100 : 10;
    const maxStorage = plan === 'pro' ? 1024 * 1024 * 1024 : 10 * 1024 * 1024; // 1GB vs 10MB

    useEffect(() => {
        // 로그인 체크 - 미로그인 시 로그인 페이지로 리다이렉트
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.replace("/login?returnTo=/dashboard");
            }
        });
    }, [router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;
            const supabase = createClient();

            // 1. Fetch Messages
            let msgQuery = supabase.from('messages').select('*, message_attachments(file_type)').eq('user_id', user.id);
            if (plan !== 'pro') msgQuery = msgQuery.eq('archived', false);
            const { data: msgData } = await msgQuery.order('created_at', { ascending: false });

            // 2. Fetch Vault Items
            const { data: vData } = await supabase.from('vault_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

            // 3. Fetch Storage Profile
            const { data: pData } = await supabase.from('profiles').select('storage_used').eq('id', user.id).single();

            // Handle Signed URLs for messages
            const urls: { [key: string]: string } = {};
            for (const msg of (msgData || [])) {
                if (msg.file_path) {
                    const { data: signedData } = await supabase.storage.from('memories').createSignedUrl(msg.file_path, 3600);
                    if (signedData?.signedUrl) urls[msg.id] = signedData.signedUrl;
                }
            }

            setMessages(msgData || []);
            setVaultItems(vData || []);
            setStorageUsed(pData?.storage_used || 0);
            setImageUrls(urls);
            setLoading(false);
        };

        fetchDashboardData();
    }, [user, plan]);

    // Handlers
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditMessage = (msg: Message | any) => {
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

    const handleDeleteMessage = async (id: string) => {
        if (!confirm("정말로 삭제하시겠습니까?")) return;
        const supabase = createClient();
        const { data: msg } = await supabase.from('messages').select('file_path, file_size, content').eq('id', id).single();
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) { alert("삭제 실패"); return; }

        if (msg) {
            if (msg.file_path) await supabase.storage.from('memories').remove([msg.file_path]);
            const textBytes = new Blob([msg.content]).size;
            const totalBytesToRemove = (msg.file_size || 0) + textBytes;
            const newUsage = Math.max(0, storageUsed - totalBytesToRemove);
            await supabase.from('profiles').update({ storage_used: newUsage }).eq('id', user?.id);
            setStorageUsed(newUsage);
        }
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const handleDeleteVault = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
        const supabase = createClient();
        const { error } = await supabase.from("vault_items").delete().eq("id", id);
        if (error) { alert("삭제 중 오류가 발생했습니다."); return; }
        setVaultItems(prev => prev.filter(v => v.id !== id));
    };

    const handleEditVaultClick = (item: VaultItem) => {
        setEditingVaultId(item.id);
        setEditForm({
            platform_name: item.platform_name,
            account_id: item.account_id,
            category: item.category,
            notes: item.notes,
            password: item.password || ""
        });
    };

    const handleUpdateVault = async (id: string) => {
        if (!editForm.platform_name || !editForm.account_id) {
            alert("플랫폼명과 아이디를 입력해주세요.");
            return;
        }

        const supabase = createClient();
        // 비밀번호가 있으면 notes에 "패스워드: xxx" 형태로 포함
        let finalNotes = editForm.notes || "";
        if (editForm.password) {
            // 기존 notes에서 패스워드 라인 제거 후 새로 추가
            finalNotes = finalNotes.replace(/패스워드:\s*.+/g, "").trim();
            finalNotes = finalNotes ? `${finalNotes}\n패스워드: ${editForm.password}` : `패스워드: ${editForm.password}`;
        }
        const { error } = await supabase
            .from("vault_items")
            .update({
                platform_name: editForm.platform_name,
                account_id: editForm.account_id,
                category: editForm.category,
                notes: finalNotes
            })
            .eq("id", id);

        if (error) {
            alert("수정 중 오류가 발생했습니다.");
            return;
        }

        setVaultItems(prev => prev.map(item => item.id === id ? { ...item, ...editForm, notes: finalNotes } as VaultItem : item));
        setEditingVaultId(null);
    };

    const getCategoryLabel = (category: string) => VAULT_CATEGORIES[category as keyof typeof VAULT_CATEGORIES] || category;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getRequestTypeLabel = (type: string) => VAULT_REQUEST_TYPES[type as keyof typeof VAULT_REQUEST_TYPES] || type;

    const handleBulkDeleteMessages = async () => {
        if (selectedMsgIds.size === 0) return;
        if (!confirm(`선택한 ${selectedMsgIds.size}개의 메시지를 삭제하시겠습니까?`)) return;
        const supabase = createClient();
        for (const id of Array.from(selectedMsgIds)) {
            const { data: msg } = await supabase.from('messages').select('file_path, file_size, content').eq('id', id).single();
            await supabase.from('messages').delete().eq('id', id);
            if (msg?.file_path) await supabase.storage.from('memories').remove([msg.file_path]);
        }
        setMessages(prev => prev.filter(m => !selectedMsgIds.has(m.id)));
        setSelectedMsgIds(new Set());
        setMsgSelectMode(false);
    };

    const handleBulkDeleteVaults = async () => {
        if (selectedVaultIds.size === 0) return;
        if (!confirm(`선택한 ${selectedVaultIds.size}개의 디지털 유산을 삭제하시겠습니까?`)) return;
        const supabase = createClient();
        const ids = Array.from(selectedVaultIds);
        await supabase.from('vault_items').delete().in('id', ids);
        setVaultItems(prev => prev.filter(v => !selectedVaultIds.has(v.id)));
        setSelectedVaultIds(new Set());
        setVaultSelectMode(false);
    };

    const toggleMsgSelect = (id: string) => {
        setSelectedMsgIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleVaultSelect = (id: string) => {
        setSelectedVaultIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Progress calculations
    const msgPercent = Math.min((messages.length / maxMessages) * 100, 100);
    const vaultPercent = Math.min((vaultItems.length / maxVault) * 100, 100);
    const storagePercent = Math.min((storageUsed / maxStorage) * 100, 100);
    const freePercent = 100 - msgPercent - vaultPercent - storagePercent; // Simplified just for the combined bar visual

    const paginatedVaultItems = vaultItems.slice((vaultCurrentPage - 1) * vaultItemsPerPage, vaultCurrentPage * vaultItemsPerPage);

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
                                    <Link href="/settings" className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                        <User className="w-4 h-4" /> 내 정보
                                    </Link>
                                    <Link href="/plans" className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
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
                {/* Profile Section */}
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
                                className="w-20 h-20 rounded-full shadow-sm ring-4 ring-white object-cover"
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

                {/* Apple-style Unified Storage Progress Bar */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            내 스토리지 현황
                        </h3>
                    </div>

                    {/* Unified Multi-color Progress Bar */}
                    <div className="h-4 sm:h-6 w-full flex rounded-full overflow-hidden bg-slate-100 shadow-inner mb-6 space-x-0.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, msgPercent)}%` }}
                            className="bg-indigo-500 h-full transition-all duration-1000 ease-out flex-shrink-0"
                            title="메시지 점유율"
                        />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, vaultPercent)}%` }}
                            className="bg-emerald-400 h-full transition-all duration-1000 delay-150 ease-out flex-shrink-0"
                            title="디지털 유산 점유율"
                        />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, storagePercent)}%` }}
                            className="bg-cyan-400 h-full transition-all duration-1000 delay-300 ease-out flex-shrink-0"
                            title="첨부파일 점유율"
                        />
                        <motion.div initial={{ flex: 1 }} animate={{ flex: 1 }}
                            className="bg-slate-100 h-full transition-all duration-1000"
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-between text-sm">
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                <span className="text-slate-500">메시지: <span className="font-bold text-slate-900">{messages.length}</span><span className="text-xs text-slate-400">/{maxMessages}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <span className="text-slate-500">디지털 유산: <span className="font-bold text-slate-900">{vaultItems.length}</span><span className="text-xs text-slate-400">/{maxVault}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                <span className="text-slate-500">첨부파일 용량: <span className="font-bold text-slate-900">{formatBytes(storageUsed)}</span></span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Block with Pill Tabs */}
                <section className="space-y-6 pt-4">
                    {/* Pill Tabs */}
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-full inline-flex md:mr-auto mx-auto w-full sm:w-auto">
                        <button
                            onClick={() => { setActiveTab("messages"); setCurrentPage(1); }}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all sm:w-auto w-1/2 ${activeTab === "messages"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            메시지
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === "messages" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"}`}>
                                {messages.length}
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab("vault"); setCurrentPage(1); }}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all sm:w-auto w-1/2 ${activeTab === "vault"
                                ? "bg-white text-emerald-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            디지털 유산
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === "vault" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                                {vaultItems.length}
                            </span>
                        </button>
                    </div>

                    {/* Bulk Action Toolbar */}
                    {activeTab === "messages" && msgSelectMode && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                            <span className="text-sm font-medium text-red-600">{selectedMsgIds.size}개 선택됨</span>
                            <button onClick={() => { setMessages(prev => { const ids = new Set(prev.map(m => m.id)); setSelectedMsgIds(ids); return prev; }); setSelectedMsgIds(new Set(messages.map(m => m.id))); }} className="text-xs text-slate-500 hover:text-slate-700 underline">전체 선택</button>
                            <button onClick={() => { setMsgSelectMode(false); setSelectedMsgIds(new Set()); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600">취소</button>
                            <Button onClick={handleBulkDeleteMessages} size="sm" className="h-7 bg-red-600 hover:bg-red-700 text-xs">
                                <Trash2 className="w-3.5 h-3.5 mr-1" />선택 삭제
                            </Button>
                        </div>
                    )}
                    {activeTab === "vault" && vaultSelectMode && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                            <span className="text-sm font-medium text-red-600">{selectedVaultIds.size}개 선택됨</span>
                            <button onClick={() => setSelectedVaultIds(new Set(vaultItems.map(v => v.id)))} className="text-xs text-slate-500 hover:text-slate-700 underline">전체 선택</button>
                            <button onClick={() => { setVaultSelectMode(false); setSelectedVaultIds(new Set()); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600">취소</button>
                            <Button onClick={handleBulkDeleteVaults} size="sm" className="h-7 bg-red-600 hover:bg-red-700 text-xs">
                                <Trash2 className="w-3.5 h-3.5 mr-1" />선택 삭제
                            </Button>
                        </div>
                    )}

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {activeTab === "messages" ? (
                            <motion.div
                                key="messages"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Bulk select toggle for messages */}
                                <div className="flex justify-end mb-2">
                                    <button
                                        onClick={() => { setMsgSelectMode(!msgSelectMode); setSelectedMsgIds(new Set()); }}
                                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        {msgSelectMode ? '선택 잠금' : '선택 삭제'}
                                    </button>
                                </div>
                                {msgSelectMode && (
                                    <div className="space-y-2 mb-4">
                                        {messages.slice((currentPage - 1) * 3, currentPage * 3).map(msg => (
                                            <button
                                                key={msg.id}
                                                onClick={() => toggleMsgSelect(msg.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${selectedMsgIds.has(msg.id) ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                            >
                                                {selectedMsgIds.has(msg.id)
                                                    ? <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                    : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                }
                                                <span className="font-medium text-slate-700 truncate">{msg.recipient_name}님에게</span>
                                                <span className="text-slate-400 text-xs ml-auto">{new Date(msg.created_at).toLocaleDateString('ko-KR')}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!msgSelectMode && (
                                    <MessageList
                                        messages={messages.slice((currentPage - 1) * 3, currentPage * 3)}
                                        loading={loading}
                                        imageUrls={imageUrls}
                                        onEdit={handleEditMessage}
                                        onDelete={handleDeleteMessage}
                                        onCreateNew={() => {
                                            setMessage('');
                                            setMessageId(null);
                                            setRecipient({ name: '', phone: '', relationship: '' });
                                            router.push('/create');
                                        }}
                                    />
                                )}

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
                            </motion.div>
                        ) : (
                            <motion.div
                                key="vault"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {loading ? (
                                    <div className="text-center text-slate-500 py-10">로딩 중...</div>
                                ) : vaultItems.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                                            <Lock className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                                            등록된 디지털 유산이 없습니다
                                        </h3>
                                        <p className="text-slate-500 mb-6 text-sm">
                                            계정 정보를 안전하게 보관하고 사후에 전달하세요
                                        </p>
                                        <Button
                                            onClick={() => router.push("/vault/create")}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            첫 번째 유산 등록하기
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            {/* Vault select mode toggle */}
                                            <div className="flex justify-end mb-2">
                                                <button
                                                    onClick={() => { setVaultSelectMode(!vaultSelectMode); setSelectedVaultIds(new Set()); }}
                                                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
                                                >
                                                    <CheckSquare className="w-3.5 h-3.5" />
                                                    {vaultSelectMode ? '선택 잠금' : '선택 삭제'}
                                                </button>
                                            </div>
                                            {paginatedVaultItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`bg-white rounded-2xl border p-5 transition-all relative overflow-hidden group ${vaultSelectMode && selectedVaultIds.has(item.id)
                                                        ? 'border-red-300 bg-red-50/60'
                                                        : 'border-slate-200 hover:shadow-md'
                                                        }`}
                                                    onClick={vaultSelectMode ? () => toggleVaultSelect(item.id) : undefined}
                                                    style={vaultSelectMode ? { cursor: 'pointer' } : undefined}
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-50" />

                                                    {editingVaultId === item.id ? (
                                                        /* --- Edit Mode --- */
                                                        <div className="relative z-10 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={editForm.category}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                                                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                                >
                                                                    {Object.entries(VAULT_CATEGORIES).map(([key, label]) => (
                                                                        <option key={key} value={key}>{label}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="text"
                                                                    value={editForm.platform_name || ""}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, platform_name: e.target.value }))}
                                                                    placeholder="플랫폼/사이트명"
                                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <FileKey className="w-4 h-4 text-slate-400" />
                                                                <input
                                                                    type="text"
                                                                    value={editForm.account_id || ""}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, account_id: e.target.value }))}
                                                                    placeholder="아이디 또는 이메일"
                                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                <input
                                                                    type="text"
                                                                    value={editForm.password || ""}
                                                                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                                                    placeholder="비밀번호 (선택)"
                                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                                                                />
                                                            </div>
                                                            <textarea
                                                                value={editForm.notes || ""}
                                                                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                                                placeholder="메모 (선택)"
                                                                rows={2}
                                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                                                            />
                                                            <div className="flex justify-end gap-2 pt-2">
                                                                <Button variant="outline" size="sm" onClick={() => setEditingVaultId(null)} className="h-8 text-xs">취소</Button>
                                                                <Button size="sm" onClick={() => handleUpdateVault(item.id)} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">저장</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* --- View Mode --- */
                                                        <div className="flex items-start justify-between gap-3 relative z-10">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    {vaultSelectMode && (
                                                                        <div className="flex-shrink-0">
                                                                            {selectedVaultIds.has(item.id)
                                                                                ? <CheckSquare className="w-4 h-4 text-red-500" />
                                                                                : <Square className="w-4 h-4 text-slate-300" />
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold ring-1 ring-emerald-200 shadow-sm">
                                                                        {getCategoryLabel(item.category)}
                                                                    </span>
                                                                    <h3 className="text-base md:text-lg font-bold text-slate-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                                        {item.platform_name}
                                                                    </h3>
                                                                </div>

                                                                <div className="space-y-2 text-sm max-w-sm mt-4">
                                                                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                                                        <FileKey className="w-4 h-4 text-slate-400" />
                                                                        <span className="text-slate-900 font-mono font-bold tracking-tight">{item.account_id}</span>
                                                                    </div>

                                                                    {item.notes && (
                                                                        <div className="flex items-start gap-2 pt-3 mt-2 border-t border-slate-100 px-3">
                                                                            <span className="text-slate-400 w-16 flex-shrink-0 text-xs font-bold">메모</span>
                                                                            <span className="text-slate-600 flex-1 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">{item.notes}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="mt-4 text-xs text-slate-400 font-medium">
                                                                    등록일: {new Date(item.created_at).toLocaleDateString('ko-KR')}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEditVaultClick(item); }}
                                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100 shadow-sm"
                                                                    title="수정"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteVault(item.id); }}
                                                                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 shadow-sm"
                                                                    title="해당 디지털 유산 삭제"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Vault Pagination */}
                                        {vaultItems.length > vaultItemsPerPage && (
                                            <div className="flex justify-center gap-2 pt-4 pb-8">
                                                {Array.from({ length: Math.ceil(vaultItems.length / vaultItemsPerPage) }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setVaultCurrentPage(page)}
                                                        className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${vaultCurrentPage === page
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Floating Action Button for New Content based on active tab */}
                <button
                    onClick={() => router.push(activeTab === "messages" ? '/create' : '/vault/create')}
                    className={`fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50 ${activeTab === "messages" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 ring-4 ring-white" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 ring-4 ring-white"}`}
                >
                    <Plus className="w-8 h-8" />
                </button>
            </main>
        </div>
    );
}
