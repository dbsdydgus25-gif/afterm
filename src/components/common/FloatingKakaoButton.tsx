"use client";

import { MessageCircle } from "lucide-react";

export function FloatingKakaoButton() {
    return (
        <a
            href="http://pf.kakao.com/_cxfNAX"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 md:bottom-8 right-6 z-[9999] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-8 duration-700"
            aria-label="카카오톡 채널 문의"
        >
            <div className="relative group">
                <div className="absolute -inset-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
                <div className="w-14 h-14 bg-[#FAE100] rounded-full flex items-center justify-center shadow-lg border border-yellow-400/20 relative z-10">
                    <MessageCircle className="w-7 h-7 text-[#3C1E1E]" fill="currentColor" strokeWidth={0} />
                </div>

                {/* Tooltip */}
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    문의하기
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
            </div>
        </a>
    );
}
