"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Save, CheckCircle, Plus, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import type { DashboardResult, LegacyItem } from "./AiAssistantClient";

interface DashboardPanelProps {
    result: DashboardResult;
    isAnalyzing: boolean;
    onResultChange: (result: DashboardResult) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    "OTT": "bg-rose-50 text-rose-600 border-rose-100",
    "음악": "bg-purple-50 text-purple-600 border-purple-100",
    "클라우드": "bg-blue-50 text-blue-600 border-blue-100",
    "게임": "bg-green-50 text-green-600 border-green-100",
    "쇼핑": "bg-amber-50 text-amber-600 border-amber-100",
    "기타": "bg-slate-50 text-slate-600 border-slate-100",
};

export function DashboardPanel({ result, isAnalyzing, onResultChange }: DashboardPanelProps) {
    const router = useRouter();
    const { setMessage, setRecipient } = useMemoryStore();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saveError, setSaveError] = useState("");

    // 빈 상태
    if (!isAnalyzing && !result) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl">
                    💭
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    AI와 대화하면 결과물이 여기에 나타납니다.<br />
                    디지털 유산을 찾거나, 메시지를 작성해보세요.
                </p>
            </div>
        );
    }

    // 스켈레톤 로딩 (스캐닝 중)
    if (isAnalyzing) {
        return (
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                        <p className="text-sm font-bold text-slate-900">최근 1년 치 결제 내역을 분석 중입니다...</p>
                        <p className="text-xs text-slate-400">구독 서비스, 클라우드, 정기 결제를 찾고 있어요</p>
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonCard key={i} delay={i * 0.1} />
                ))}
            </div>
        );
    }

    const handleSave = async () => {
        if (!result) return;

        // 편지인 경우: 작성/발송 페이지로 내용 넘기고 이동
        if (result.type === "letter") {
            const letterContent = result.editedContent ?? result.content;
            setMessage(letterContent);
            setRecipient({ name: result.recipient, phone: "", relationship: "" });
            router.push("/create");
            return;
        }

        // 디지털 유산인 경우: 기존 API 저장
        setIsSaving(true);
        setSaveError("");
        try {
            const res = await fetch("/api/legacy/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ result }),
            });
            if (res.ok) {
                setIsSaved(true);
            } else {
                const data = await res.json();
                setSaveError(data.error || "저장에 실패했습니다.");
            }
        } catch {
            setSaveError("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    // ── 편지 에디터 ──────────────────────────────────────────────
    if (result?.type === "letter") {
        const letterContent = result.editedContent ?? result.content;
        return (
            <div className="flex flex-col h-full">
                {/* 헤더 */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                            {result.isComplete === false ? "📝 편지 작성 중..." : "✉️ 완성된 편지"}
                        </p>
                        <h2 className="text-lg font-bold text-slate-900">
                            {result.recipient ? `To. ${result.recipient}` : "수신자를 정해주세요"}
                        </h2>
                    </div>
                    {!isSaved ? (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || result.isComplete === false}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${result.isComplete === false
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            {isSaving ? "이동 중..." : "발송 설정하기"}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
                        >
                            <CheckCircle className="w-4 h-4" />
                            대시보드에서 확인하기 →
                        </button>
                    )}
                </div>

                {/* 저장 에러 */}
                {saveError && (
                    <div className="mx-6 mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                        {saveError}
                    </div>
                )}

                {/* 저장 완료 배너 */}
                {isSaved && (
                    <div className="mx-6 mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-green-800">편지가 저장되었습니다! 🎉</p>
                            <p className="text-xs text-green-600">대시보드에서 수신자 설정 및 발송 일정을 설정해주세요.</p>
                        </div>
                    </div>
                )}

                {/* 편지지 */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 relative min-h-64 font-serif">
                        <div className="absolute inset-x-8 top-8 bottom-8 flex flex-col gap-8 pointer-events-none">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-px bg-slate-100" />
                            ))}
                        </div>
                        <textarea
                            className="relative z-10 w-full bg-transparent text-slate-800 text-sm leading-8 resize-none focus:outline-none"
                            rows={12}
                            value={letterContent}
                            onChange={(e) =>
                                onResultChange({
                                    ...result,
                                    editedContent: e.target.value,
                                })
                            }
                        />
                    </div>
                    <p className="mt-3 text-xs text-slate-400 text-center">
                        내용을 직접 수정한 후 보관함에 저장할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    // ── 유산 리스트 ──────────────────────────────────────────────
    if (result?.type === "legacyList") {
        const items = result.items ?? [];

        const handleDeleteItem = (id: string) => {
            onResultChange({
                ...result,
                items: items.filter((item) => item.id !== id),
            });
        };

        return (
            <div className="flex flex-col h-full">
                {/* 헤더 */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">🗂️ 디지털 유산 목록</p>
                        <h2 className="text-base font-bold text-slate-900">
                            구독 / 디지털 계정{" "}
                            <span className="text-blue-600">{items.length}개</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            불필요한 항목은 삭제하고 필요한 것만 저장하세요.
                        </p>
                    </div>
                    {!isSaved ? (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || items.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${items.length === 0
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? "저장 중..." : "디지털 유산에 저장"}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push("/vault/create")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
                        >
                            <CheckCircle className="w-4 h-4" />
                            유산함 확인하기 →
                        </button>
                    )}
                </div>

                {/* 에러 / 저장 완료 배너 */}
                {saveError && (
                    <div className="mx-6 mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                        {saveError}
                    </div>
                )}
                {isSaved && (
                    <div className="mx-6 mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-green-800">디지털 유산에 저장 완료! 🎉</p>
                            <p className="text-xs text-green-600">유산함에서 언제든지 확인하고 관리할 수 있어요.</p>
                        </div>
                    </div>
                )}

                {/* 리스트 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    <AnimatePresence>
                        {items.map((item) => (
                            <LegacyCard key={item.id} item={item} onDelete={handleDeleteItem} />
                        ))}
                    </AnimatePresence>

                    {items.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            모든 항목이 삭제되었습니다.
                        </div>
                    )}

                    {/* 유산 직접 남기기 유도 */}
                    <div className="mt-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                        <p className="text-sm font-bold text-slate-800 mb-1">
                            더 남기고 싶은 유산이 있으신가요?
                        </p>
                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                            스캔으로 찾지 못한 계정이나 직접 기록하고 싶은 정보가있다면 아래 버튼을 이용해주세요.
                        </p>
                        <button
                            onClick={() => router.push("/vault/create")}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            데이터 유산 직접 남기기
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// 개별 유산 카드
function LegacyCard({ item, onDelete }: { item: LegacyItem; onDelete: (id: string) => void }) {
    const colorClass = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS["기타"];
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                        {item.category}
                    </span>
                </div>
                <p className="font-bold text-slate-900 text-sm truncate">{item.service}</p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{item.cost}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{item.date}</span>
                </div>
            </div>
            <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// 스켈레톤 카드
function SkeletonCard({ delay }: { delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
            className="bg-white border border-slate-100 rounded-xl p-4 space-y-2 overflow-hidden relative"
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-50 to-transparent" />
            <div className="h-3 bg-slate-100 rounded-full w-16" />
            <div className="h-4 bg-slate-100 rounded-full w-40" />
            <div className="h-3 bg-slate-100 rounded-full w-28" />
        </motion.div>
    );
}
