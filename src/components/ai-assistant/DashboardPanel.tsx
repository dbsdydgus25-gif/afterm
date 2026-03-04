"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Save, CheckCircle, Plus, ArrowRight } from "lucide-react";
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

function LoadingIconCycle({ steps }: { steps: { icon: string; msg: string }[] }) {
    const [idx, setIdx] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            setIdx(prev => (prev + 1) % steps.length);
        }, 1600);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [idx, steps.length]);

    const current = steps[idx];
    return (
        <div className="flex flex-col items-center gap-6 py-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.2, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-6xl md:text-7xl"
                >
                    {current.icon}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.p
                    key={`msg-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="text-sm font-semibold text-slate-600 text-center"
                >
                    {current.msg}
                </motion.p>
            </AnimatePresence>
            {/* 도트 인디케이터 */}
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-blue-500' : 'w-2 h-2 bg-slate-200'}`}
                    />
                ))}
            </div>
            <p className="text-xs text-slate-400">이메일에서 데이터를 가져오고 있어요...</p>
        </div>
    );
}


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

    // 스켈레톤 로딩 (스캐닝 중) - 재밌는 아이콘 & 상태 메시지
    if (isAnalyzing) {
        const loadingSteps = [
            { icon: "📧", msg: "Gmail 메일함을 열고 있어요..." },
            { icon: "🔍", msg: "디지털 유산을 찾고 있어요..." },
            { icon: "💳", msg: "결제 내역을 분석 중이에요..." },
            { icon: "📱", msg: "구독 서비스 이용 내역을 분석 중이에요..." },
            { icon: "☁️", msg: "클라우드 서비스를 확인하고 있어요..." },
            { icon: "🎵", msg: "음악·영상 스트리밍을 찾는 중이에요..." },
            { icon: "🔐", msg: "보안 계정 정보를 정리하고 있어요..." },
            { icon: "✨", msg: "거의 다 됐어요! 마무리 중이에요..." },
        ];
        return (
            <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
                <LoadingIconCycle steps={loadingSteps} />
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

        // 디지털 유산인 경우: 기존 API 저장 후 대시보드로 이동
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
                // 저장 완료 후 1.2초 뒤 대시보드로 자동 이동
                setTimeout(() => router.push("/dashboard"), 1200);
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
                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
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
                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
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
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* 1. 유료 구독 서비스 */}
                    {items.filter(item => !item.cost.includes("무료") && !item.cost.includes("알 수 없음")).length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-4 bg-rose-500 rounded-full" />
                                <h3 className="text-sm font-bold text-slate-800">유료 구독 서비스</h3>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {items
                                        .filter(item => !item.cost.includes("무료") && !item.cost.includes("알 수 없음"))
                                        .map((item) => (
                                            <EnhancedLegacyCard
                                                key={item.id}
                                                item={item}
                                                onDelete={handleDeleteItem}
                                                onUpdate={(updated) => {
                                                    onResultChange({
                                                        ...result,
                                                        items: items.map(it => it.id === updated.id ? updated : it)
                                                    });
                                                }}
                                            />
                                        ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* 2. 일반 이용 서비스 */}
                    {items.filter(item => item.cost.includes("무료") || item.cost.includes("알 수 없음")).length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-4 bg-blue-500 rounded-full" />
                                <h3 className="text-sm font-bold text-slate-800">일반 이용 서비스</h3>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {items
                                        .filter(item => item.cost.includes("무료") || item.cost.includes("알 수 없음"))
                                        .map((item) => (
                                            <EnhancedLegacyCard
                                                key={item.id}
                                                item={item}
                                                onDelete={handleDeleteItem}
                                                onUpdate={(updated) => {
                                                    onResultChange({
                                                        ...result,
                                                        items: items.map(it => it.id === updated.id ? updated : it)
                                                    });
                                                }}
                                            />
                                        ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

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
                            스캔으로 찾지 못한 계정이나 직접 기록하고 싶은 정보가 있다면 아래 버튼을 이용해주세요.
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

interface EnhancedLegacyCardProps {
    item: LegacyItem;
    onDelete: (id: string) => void;
    onUpdate: (item: LegacyItem) => void;
}

function EnhancedLegacyCard({ item, onDelete, onUpdate }: EnhancedLegacyCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const colorClass = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS["기타"];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
            <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                            {item.category}
                        </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm truncate">{item.service}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-slate-500">{item.cost}</span>
                        <span className="text-slate-300 text-[10px]">|</span>
                        <span className="text-[11px] text-slate-400">
                            {item.date.includes("갱신") || item.date.includes("결제") ? item.date : `갱신예정: ${item.date}`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                            정보 입력
                        </span>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-5 border-t border-slate-50 space-y-4 pt-4"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">아이디 (ID)</label>
                                <input
                                    type="text"
                                    value={item.username || ""}
                                    onChange={(e) => onUpdate({ ...item, username: e.target.value })}
                                    placeholder="계정 아이디 입력"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">비밀번호 (PW)</label>
                                <input
                                    type="text"
                                    value={item.password || ""}
                                    onChange={(e) => onUpdate({ ...item, password: e.target.value })}
                                    placeholder="비밀번호 힌트 등"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 ml-1">관련 메모</label>
                            <textarea
                                value={item.memo || ""}
                                onChange={(e) => onUpdate({ ...item, memo: e.target.value })}
                                placeholder="남기고 싶은 정보를 적어주세요 (예: 매달 가족 공유 중)"
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
