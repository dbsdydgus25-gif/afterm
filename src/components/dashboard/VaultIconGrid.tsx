"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square, FileKey, X, Plus, Pencil, Trash2 } from "lucide-react";
import { 
    SiNetflix, SiYoutube, SiSpotify, SiApple, SiGoogle, SiNaver, 
    SiKakaotalk, SiInstagram, SiFacebook, SiX, SiTiktok,
    SiDiscord, SiNotion, SiSlack, SiGithub
} from "react-icons/si";
import { FaMicrosoft, FaAmazon } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { VAULT_CATEGORIES } from "@/lib/vault-constants";

export interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    account_id: string;
    password?: string;
    notes: string;
    created_at: string;
}

interface VaultIconGridProps {
    items: VaultItem[];
    loading: boolean;
    vaultSelectMode: boolean;
    selectedVaultIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<VaultItem>) => Promise<void>;
    onSelectModeToggle: () => void;
    onNavigateCreate: () => void;
}

const CATS = [
    { key: "all", label: "전체", emoji: "🗂️", color: "bg-slate-600", gradient: "from-slate-600 to-slate-800" },
    { key: "통신", label: "통신", emoji: "📱", color: "bg-sky-500", gradient: "from-sky-400 to-sky-600" },
    { key: "유료구독", label: "구독", emoji: "💳", color: "bg-rose-500", gradient: "from-rose-400 to-rose-600" },
    { key: "클라우드", label: "클라우드", emoji: "☁️", color: "bg-blue-500", gradient: "from-blue-400 to-blue-600" },
    { key: "SNS", label: "SNS", emoji: "👤", color: "bg-pink-500", gradient: "from-pink-400 to-pink-600" },
];

