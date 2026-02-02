"use client";

import { Header } from "@/components/layout/Header";

export default function NewsletterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header transparentOnTop={false} />

            <main className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl mb-2">
                    📰
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                    현재 준비중입니다.
                </h1>
                <p className="text-sm text-slate-500">
                    더 좋은 콘텐츠로 찾아뵙겠습니다.
                </p>
            </main>
        </div>
    );
}
