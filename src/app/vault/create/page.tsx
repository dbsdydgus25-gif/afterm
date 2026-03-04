"use client";

// ============================================================
// 디지털 유산 저장 페이지 (vault/create/page.tsx)
// 변경사항:
//   - 약관 동의 단계 제거 (온보딩에서 처리됨)
//   - 가디언즈 미설정 시 안내 모달 노출
//   - Free = 10개 / Pro = 100개 저장 한도
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Lock, Eye, EyeOff, Plus, Trash2, Shield, ArrowRight } from "lucide-react";
import { useMemoryStore } from "@/store/useMemoryStore";

const CATEGORIES = [
    { key: "subscription", label: "구독 서비스" },
    { key: "sns", label: "소셜/커뮤니티" },
    { key: "finance", label: "금융/은행" },
    { key: "shopping", label: "쇼핑" },
    { key: "work", label: "업무/협업" },
    { key: "other", label: "기타" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

interface VaultEntry {
    id: string;
    category: CategoryKey;
    platformName: string;
    accountId: string;
    password: string;
    memo: string;
    showPassword: boolean;
}

const createEmptyEntry = (): VaultEntry => ({
    id: crypto.randomUUID(),
    category: "other",
    platformName: "",
    accountId: "",
    password: "",
    memo: "",
    showPassword: false,
});

export default function VaultCreatePage() {
    const router = useRouter();
    const { user, plan } = useMemoryStore();
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<VaultEntry[]>([createEmptyEntry()]);

    // 가디언즈 미설정 모달 상태
    const [showGuardianModal, setShowGuardianModal] = useState(false);
    const [guardianChecked, setGuardianChecked] = useState(false);

    // 진입 시 가디언즈 설정 여부 확인
    useEffect(() => {
        const checkGuardians = async () => {
            if (!user?.id || guardianChecked) return;
            const supabase = createClient();
            const { count } = await supabase
                .from('guardians')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (count === 0 || count === null) {
                setShowGuardianModal(true);
            }
            setGuardianChecked(true);
        };
        checkGuardians();
    }, [user, guardianChecked]);

    const updateEntry = (id: string, field: keyof VaultEntry, value: string | boolean) => {
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
    };

    const addEntry = () => setEntries(prev => [...prev, createEmptyEntry()]);
    const removeEntry = (id: string) => {
        if (entries.length <= 1) return;
        setEntries(prev => prev.filter(entry => entry.id !== id));
    };

    /**
     * Vault 저장 (Pro = 100개 / Free = 10개 한도 적용)
     */
    const handleSubmit = async () => {
        const invalidEntries = entries.filter(e => !e.platformName.trim());
        if (invalidEntries.length > 0) {
            alert("모든 항목의 서비스명을 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                alert("로그인이 필요합니다.");
                router.push("/login");
                return;
            }

            // 플랜별 한도 조회
            const { data: dbProfile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', authUser.id)
                .single();

            const effectivePlan = (dbProfile?.plan || plan || 'free').toLowerCase();
            const VAULT_LIMIT = effectivePlan === 'pro' ? 100 : 10;

            const { count: currentCount } = await supabase
                .from('vault_items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', authUser.id);

            if (currentCount !== null && (currentCount + entries.length) > VAULT_LIMIT) {
                const remaining = VAULT_LIMIT - (currentCount || 0);
                alert(effectivePlan === 'pro'
                    ? `Pro 플랜 한도(100개)를 초과합니다. 추가 가능 항목: ${remaining}개`
                    : `Free 플랜 한도(10개)를 초과합니다. 추가 가능 항목: ${remaining}개\nPro 플랜으로 업그레이드하면 100개까지 저장할 수 있습니다.`
                );
                return;
            }

            // 저장 (수신인, PIN 없이 순수 정보만)
            const vaultItems = entries.map(entry => ({
                user_id: authUser.id,
                category: entry.category,
                platform_name: entry.platformName,
                username: entry.accountId || null,
                password_plain: entry.password || null,
                notes: entry.memo || null,
                is_legacy_scan: false,
                account_id: entry.accountId || null,
                password_encrypted: null,
                request_type: null,
                legal_consent: true,
            }));

            const { error } = await supabase.from("vault_items").insert(vaultItems);
            if (error) throw error;

            alert(`${entries.length}개의 디지털 유산이 안전하게 저장되었습니다.\n가디언즈 인증 이후 공개됩니다.`);
            router.push("/dashboard");
        } catch (error: unknown) {
            console.error("Vault 저장 오류:", error);
            alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* 헤더 */}
            <header className="w-full bg-white border-b border-slate-200 h-14 flex items-center px-5 justify-between sticky top-0 z-50">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">뒤로</span>
                </button>
                <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">디지털 유산 등록</span>
                </div>
                <div className="w-16" />
            </header>

            {/* 가디언즈 미설정 모달 */}
            {showGuardianModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-orange-500" />
                            </div>
                            <h2 className="text-base font-bold text-slate-900">가디언즈를 먼저 설정하세요</h2>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            등록한 디지털 유산은 가디언즈 인증 후에만 공개됩니다.
                            가디언즈(유산 관리자)를 먼저 등록해두세요.
                        </p>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setShowGuardianModal(false)}
                                className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50"
                            >
                                나중에 하기
                            </button>
                            <Button
                                onClick={() => router.push('/settings/guardians')}
                                className="flex-[2] h-10 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            >
                                가디언즈 설정하기 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-lg w-full mx-auto p-5 pb-24 flex flex-col gap-4 mt-2">
                <div className="text-center space-y-1">
                    <h1 className="text-base font-bold text-slate-900">계정 정보를 등록해주세요</h1>
                    <p className="text-xs text-slate-500">여러 계정을 한 번에 추가할 수 있습니다.</p>
                </div>

                {entries.map((entry, index) => (
                    <div key={entry.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">항목 {index + 1}</span>
                            {entries.length > 1 && (
                                <button onClick={() => removeEntry(entry.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* 카테고리 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">카테고리</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => updateEntry(entry.id, "category", cat.key)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${entry.category === cat.key
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 서비스명 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">서비스명 *</label>
                            <Input value={entry.platformName} onChange={(e) => updateEntry(entry.id, "platformName", e.target.value)} placeholder="예: 넷플릭스, 카카오, 네이버" className="h-10 text-sm" />
                        </div>

                        {/* 아이디 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">아이디 / 이메일</label>
                            <Input value={entry.accountId} onChange={(e) => updateEntry(entry.id, "accountId", e.target.value)} placeholder="로그인 아이디 또는 이메일" className="h-10 text-sm" />
                        </div>

                        {/* 비밀번호 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">비밀번호</label>
                            <div className="relative">
                                <Input
                                    type={entry.showPassword ? "text" : "password"}
                                    value={entry.password}
                                    onChange={(e) => updateEntry(entry.id, "password", e.target.value)}
                                    placeholder="비밀번호 또는 힌트"
                                    className="h-10 text-sm pr-10"
                                />
                                <button type="button" onClick={() => updateEntry(entry.id, "showPassword", !entry.showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {entry.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* 메모 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">메모 (선택)</label>
                            <Textarea value={entry.memo} onChange={(e) => updateEntry(entry.id, "memo", e.target.value)} placeholder="가디언즈에게 남길 메시지나 참고 사항" className="text-sm resize-none min-h-[80px]" />
                        </div>
                    </div>
                ))}

                {/* 항목 추가 */}
                <button onClick={addEntry} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    항목 추가하기
                </button>

                {/* 저장 버튼 */}
                <div className="sticky bottom-4 pt-2">
                    <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200">
                        {loading ? "저장 중..." : `${entries.length}개 안전하게 보관하기`}
                    </Button>
                </div>
            </main>
        </div>
    );
}
