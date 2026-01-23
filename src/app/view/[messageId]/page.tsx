"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMessageSenderInfo } from "@/app/actions/viewMessage";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function MessageViewPage() {
    const params = useParams();
    const messageId = params.messageId as string;
    const [loading, setLoading] = useState(true);
    const [senderName, setSenderName] = useState("");
    const [error, setError] = useState("");

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
            }
            setLoading(false);
        };

        fetchMessageInfo();
    }, [messageId]);

    const handleStatusCheck = (status: 'alive' | 'critical') => {
        if (status === 'alive') {
            alert("다행입니다! 아직 메시지를 열람할 수 없는 상태입니다.");
        } else {
            alert("비상 연락망에 알림을 전송하고 메시지 열람 절차를 시작합니다. (기능 준비 중)");
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center">
                <h1 className="text-xl font-bold mb-4">접근 불가</h1>
                <p className="text-zinc-500 mb-8 whitespace-pre-wrap">{error}</p>
                <Link href="/">
                    <Button>홈으로 돌아가기</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 relative">
            {/* Logo */}
            <div className="absolute top-8 left-0 right-0 flex justify-center">
                <Link href="/" className="text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity">
                    AFTERM
                </Link>
            </div>

            <div className="w-full max-w-md space-y-12 animate-fade-in text-center">

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold leading-tight break-keep">
                        <span className="text-primary">{senderName}</span>님이 보낸<br />
                        소중한 메시지가 담겨 있습니다
                    </h1>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium leading-relaxed break-keep">
                            ⚠️ 이 메시지는 <strong>{senderName}</strong>님의 신변에 문제가 생겼을 때만 열람할 수 있도록 설정되어 있습니다.
                        </p>
                    </div>
                </div>

                <div className="space-y-6 pt-4">
                    <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                        {senderName}님, 현재 어떤 상태인가요?
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleStatusCheck('alive')}
                            className="h-32 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">☀️</span>
                            <span className="font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">살아있다</span>
                        </button>

                        <button
                            onClick={() => handleStatusCheck('critical')}
                            className="h-32 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🚑</span>
                            <span className="font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-red-600 dark:group-hover:text-red-400">힘든 상황이다</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
