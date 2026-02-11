"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const articles = [
    {
        icon: "🌟",
        title: "CES 2026 주목! '존엄한 마무리' 돕는 에이지테크",
        desc: "돌봄을 넘어선 글로벌 트렌드, 기술이 그리는 존엄한 노후와 마무리",
        link: "https://www.silvertoday.co.kr/news/articleView.html?idxno=13759",
        bg: "bg-blue-50", // Added default background color
    },
    {
        icon: "🌿",
        title: "2026 웰니스 트렌드, 오래 사는 것보다 '잘' 사는 법",
        desc: "단순한 수명 연장을 넘어 삶의 질과 정신적 회복, 아름다운 마무리까지",
        link: "https://www.idalhealth.com/news/articleView.html?idxno=407",
        bg: "bg-purple-50", // Added default background color
    },
    {
        icon: "📱",
        title: "\"웰다잉도 힙하게\" 생과 사의 시각을 바꾸는 MZ세대",
        desc: "2030 세대가 주도하는 새로운 문화, 모바일로 남기는 나만의 유언",
        link: "http://www.newscan.co.kr/news/articleView.html?idxno=303755",
        bg: "bg-green-50", // Added default background color
    },
    {
        icon: "🪙",
        title: "비트코인·SNS 계정, 내 '디지털 유산'은 누가 챙기나?",
        desc: "급증하는 디지털 자산, 사후 처리를 위한 플랫폼과 법적 논의의 필요성",
        link: "http://www.wealthm.co.kr/news/articleView.html?idxno=12205",
        bg: "bg-pink-50", // Added default background color
    },
    {
        icon: "⚖️",
        title: "“죽어서도 남는 계정” 고인의 프라이버시 vs 남겨진 권리",
        desc: "잊혀질 권리와 알 권리의 충돌, '디지털 유언장'의 법적·윤리적 중요성",
        link: "http://www.fintechtoday.co.kr/news/articleView.html?idxno=1961",
        bg: "bg-indigo-50", // Added default background color
    },
    {
        icon: "🧘",
        title: "나 혼자 간다, 스스로 죽음을 준비하는 '종활' 시대",
        desc: "1인 가구 증가가 불러온 새로운 풍경, 내 마지막을 스스로 정리하는 사람들",
        link: "https://www.kunews.ac.kr/news/articleView.html?idxno=42630",
        bg: "bg-orange-50", // Added default background color
    },
];

export const NewsSection = () => {
    // Duplicate articles for seamless infinite scroll (4 sets ensures smooth -50% loop)
    // 0% -> Shows Set 1 & 2
    // -50% -> Shows Set 3 & 4 (which looks exactly like Set 1 & 2)
    const rollingArticles = [...articles, ...articles, ...articles, ...articles];

    return (
        <section className="w-full bg-slate-50 py-16 md:py-24 overflow-hidden">
            <div className="w-full px-0">
                <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4 px-6 relative z-10 opacity-100">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-sm font-bold tracking-wide mb-2">
                        TREND
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                        삶을 미리 정리하는,<br className="md:hidden" /> 새로운 라이프스타일
                    </h2>
                    <p className="text-slate-500 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed">
                        웰다잉(Well-dying)은 이제 더 이상 낯선 단어가 아닙니다.<br className="hidden md:block" />
                        많은 사람들이 자신의 삶을 능동적으로 마무리하고 준비하고 있습니다.
                    </p>
                </div>

                {/* Ticker Container - Masked edges for better look */}
                <div className="relative w-full flex overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

                    <motion.div
                        className="flex gap-4 md:gap-8 px-4 md:px-0 will-change-transform"
                        animate={{
                            x: ["0%", "-50%"],
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 40,
                                ease: "linear",
                            },
                        }}
                        style={{
                            width: "max-content",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            perspective: 1000,
                            WebkitPerspective: 1000
                        }}
                    >
                        {rollingArticles.map((article, index) => (
                            <a
                                key={index}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl md:rounded-[2rem] overflow-hidden
                                            w-[160px] h-[160px] md:w-[400px] md:h-auto md:p-8 p-4 flex flex-col md:block flex-shrink-0 cursor-pointer"
                            >
                                {/* Mobile: Icon + Title Only (Square) */}
                                <div className="flex md:hidden flex-col h-full items-center justify-center text-center gap-3">
                                    <div className={`w-10 h-10 ${article.bg} rounded-full flex items-center justify-center text-xl`}>
                                        {article.icon}
                                    </div>
                                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug break-keep">
                                        {article.title}
                                    </h3>
                                </div>

                                {/* Desktop: Full Content */}
                                <div className="hidden md:block">
                                    <div
                                        className={`w-14 h-14 ${article.bg} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}
                                    >
                                        {article.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {article.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                                        {article.desc}
                                    </p>
                                    <span className="text-sm font-semibold text-slate-400 group-hover:text-blue-500 flex items-center gap-1 mt-auto">
                                        자세히 보기 <span className="text-lg">→</span>
                                    </span>
                                </div>
                            </a>
                        ))}
                    </motion.div>
                </div>

                {/* Subscription Form */}
                <div className="max-w-xl mx-auto px-6 mt-20 md:mt-24 text-center">
                    <div className="bg-white p-8 md:p-10 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>

                        <h3 className="text-base md:text-xl font-bold text-slate-900 mb-3">
                            매주 한 번, 웰다잉 트렌드를 받아보세요
                        </h3>
                        <p className="text-slate-500 text-xs md:text-sm mb-8 leading-relaxed">
                            가장 최신의 웰다잉 뉴스, 디지털 유산 관리 팁을<br className="md:hidden" /> 이메일로 정리해드립니다.
                        </p>

                        <SubscriptionForm />
                    </div>
                </div>
            </div>
        </section>
    );
};

export function SubscriptionForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [msg, setMsg] = useState("");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");

        try {
            const supabase = createClient();

            // Check if exists first (optional, or rely on unique constraint)
            const { error } = await supabase
                .from("newsletter_subscribers")
                .upsert({
                    email,
                    status: 'active',
                    unsubscribed_at: null
                }, { onConflict: 'email' });

            if (error) throw error;

            setStatus("success");
            setEmail("");
            setMsg("구독이 완료되었습니다! 매주 만나요 👋");
        } catch (error) {
            console.error(error);
            setStatus("error");
            setMsg("오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    return (
        <form onSubmit={handleSubscribe} className="relative max-w-sm mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "success" || status === "loading"}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                />
                <button
                    type="submit"
                    disabled={status === "success" || status === "loading"}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                    {status === "loading" ? "..." : "구독하기"}
                </button>
            </div>
            {msg && (
                <p className={`text-xs mt-3 font-medium ${status === "success" ? "text-blue-600" : "text-red-500"}`}>
                    {msg}
                </p>
            )}
        </form>
    );
}
