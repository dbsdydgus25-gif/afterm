"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default function NoticePage() {
    const router = useRouter();

    const notices = [
        { id: 1, title: "[공지] 서비스 정식 오픈 안내", date: "2026.01.19" },
        { id: 2, title: "개인정보 처리방침 변경 예정 안내", date: "2026.01.15" },
        { id: 3, title: "[이벤트] 신규 가입자 대상 Pro 플랜 3개월 무료", date: "2026.01.01" },
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-6 pt-24 pb-20 w-full animate-fade-in">
                <h1 className="text-2xl font-bold text-slate-900 mb-8">공지사항</h1>
                <div className="divide-y divide-slate-100">
                    {notices.map((notice) => (
                        <div key={notice.id} className="py-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 px-4 -mx-4 rounded-xl transition-colors cursor-pointer gap-2 md:gap-0 border-b border-slate-50 last:border-0">
                            <span className="text-xs md:text-sm font-medium text-slate-800 break-keep leading-relaxed">{notice.title}</span>
                            <span className="text-[10px] md:text-xs text-slate-400 self-end md:self-auto">{notice.date}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