export function VaultIconGrid({
    items,
    loading,
    vaultSelectMode,
    selectedVaultIds,
    onToggleSelect,
    onDelete,
    onUpdate,
    onSelectModeToggle,
    onNavigateCreate
}: VaultIconGridProps) {
    const [filter, setFilter] = useState<string>("all");
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<VaultItem>>({});

    const handleItemClick = (item: VaultItem) => {
        if (vaultSelectMode) {
            onToggleSelect(item.id);
        } else {
            setSelectedItem(item);
            setIsEditing(false);
        }
    };

    const handleEditStart = () => {
        if (!selectedItem) return;
        setEditForm({
            category: selectedItem.category,
            platform_name: selectedItem.platform_name,
            account_id: selectedItem.account_id,
            password: selectedItem.password || "",
            notes: selectedItem.notes || ""
        });
        setIsEditing(true);
    };

    const handleUpdateSubmit = async () => {
        if (!selectedItem) return;
        if (!editForm.platform_name || !editForm.account_id) {
            alert("플랫폼명과 아이디는 필수입니다.");
            return;
        }
        await onUpdate(selectedItem.id, editForm);
        setSelectedItem({ ...selectedItem, ...editForm, notes: editForm.notes || "" } as VaultItem);
        setIsEditing(false);
    };

    const handleDeleteFromModal = () => {
        if (!selectedItem) return;
        onDelete(selectedItem.id);
        setSelectedItem(null);
    };

    const filteredItems = items.filter(item => {
        if (filter === "all") return true;
        // 기타 처리
        if (filter === "기타") return !["통신", "유료구독", "구독 서비스", "클라우드", "SNS", "소셜"].includes(item.category);
        
        if (filter === "유료구독" && item.category === "구독 서비스") return true;
        if (filter === "SNS" && item.category === "소셜") return true;
        return item.category === filter;
    });

    const getCatInfo = (cat: string) => {
        if (cat === "구독 서비스") cat = "유료구독";
        if (cat === "소셜") cat = "SNS";
        const found = CATS.find(c => c.key === cat);
        return found || { key: "기타", label: "기타", emoji: "📋", color: "bg-slate-400", gradient: "from-slate-400 to-slate-600" };
    };

    const getInitial = (name: string) => name ? name.slice(0, 2).toUpperCase() : "?";

    const getServiceIcon = (name: string, className = "w-8 h-8 sm:w-10 sm:h-10") => {
        if (!name) return null;
        const l = name.toLowerCase().replace(/\s+/g, '');
        if (l.includes('netflix') || l.includes('넷플릭스')) return <SiNetflix className={className} />;
        if (l.includes('youtube') || l.includes('유튜브')) return <SiYoutube className={className} />;
        if (l.includes('spotify') || l.includes('스포티파이')) return <SiSpotify className={className} />;
        if (l.includes('apple') || l.includes('애플') || l.includes('icloud') || l.includes('아이클라우드')) return <SiApple className={className} />;
        if (l.includes('google') || l.includes('구글')) return <SiGoogle className={className} />;
        if (l.includes('naver') || l.includes('네이버')) return <SiNaver className={className} />;
        if (l.includes('kakao') || l.includes('카카오')) return <SiKakaotalk className={className} />;
        if (l.includes('insta') || l.includes('인스타')) return <SiInstagram className={className} />;
        if (l.includes('facebook') || l.includes('페북') || l.includes('페이스북')) return <SiFacebook className={className} />;
        if (l.includes('twitter') || l.includes('트위터') || l === 'x' || l === '엑스') return <SiX className={className} />;
        if (l.includes('tiktok') || l.includes('틱톡')) return <SiTiktok className={className} />;
        if (l.includes('microsoft') || l.includes('마이크로소프트') || l.includes('office') || l.includes('오피스') || l.includes('onedrive') || l.includes('원드라이브')) return <FaMicrosoft className={className} />;
        if (l.includes('amazon') || l.includes('아마존')) return <FaAmazon className={className} />;
        if (l.includes('discord') || l.includes('디스코드')) return <SiDiscord className={className} />;
        if (l.includes('notion') || l.includes('노션')) return <SiNotion className={className} />;
        if (l.includes('slack') || l.includes('슬랙')) return <SiSlack className={className} />;
        if (l.includes('github') || l.includes('깃허브')) return <SiGithub className={className} />;
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header / Select Mode / Filter */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 mask-linear-fade">
                        {[...CATS, { key: "기타", label: "기타", emoji: "📋", color: "bg-slate-400" }].map(c => (
                            <button
                                key={c.key}
                                onClick={() => {
                                    setFilter(c.key);
                                    if (vaultSelectMode) onSelectModeToggle();
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === c.key
                                    ? "bg-slate-800 text-white shadow-md shadow-slate-900/20"
                                    : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <span>{c.emoji}</span>
                                <span>{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button
                        onClick={onSelectModeToggle}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
                    >
                        {vaultSelectMode ? <CheckSquare className="w-4 h-4 text-red-500" /> : <CheckSquare className="w-4 h-4" />}
                        {vaultSelectMode ? '선택 해제' : '다중 선택 삭제'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                <AnimatePresence>
                    {filteredItems.map(item => {
                        const catInfo = getCatInfo(item.category);
                        const isSelected = selectedVaultIds.has(item.id);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={`relative flex flex-col items-center gap-2 cursor-pointer group p-2 rounded-2xl transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-slate-100/50'}`}
                            >
                                {/* Checkbox for select mode */}
                                {vaultSelectMode && (
                                    <div className="absolute top-1 right-1 z-10 bg-white rounded-md shadow-sm">
                                        {isSelected 
                                            ? <CheckSquare className="w-5 h-5 text-red-500" />
                                            : <Square className="w-5 h-5 text-slate-300" />
                                        }
                                    </div>
                                )}

                                {/* App Icon */}
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] shadow-sm flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br ${catInfo.gradient} group-hover:shadow-md transition-all`}>
                                    {getServiceIcon(item.platform_name, "w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm") || getInitial(item.platform_name)}
                                </div>
                                
                                {/* App Name */}
                                <span className="text-xs sm:text-sm font-bold text-slate-700 text-center line-clamp-2 w-full px-1">
                                    {item.platform_name}
                                </span>
                            </motion.div>
                        );
                    })}
                    
                    {/* Add New Button */}
                    {!vaultSelectMode && filter === "all" && (
                        <motion.button
                            layout
                            onClick={onNavigateCreate}
                            className="flex flex-col items-center gap-2 cursor-pointer group p-2"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 group-hover:border-blue-400 transition-all text-slate-400 group-hover:text-blue-500">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-500 text-center">
                                직접 추가
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {filteredItems.length === 0 && filter !== "all" && (
                <div className="text-center py-16 text-slate-400 text-sm">
                    이 카테고리에 등록된 항목이 없습니다.
                </div>
            )}

            {/* Bottom Sheet / Modal for Detail View & Edit */}
            <AnimatePresence>
                {selectedItem && !vaultSelectMode && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl shadow-2xl pb-safe flex flex-col max-h-[85vh] md:max-w-md md:mx-auto"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                            
                            <div className="px-6 pb-4 pt-2 flex justify-between items-start border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-inner bg-gradient-to-br ${getCatInfo(selectedItem.category).gradient}`}>
                                        {getServiceIcon(selectedItem.platform_name, "w-7 h-7 drop-shadow-sm") || getInitial(selectedItem.platform_name)}
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${getCatInfo(selectedItem.category).color}`}>
                                            {getCatInfo(selectedItem.category).label}
                                        </span>
                                        <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedItem.platform_name}</h2>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500">카테고리</label>
                                            <select
                                                value={editForm.category}
                                                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                            >
                                                {Object.entries(VAULT_CATEGORIES).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500">플랫폼 / 사이트명</label>
                                            <input
                                                type="text"
                                                value={editForm.platform_name || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, platform_name: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500">계정 아이디 / 이메일</label>
                                            <input
                                                type="text"
                                                value={editForm.account_id || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, account_id: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500">비밀번호 (선택)</label>
                                            <input
                                                type="text"
                                                value={editForm.password || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder="변경할 비밀번호 입력"
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500">메모 (선택)</label>
                                            <textarea
                                                value={editForm.notes || ""}
                                                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                                rows={3}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                                    <FileKey className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold mb-0.5">계정 아이디</p>
                                                    <p className="text-base font-mono font-bold text-slate-800 tracking-tight">{selectedItem.account_id}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedItem.notes && (
                                            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                                                <p className="text-xs text-amber-600/70 font-bold mb-2">메모 및 부가 정보</p>
                                                <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{selectedItem.notes}</p>
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-center text-slate-400">
                                            등록일: {new Date(selectedItem.created_at).toLocaleDateString('ko-KR')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-white md:rounded-b-3xl">
                                {isEditing ? (
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsEditing(false)}>취소</Button>
                                        <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md shadow-blue-500/20" onClick={handleUpdateSubmit}>저장하기</Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={handleDeleteFromModal}>
                                            <Trash2 className="w-4 h-4 mr-2" /> 삭제
                                        </Button>
                                        <Button className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white shadow-md" onClick={handleEditStart}>
                                            <Pencil className="w-4 h-4 mr-2" /> 수정
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
