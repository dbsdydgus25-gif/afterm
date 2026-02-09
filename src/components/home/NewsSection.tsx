"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const articles = [
    {
        icon: "🕊️",
        title: "2024년 사전연명의료의향서 등록자 200만 돌파",
        desc: "보건복지부에 따르면 사전연명의료의향서 등록자가 200만 명을 넘어섰습니다. 존엄한 마무리에 대한 관심이 급증하며 웰다잉 문화가 확산되고 있습니다.",
        link: "https://search.naver.com/search.naver?where=news&query=%EC%82%AC%EC%A0%84%EC%97%B0%EB%AA%85%EC%9D%98%EB%A3%8C%EC%9D%98%ED%96%A5%EC%84%9C+200%EB%A7%8C",
        bg: "bg-blue-50",
    },
    {
        icon: "📱",
        title: "\"내 디지털 흔적은 누가?\"... 디지털 유산 상속 법제화 논의",
        desc: "사망 후 남겨진 SNS 계정과 데이터를 어떻게 처리할 것인가? '잊힐 권리'와 '상속 권리' 사이의 논쟁과 국회의 입법 움직임을 확인해보세요.",
        link: "https://search.naver.com/search.naver?where=news&query=%EB%94%94%EC%A7%80%ED%84%B8+%EC%9C%A0%EC%82%B0+%EB%B2%95%EC%A0%9C%ED%99%94",
        bg: "bg-purple-50",
    },
    {
        icon: "🏛️",
        title: "우리 동네 '웰다잉' 프로그램: 지자체 조례 제정 잇따라",
        desc: "서울, 경기, 부산 등 전국 지자체에서 웰다잉 교육 및 엔딩노트 작성 지원 프로그램을 확대하고 있습니다. 거주지 주변의 프로그램을 찾아보세요.",
        link: "https://search.naver.com/search.naver?where=news&query=%EC%A7%80%EC%9E%90%EC%B2%B4+%EC%9B%B0%EB%8B%A4%EC%9E%89+%EC%A1%B0%EB%A1%80",
        bg: "bg-green-50",
    },
    {
        icon: "💐",
        title: "장례식 대신 '생전 장례식'... 2030 세대의 새로운 인식",
        desc: "형식적인 장례식보다 의미 있는 마무리를 선호하는 젊은 층을 중심으로, 살아생전 지인들과 인사를 나누는 '생전 장례식'이 주목받고 있습니다.",
        link: "https://search.naver.com/search.naver?where=news&query=%EC%83%9D%EC%A0%84+%EC%9E%A5%EB%A1%80%EC%8B%9D+%ED%8A%B8%EB%A0%8C%EB%93%9C",
        bg: "bg-pink-50",
    },
    {
        icon: "🤖",
        title: "1인 가구 1,000만 시대, AI 안부 확인과 고독사 예방",
        desc: "1인 가구 증가에 발맞춰, AI를 활용한 안부 확인 서비스와 고독사 예방 시스템이 진화하고 있습니다. 기술이 돌보는 마지막 삶의 모습을 취재했습니다.",
        link: "https://search.naver.com/search.naver?where=news&query=1%EC%9D%B8%EA%B0%80%EA%B5%AC+%EA%B3%A0%EB%8F%85%EC%82%AC+AI",
        bg: "bg-indigo-50",
    },
    {
        icon: "✍️",
        title: "유언장 쓰기, 이제는 필수... 모바일 유언장 작성 인기",
        desc: "복잡한 공증 절차 대신, 블록체인 등을 활용해 간편하게 법적 효력을 갖는 유언장을 작성하는 모바일 서비스들이 인기를 끌고 있습니다.",
        link: "https://search.naver.com/search.naver?where=news&query=%EB%AA%A8%EB%B0%94%EC%9D%BC+%EC%9C%A0%EC%96%B8%EC%9E%A5+%EC%84%9C%EB%B9%84%EC%8A%A4",
        bg: "bg-orange-50",
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
