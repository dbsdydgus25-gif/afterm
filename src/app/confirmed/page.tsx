"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConfirmedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl text-center space-y-6 animate-fade-in-up">
                <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    생존이 확인되었습니다
                </h1>

                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl space-y-2">
                    <p className="text-green-700 dark:text-green-400 font-medium text-sm">
                        부재 확인 프로세스가 취소되었습니다.
                    </p>
                    <p className="text-green-600/80 dark:text-green-400/80 text-xs">
                        작성자님의 안전이 확인되어<br />
                        메시지는 계속 <strong>잠금 상태</strong>로 유지됩니다.
                    </p>
                </div>

                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    수신인에게는<br />
                    "작성자가 직접 확인하여 메시지를 열람할 수 없음"<br />
                    으로 안내됩니다.
                </p>

                <Link href="/" className="block">
                    <Button className="w-full h-12 text-lg rounded-xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800">
                        홈으로 돌아가기
                    </Button>
                </Link>
            </div>
        </div>
    );
}
