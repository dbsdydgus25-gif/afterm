"use client";

// ============================================================
// 메시지 작성 페이지 (create/page.tsx)
// 변경사항:
//   - 약관 동의 단계 제거 (온보딩에서 처리됨)
//   - 가디언즈 미설정 시 안내 모달 노출
//   - 메시지 저장은 가디언즈 인증 후 전달 (즉시 SMS 없음)
// ============================================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Shield, ArrowRight } from "lucide-react";

export default function CreatePage() {
    const router = useRouter();
    const { message, setMessage, files, setFiles, plan, user } = useMemoryStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentCount, setCurrentCount] = useState<number | null>(null);

    // 가디언즈 미설정 모달 상태
    const [showGuardianModal, setShowGuardianModal] = useState(false);
    const [guardianChecked, setGuardianChecked] = useState(false);

    const hasChanges = message.trim().length > 0 || files.length > 0;

    // 브라우저 레벨 이탈 경고 (새로고침/닫기)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    // 진입 시 메시지 수와 가디언즈 설정 여부 확인
    useEffect(() => {
        const init = async () => {
            if (!user?.id) return;
            const supabase = createClient();

            // 메시지 수 조회
            let query = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (plan !== 'pro') query = query.eq('archived', false);
            const { count } = await query;
            if (count !== null) setCurrentCount(count);

            // 가디언즈 설정 여부 확인
            const { count: guardianCount } = await supabase
                .from('guardians')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // 가디언즈 0명이면 모달 표시
            if (!guardianChecked && (guardianCount === 0 || guardianCount === null)) {
                setShowGuardianModal(true);
            }
            setGuardianChecked(true);
        };
        init();
    }, [user, plan, guardianChecked]);

    const handleNext = () => {
        if (!message.trim()) {
            alert("메시지를 입력해주세요.");
            return;
        }
        const LIMIT = plan === 'pro' ? 100 : 1;
        if (currentCount !== null && currentCount >= LIMIT) {
            alert(plan === 'pro'
                ? "Pro 요금제의 메시지 보관 한도(100개)를 초과했습니다."
                : "Basic 요금제에서는 메시지를 1개만 보관할 수 있습니다.\n추가 작성을 원하시면 Pro 요금제로 업그레이드 해주세요.");
            return;
        }
        router.push("/recipient");
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            const newFiles = Array.from(selectedFiles);
            const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
            const currentTotalSize = files.reduce((acc, file) => acc + file.size, 0);
            const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);
            if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
                alert(`한 메시지당 첨부 파일 용량은 총 10MB로 제한됩니다.`);
                return;
            }
            setFiles([...files, ...newFiles]);
        }
    };

    const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* 헤더 */}
            <header className="w-full bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between sticky top-0 z-50">
                <span className="text-xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => router.push('/')}>AFTERM</span>
                <div className="text-sm font-medium text-slate-500">메시지 남기기</div>
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
                            메시지는 가디언즈 인증 후 수신인에게 전달됩니다.
                            가디언즈(유산 관리자)를 최소 1명 이상 등록해야 메시지가 안전하게 전달됩니다.
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

            {/* 메시지 작성 화면 (약관 동의 단계 제거 - 온보딩에서 처리됨) */}
            <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col gap-6 animate-fade-in">
                <div className="space-y-1 mt-4">
                    <h1 className="text-lg font-bold text-slate-900">
                        남기고 싶은 이야기를<br />
                        자유롭게 작성해주세요.
                    </h1>
                    <p className="text-xs text-slate-500">사진이나 동영상도 함께 첨부할 수 있습니다.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[350px]">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="사랑하는 사람에게 전하고 싶은 말을 적어보세요..."
                        className="flex-1 w-full p-2 text-sm leading-relaxed resize-none border-none focus-visible:ring-0 placeholder:text-slate-300 text-slate-800"
                    />

                    {files.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-2 mb-2 px-1">
                            {files.map((file, idx) => (
                                <div key={idx} className="relative flex-shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-2 pr-6 flex items-center gap-2">
                                    <span className="text-lg">{file.type.startsWith('video') ? '🎥' : '📷'}</span>
                                    <div className="max-w-[100px] truncate text-[10px] font-medium text-slate-700">{file.name}</div>
                                    <button onClick={() => removeFile(idx)} className="absolute right-1 top-1 text-slate-400 hover:text-red-500">×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between">
                        <div className="flex gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
                                <span className="text-lg">📎</span>
                                <span className="text-xs font-medium">파일 추가</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
                        </div>
                        <div className="text-[10px] text-slate-300">
                            {files.length > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)}MB / ` : ""}최대 10MB
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-6">
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                    >
                        다음으로
                    </Button>
                </div>
            </main>
        </div>
    );
}
