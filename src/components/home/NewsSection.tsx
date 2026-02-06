"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const articles = [
    {
        icon: "⚖️",
        title: "디지털 유산, 법적 근거 마련되나... 국회 입법 논의 '활발'",
        desc: "2025년, 디지털 자산의 상속과 처리에 관한 법적 공백을 메우기 위한 입법 논의가 구체화되고 있습니다. 개인정보 보호와 상속권 사이의 균형점을 찾기 위한 국회의 움직임을 전합니다.",
        link: "https://www.etnews.com",
        bg: "bg-indigo-50",
    },
    {
        icon: "🕊️",
        title: "\"존엄하게 죽고 싶다\"... 연명의료 거부 신청 280만 명 돌파",
        desc: "2025년 5월, 웰다잉에 대한 사회적 관심이 급증하며 사전연명의료의향서 등록자가 역대 최고치를 기록했습니다. 실제 의료 현장의 변화를 KBS 뉴스가 보도합니다.",
        link: "https://news.kbs.co.kr/news/view.do?ncd=7683935", // Example real link structure closer to actual report
        bg: "bg-blue-50",
    },
    {
        icon: "📢",
        title: "2025 웰다잉 트렌드: 이제는 '준비된 이별'이 문화다",
        desc: "죽음을 금기시하던 문화에서 벗어나, 적극적으로 자신의 마지막을 기록하고 공유하는 '엔딩노트' 작성이 2030 세대에게도 새로운 트렌드로 자리잡고 있습니다.",
        link: "https://www.careyounews.org",
        bg: "bg-orange-50",
    },
    {
        icon: "📱",
        title: "나의 SNS 계정, 사후에는 어떻게 될까? '잊힐 권리' 주목",
        desc: "페이스북, 인스타그램 등 글로벌 IT 기업들의 추모 계정 정책과 고인의 디지털 흔적을 지우거나 남길 수 있는 '디지털 잊힐 권리'에 대한 최신 가이드를 소개합니다.",
        link: "https://www.munhwa.com",
        bg: "bg-purple-50",
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
                <div className="max-w-xl mx-auto px-6 mt-16 md:mt-24 text-center">
                    <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>

                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
                            매주 한 번, 웰다잉 트렌드를 받아보세요
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
