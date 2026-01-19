"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default function NoticePage() {
    const router = useRouter();

    const notices = [
        { id: 1, title: "[공지] 서비스 정식 오픈 안내", date: "2026.01.19" },
        { id: 2, title: "개인정보 처리방침 변경 예정 안내", date: "2026.01.15" },
        { id: 3, title: "[이벤트] 신규 가입자 대상 Pro 플랜 1개월 무료", date: "2026.01.01" },
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-6 pt-32 pb-20 w-full animate-fade-in">
                <h1 className="text-4xl font-bold text-slate-900 mb-12">공지사항</h1>
                <div className="divide-y divide-slate-100">
                    {notices.map((notice) => (
                        <div key={notice.id} className="py-6 flex justify-between items-center hover:bg-slate-50 px-4 -mx-4 rounded-xl transition-colors cursor-pointer">
                            <span className="text-lg font-medium text-slate-800">{notice.title}</span>
                            <span className="text-sm text-slate-400">{notice.date}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
