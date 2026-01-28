"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMessageSenderInfo, getUnlockedMessageContent } from "@/app/actions/viewMessage";
import { notifySenderOfView } from "@/app/actions/notifySenderOfView";
import { reportIssue } from "@/app/actions/reportIssue";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

export default function MessageViewPage() {
    const params = useParams();
    const messageId = params.messageId as string;
    const [loading, setLoading] = useState(true);
    const [senderName, setSenderName] = useState("");
    const [error, setError] = useState("");

    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 알림 중복 발송 방지
    const notificationSentRef = useRef(false);

    useEffect(() => {
        const fetchMessageInfo = async () => {
            if (!messageId) return;

            // 0. Check if ALREADY UNLOCKED (Redirect immediately if so)
            // Import this action at the top: import { getMessageSenderInfo, getUnlockedMessageContent } from "@/app/actions/viewMessage";
            const unlockedCheck = await getUnlockedMessageContent(messageId);
            if (unlockedCheck?.success) {
                // Already unlocked -> Go directly to Auth page (which will display content)
                window.location.href = `/view/${messageId}/auth`;
                return;
            }

            // 1. Fetch Sender Info via Server Action (Bypass RLS)
            const result = await getMessageSenderInfo(messageId);

            if (result.error || !result.senderName) {
                console.error("Message fetch error:", result.error);
                setError(result.error || "메시지를 찾을 수 없거나 접근 권한이 없습니다.");
            } else {
                setSenderName(result.senderName);
            }
            setLoading(false);
        };

        fetchMessageInfo();
    }, [messageId]);

    const handleStatusCheck = async (status: 'alive' | 'critical') => {
        if (status === 'alive') {
            alert("다행입니다! 아직 메시지를 열람할 수 없는 상태입니다.");
        } else {
            setShowWarningModal(true);
        }
    };

    const confirmCriticalStatus = async () => {
        setShowWarningModal(false);
        try {
            const res = await reportIssue(messageId);
            if (res.success) {
                alert("2단계 과정은 총 48시간이 필요합니다 (1단계: 메일 확인, 2단계: 48시간 확인) 작성자가 응답하지 않으면 메시지로 알림이 전달 될 예정입니다.");
                window.location.href = `/view/${messageId}/auth`;
            } else {
                alert(`오류가 발생했습니다: ${res.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
                <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">접근 불가</h1>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-left">
                            <p className="text-red-600 dark:text-red-400 text-xs font-mono break-all whitespace-pre-wrap">
                                {error}
                            </p>
                        </div>
                    </div>
                    <Link href="/" className="block">
                        <Button className="w-full rounded-xl h-12">홈으로 돌아가기</Button>
                    </Link>
                    <div className="text-[10px] text-zinc-300 font-mono">ID: {messageId}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />

            <div className="w-full max-w-[400px] z-10 animate-fade-in-up">

                {/* Brand / Logo Area - Clickable & No Text */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ring-white dark:ring-zinc-900 hover:opacity-90 transition-opacity active:scale-95 duration-200">
                        <Image
                            src="/logo.jpg"
                            alt="AFTERM Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                    </Link>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl p-8 space-y-8 ring-1 ring-black/5 dark:ring-white/10">

                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-bold leading-snug text-zinc-900 dark:text-zinc-100">
                            <span className="text-blue-600 dark:text-blue-400">{senderName}</span>님이 당신에게<br />
                            소중한 메시지를 남겼습니다
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            단, 이 메시지는 작성자가 <strong className="text-amber-600 dark:text-amber-400">문제가 있을 시에만</strong><br />
                            열람할 수 있도록 설정되어 있습니다
                        </p>
                    </div>

                    {/* Status Check Banner Removed */}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setShowWarningModal(true)}
                            className="w-full h-14 text-lg font-bold rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200"
                        >
                            메시지 확인하기
                        </button>
                    </div>

                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        떠난 후에도 당신이 기억 되도록. 에프텀
                    </p>
                    <div className="text-[10px] text-zinc-300/50 font-mono">
                        Ref: {messageId?.slice(0, 8)}...
                    </div>
                </div>
            </div>

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                주의!
                            </h3>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 leading-relaxed break-keep">
                                <p className="font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    이 메시지는 작성자가 <strong>문제가 있을 시에만</strong> 열람할 수 있도록 설정되어있습니다.
                                </p>
                                <p>
                                    확인을 누르시면 <strong className="text-zinc-900 dark:text-zinc-100">작성자에게도 열람 메일이 갑니다.</strong>
                                </p>
                                <p className="text-xs text-zinc-500">
                                    그래도 누르시겠습니까?
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowWarningModal(false)}
                                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800"
                            >
                                취소
                            </Button>
                            <Button
                                disabled={isProcessing}
                                onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                        // 메일 발송
                                        await notifySenderOfView(messageId);
                                        // 인증 페이지로 이동
                                        window.location.href = `/view/${messageId}/auth`;
                                    } catch (e) {
                                        console.error(e);
                                        setIsProcessing(false);
                                        alert("처리 중 오류가 발생했습니다.");
                                    }
                                }}
                                className="h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        처리 중...
                                    </>
                                ) : (
                                    "확인"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
