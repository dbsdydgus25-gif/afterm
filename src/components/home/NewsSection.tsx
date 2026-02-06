"use client";

import { motion } from "framer-motion";

const articles = [
    {
        icon: "📉",
        title: "'안녕을 준비하는 세 가지 색', 웰다잉 세미나 개최",
        desc: "삶과 죽음의 질 향상에 초점을 맞춘 2025년 웰다잉 세미나 소식. 유언장 작성 플랫폼과 엔딩노트 서비스 등 구체적인 실천 방안을 제시합니다.",
        link: "https://careyounews.org",
        bg: "bg-orange-50",
    },
    {
        icon: "🔐",
        title: "디지털 유산, 선택이 아닌 필수... AI 저작물까지 범위 확대",
        desc: "암호화폐부터 소셜 미디어 계정까지. 2025년 디지털 자산 상속 및 관리의 중요성이 대두되며 새로운 법적/사회적 준비가 요구되고 있습니다.",
        link: "https://heirsearch.com",
        bg: "bg-purple-50",
    },
    {
        icon: "🕊️",
        title: "\"존엄하게 죽고 싶다\"... 연명의료 거부 신청 280만 명 돌파",
        desc: "웰다잉에 대한 사회적 관심 급증. 존엄한 마무리를 위한 제도적 장치와 실제 의료 현장의 변화를 다룬 심층 리포트.",
        link: "https://youtube.com",
        bg: "bg-blue-50",
    },
    // Placeholders
    {
        icon: "📑",
        title: "1인 가구를 위한 '사전 장례식' 문화 확산",
        desc: "혼자 사는 1인 가구가 늘어나며, 자신의 마지막을 미리 준비하고 지인들과 작별 인사를 나누는 새로운 장례 문화가 자리잡고 있습니다.",
        link: "#",
        bg: "bg-emerald-50",
    },
    {
        icon: "💾",
        title: "당신의 SNS 계정, 사후에는 어떻게 될까요?",
        desc: "페이스북, 인스타그램, 구글 등 주요 IT 기업들의 '추모 계정' 및 '휴면 계정 관리' 정책을 총정리해 드립니다.",
        link: "#",
        bg: "bg-rose-50",
    },
    {
        icon: "⚖️",
        title: "유언장 효력, 이것만은 꼭 챙기세요",
        desc: "자필 증서부터 공정 증서까지. 법적 효력을 갖는 유언장 작성 필수 체크리스트와 주의사항을 변호사가 직접 알려드립니다.",
        link: "#",
        bg: "bg-indigo-50",
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
                    </motion.div>
                </div>

                {/* Subscription Form */}
                <div className="max-w-xl mx-auto px-6 mt-16 md:mt-24 text-center">
                    <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                        
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
                            매월 1일, 웰다잉 트렌드를 받아보세요
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            가장 최신의 웰다잉 뉴스, 디지털 유산 관리 팁을<br className="md:hidden" /> 이메일로 정리해드립니다.
                        </p>

                        <SubscriptionForm />
                    </div>
                    </motion.div>
                </div>

                {/* Subscription Form */}
                <div className="max-w-xl mx-auto px-6 mt-16 md:mt-24 text-center">
                    <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                        
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
                            매월 1일, 웰다잉 트렌드를 받아보세요
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            가장 최신의 웰다잉 뉴스, 디지털 유산 관리 팁을<br className="md:hidden" /> 이메일로 정리해드립니다.
                        </p>

                        <SubscriptionForm />
                    </div>
                </div>
            </div>
        </section>
    );
};

function SubscriptionForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [msg, setMsg] = useState("");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        
        // Dynamic import to avoid top-level optional dependency issues if any
        const { createClient } = require("@/lib/supabase/client");
        const supabase = createClient();

        try {
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
            setMsg("구독이 완료되었습니다! 매월 1일에 만나요 👋");
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

// Add imports to top
import { useState } from "react";


function SubscriptionForm() {
    // We import hooks here to keep the main component cleaner if desired, 
    // or we can move this to a separate file. For now, inline is fine.
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [msg, setMsg] = useState("");

    // Need supabase client
    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        
        // Dynamic import or passed as prop would be better, but for simplicity:
        // We need to import createClient at top level if not present.
        // Assuming createClient is imported at top.
        const { createClient } = require("@/lib/supabase/client");
        const supabase = createClient();

        try {
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
            setMsg("구독이 완료되었습니다! 매월 1일에 만나요 👋");
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

// Add imports to top
import { useState } from "react";

