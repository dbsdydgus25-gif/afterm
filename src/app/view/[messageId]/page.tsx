"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMessageSenderInfo } from "@/app/actions/viewMessage";
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

    // 알림 중복 발송 방지
    const notificationSentRef = useRef(false);

    useEffect(() => {
        const fetchMessageInfo = async () => {
            if (!messageId) return;

            // 1. Fetch Sender Info via Server Action (Bypass RLS)
            const result = await getMessageSenderInfo(messageId);

            if (result.error || !result.senderName) {
                console.error("Message fetch error:", result.error);
                setError(result.error || "메시지를 찾을 수 없거나 접근 권한이 없습니다.");
            } else {
                setSenderName(result.senderName);

                // 2. Trigger Email Notification to Sender (Dead Man's Switch Alert)
                // Fire and Forget - 페이지 로딩을 막지 않음
                if (!notificationSentRef.current) {
                    notificationSentRef.current = true;
                    console.log("Triggering view notification...");
                    notifySenderOfView(messageId).then(res => {
                        if (!res.success) console.error("Notification failed:", res.error);
                    });
                }
            }
            setLoading(false);
        };

        fetchMessageInfo();
    }, [messageId]);

    const handleStatusCheck = async (status: 'alive' | 'critical') => {
        if (status === 'alive') {
            alert("다행입니다! 아직 메시지를 열람할 수 없는 상태입니다.");
        } else {
            if (confirm(`${senderName}님과 연락이 닿지 않으시나요?\n\n'확인'을 누르면 ${senderName}님에게 알림을 발송하고, 생존 확인 절차(약 1주일 기간 소요)를 시작합니다.\n\n절차가 완료될 때까지 메시지는 열람할 수 없습니다.`)) {
                // Call critical report action
                try {
                    const res = await reportIssue(messageId);
                    if (res.success) {
                        alert("확인 절차가 시작되었습니다.\n\n지금은 테스트 모드입니다.\n확인을 누르면 '인증 대기 화면(검은색)'으로 이동합니다.\n\n(1~2분 뒤에 인증을 시도해보세요)");
                        // Redirect to Auth Page (Black Screen)
                        window.location.href = `/view/${messageId}/auth`;
                    } else {
                        alert(`오류가 발생했습니다: ${res.error}`);
                    }
                } catch (e) {
                    console.error(e);
                    alert("처리 중 오류가 발생했습니다.");
                }
            }
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
                            <span className="text-blue-600 dark:text-blue-400">{senderName}</span>님의 상태에 따라<br />
                            메시지를 열람할 수 있습니다.
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            이 메시지는 작성자의 신변에 변화가 생겼을 때<br />
                            확인할 수 있도록 설정되어 있습니다.
                        </p>
                    </div>

                    <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium text-center leading-relaxed box-border break-keep">
                            현재 {senderName}님의 상태를 확인해주세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleStatusCheck('alive')}
                            className="flex flex-col items-center justify-center p-4 h-32 rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group"
                        >
                            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">☀️</span>
                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                잘 지내고 있다
                            </span>
                        </button>

                        <button
                            onClick={() => handleStatusCheck('critical')}
                            className="flex flex-col items-center justify-center p-4 h-32 rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 group"
                        >
                            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">🚨</span>
                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-red-600 dark:group-hover:text-red-400">
                                문제가 있다<br />(메시지 열람)
                            </span>
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
        </div>
    );
}
