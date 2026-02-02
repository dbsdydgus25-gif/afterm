"use client";

import { Header } from "@/components/layout/Header";

export default function NewsletterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header transparentOnTop={false} />

            <main className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-4">
                    📰
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    현재 준비중입니다.
                </h1>
                <p className="text-slate-500">
                    더 좋은 콘텐츠로 찾아뵙겠습니다.
                </p>
            </main>
        </div>
    );
}
