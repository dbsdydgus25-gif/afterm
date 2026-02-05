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
    return (
        <section className="w-full bg-slate-50 py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 space-y-4"
                >
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
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {articles.map((article, index) => (
                        <motion.a
                            key={index}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "0px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer block h-full flex flex-col"
                        >
                            <div
                                className={`w-14 h-14 ${article.bg} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}
                            >
                                {article.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {article.title}
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                                {article.desc}
                            </p>
                            <span className="text-sm font-semibold text-slate-400 group-hover:text-blue-500 flex items-center gap-1 mt-auto">
                                자세히 보기 <span className="text-lg">→</span>
                            </span>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
};
