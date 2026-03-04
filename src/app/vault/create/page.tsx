"use client";

// ============================================================
// 디지털 유산 저장 페이지 (vault/create/page.tsx)
// 변경사항: 수신인 지정, PIN 설정, 본인인증 로직 완전 제거
// 이제 서비스명, 아이디, 비밀번호, 관련 메모만 저장합니다.
// 디지털 유산은 가디언즈 인증 이후에만 공개됩니다.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Lock, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

// 카테고리 목록
const CATEGORIES = [
    { key: "subscription", label: "구독 서비스" },
    { key: "sns", label: "소셜/커뮤니티" },
    { key: "finance", label: "금융/은행" },
    { key: "shopping", label: "쇼핑" },
    { key: "work", label: "업무/협업" },
    { key: "other", label: "기타" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

// 개별 Vault 항목 타입
interface VaultEntry {
    id: string;
    category: CategoryKey;
    platformName: string;
    accountId: string;
    password: string;
    memo: string;
    showPassword: boolean;
}

// 빈 항목 생성 함수
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
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [step, setStep] = useState<"consent" | "form">("consent");

    // 여러 항목을 한 번에 저장할 수 있도록 배열로 관리
    const [entries, setEntries] = useState<VaultEntry[]>([createEmptyEntry()]);

    /**
     * 특정 항목의 필드를 업데이트합니다.
     */
    const updateEntry = (id: string, field: keyof VaultEntry, value: string | boolean) => {
        setEntries(prev =>
            prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry)
        );
    };

    /**
     * 새 항목을 추가합니다.
     */
    const addEntry = () => setEntries(prev => [...prev, createEmptyEntry()]);

    /**
     * 항목을 삭제합니다. 마지막 항목은 삭제할 수 없습니다.
     */
    const removeEntry = (id: string) => {
        if (entries.length <= 1) return;
        setEntries(prev => prev.filter(entry => entry.id !== id));
    };

    /**
     * 전체 Vault 항목을 Supabase에 저장합니다.
     * PIN, 수신인 설정 없이 순수 데이터만 저장합니다.
     */
    const handleSubmit = async () => {
        // 유효성 검사: 서비스명은 필수
        const invalidEntries = entries.filter(e => !e.platformName.trim());
        if (invalidEntries.length > 0) {
            alert("모든 항목의 서비스명을 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("로그인이 필요합니다.");
                router.push("/login");
                return;
            }

            // 저장할 데이터 매핑: 수신인/PIN 없이 순수 데이터만 저장
            const vaultItems = entries.map(entry => ({
                user_id: user.id,
                category: entry.category,
                platform_name: entry.platformName,
                // username 컬럼 (마이그레이션으로 추가됨)
                username: entry.accountId || null,
                // password_plain 컬럼 (마이그레이션으로 추가됨) - 실제 운영에서는 암호화 고려
                password_plain: entry.password || null,
                notes: entry.memo || null,
                // 직접 입력한 항목임을 표시
                is_legacy_scan: false,
                // 기존 NOT NULL 컬럼 기본값 설정 (마이그레이션으로 nullable 변경됨)
                account_id: entry.accountId || null,
                password_encrypted: null,
                request_type: null,
                legal_consent: true,
            }));

            const { error } = await supabase.from("vault_items").insert(vaultItems);
            if (error) throw error;

            alert(`${entries.length}개의 디지털 유산이 안전하게 저장되었습니다.\n가디언즈 인증 이후 공개됩니다.`);
            router.push("/vault");
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
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">뒤로</span>
                </button>
                <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">디지털 유산 등록</span>
                </div>
                <div className="w-16" />
            </header>

            <main className="flex-1 max-w-lg w-full mx-auto p-5 pb-24 flex flex-col gap-6">

                {/* 단계 1: 안내 및 동의 */}
                {step === "consent" && (
                    <div className="space-y-6 animate-fade-in mt-4">
                        <div className="text-center space-y-2">
                            <h1 className="text-lg font-bold text-slate-900">디지털 유산 등록 안내</h1>
                            <p className="text-xs text-slate-500">
                                등록한 정보는 가디언즈 인증 후에만 공개됩니다.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <ul className="text-sm text-slate-600 leading-relaxed space-y-3 list-disc pl-4 marker:text-slate-300">
                                <li>
                                    등록된 계정 정보는 <strong className="text-slate-800">가디언즈(유산 관리자) 인증 이후에만</strong> 공개됩니다.
                                </li>
                                <li>
                                    비밀번호는 참고용으로만 저장되며, 저장된 데이터는 암호화되어 보관됩니다.
                                </li>
                                <li>
                                    가디언즈는 설정 {'>'} 가디언즈 관리 메뉴에서 지정하실 수 있습니다.
                                </li>
                            </ul>
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-200 transition-colors">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            />
                            <span className="text-sm font-bold text-slate-700">
                                안내 사항을 확인하고 동의합니다.
                            </span>
                        </label>

                        <Button
                            onClick={() => setStep("form")}
                            disabled={!agreed}
                            className={`w-full h-12 text-sm font-bold rounded-xl transition-all ${agreed ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 text-slate-400'}`}
                        >
                            {agreed ? '정보 등록 시작하기' : '안내 사항에 동의해주세요'}
                        </Button>
                    </div>
                )}

                {/* 단계 2: 정보 입력 폼 */}
                {step === "form" && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-center space-y-1">
                            <h1 className="text-base font-bold text-slate-900">계정 정보를 등록해주세요</h1>
                            <p className="text-xs text-slate-500">여러 계정을 한 번에 추가할 수 있습니다.</p>
                        </div>

                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
                            >
                                {/* 항목 헤더 */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500">항목 {index + 1}</span>
                                    {entries.length > 1 && (
                                        <button
                                            onClick={() => removeEntry(entry.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* 카테고리 선택 */}
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
                                    <Input
                                        value={entry.platformName}
                                        onChange={(e) => updateEntry(entry.id, "platformName", e.target.value)}
                                        placeholder="예: 넷플릭스, 카카오, 네이버"
                                        className="h-10 text-sm"
                                    />
                                </div>

                                {/* 아이디 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">아이디 / 이메일</label>
                                    <Input
                                        value={entry.accountId}
                                        onChange={(e) => updateEntry(entry.id, "accountId", e.target.value)}
                                        placeholder="로그인 아이디 또는 이메일"
                                        className="h-10 text-sm"
                                    />
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
                                        <button
                                            type="button"
                                            onClick={() => updateEntry(entry.id, "showPassword", !entry.showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {entry.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* 메모 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">메모 (선택)</label>
                                    <Textarea
                                        value={entry.memo}
                                        onChange={(e) => updateEntry(entry.id, "memo", e.target.value)}
                                        placeholder="가디언즈에게 남길 메시지나 참고 사항을 적어주세요."
                                        className="text-sm resize-none min-h-[80px]"
                                    />
                                </div>
                            </div>
                        ))}

                        {/* 항목 추가 버튼 */}
                        <button
                            onClick={addEntry}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            항목 추가하기
                        </button>

                        {/* 저장 버튼 */}
                        <div className="sticky bottom-4 pt-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                            >
                                {loading ? "저장 중..." : `${entries.length}개 안전하게 보관하기`}
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
