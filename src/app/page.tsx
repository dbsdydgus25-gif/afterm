"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { useMemoryStore } from "@/store/useMemoryStore";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { Header } from "@/components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: "Standard" | "Pro", price: string }>({ name: "Pro", price: "₩4,900" });

  const { message, setMessage, recipient, setRecipient, user, setUser, plan } = useMemoryStore();
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Background slideshow logic
  const backgrounds = [
    "bg-gradient-to-br from-orange-50 to-amber-50",
    "bg-gradient-to-br from-blue-50 to-indigo-50",
    "bg-gradient-to-br from-rose-50 to-pink-50",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (plan: "Standard" | "Pro", price: string) => {
    setSelectedPlan({ name: plan, price });
    setIsPaymentOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
      <Header transparentOnTop={true} />

      {/* Hero Section */}
      <main className="flex flex-col items-center w-full">
        <section className="relative w-full flex flex-col items-center justify-center px-4 pt-24 pb-12 md:pt-32 md:pb-16 min-h-[90vh] overflow-hidden transition-colors duration-1000 ease-in-out">

          {/* Background Slideshow */}
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBgIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className={`absolute inset-0 ${backgrounds[currentBgIndex]}`}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-white/40 z-10 backdrop-blur-[1px]"></div>
          </div>

          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-10 animate-fade-in">

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-4"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.2] break-keep drop-shadow-sm">
                당신의 기억을<br className="sm:hidden" />
                <span className="text-blue-600 ml-2 sm:ml-3">1분 안에</span> 남겨보세요.
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 font-medium tracking-normal break-keep">
                떠난 후에도 당신이 기억되도록.
              </p>
            </motion.div>

            {/* Core Feature (Card Input) */}
            <div className="w-full space-y-6 animate-fade-in delay-75">
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-50 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-xl shadow-slate-200/60 ring-1 ring-white/50 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:shadow-2xl focus-within:-translate-y-1 p-2">
                  {/* To Input (Modern Design) */}
                  <div className="px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md tracking-wide">TO</span>
                      <input
                        type="text"
                        value={recipient.name}
                        onChange={(e) => setRecipient({ name: e.target.value })}
                        placeholder="받는 사람 입력"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 font-bold placeholder:text-slate-300 placeholder:font-normal text-lg p-0 font-sans"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="내용을 입력해주세요.."
                    className="min-h-[160px] sm:min-h-[200px] w-full p-6 text-xl leading-relaxed resize-none border-none bg-transparent focus-visible:ring-0 placeholder:text-gray-300 text-gray-800 font-medium"
                  />

                  {/* Media Upload Area */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-blue-500 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        <span className="text-sm font-medium">사진/동영상 추가</span>
                      </label>
                      <input id="file-upload" type="file" className="hidden" accept="image/*,video/*" />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => {
                  if (user) {
                    router.push('/create');
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                className="w-full sm:w-auto px-12 py-6 text-xl font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
              >
                무료로 시작하기
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <p className="text-sm font-medium text-gray-500">
                스크롤하여 더 알아보기
              </p>
            </motion.div>
          </div>
        </section>



        {/* Feature Section (Dark) */}
        <section className="w-full bg-slate-900 text-white py-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-12 gap-16 items-center">

              {/* Text Content */}
              <div className="md:col-span-5 space-y-10 text-left">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                    남겨진 사람들에게<br />
                    <span className="text-blue-400">가장 소중한 선물</span>이<br />
                    됩니다.
                  </h2>
                  <div className="w-16 h-1.5 bg-blue-500 rounded-full"></div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                  className="text-lg text-slate-400 leading-relaxed break-keep"
                >
                  Afterm은 당신의 생애 데이터를 안전하게 보관하고,
                  지정된 시점에 소중한 사람들에게 전달합니다.
                  단순한 메시지를 넘어, 당신의 목소리와 온기를 전하세요.
                </motion.p>

                <ul className="space-y-6 pt-4">
                  {[
                    "클라우드 기반의 안전한 데이터 영구 보관",
                    "원하는 시점(생일, 기념일 등)에 예약 전송",
                    "가족, 연인, 친구별 맞춤 메시지 설정"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-300 group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 group-hover:scale-125 transition-transform" />
                      <span className="text-lg leading-snug group-hover:text-blue-200 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Mockups */}
              <div className="md:col-span-7 relative flex justify-center md:justify-end perspective-1000">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-10 bg-blue-500/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>

                  <div className="grid gap-8">
                    {/* Card 1: Friend Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                      className="bg-slate-800/80 backdrop-blur border border-slate-700/50 p-6 rounded-2xl md:translate-x-8 transform transition hover:-translate-y-2 duration-500 shadow-2xl hover:shadow-blue-500/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl">🍺</div>
                          <div>
                            <span className="block text-xs text-indigo-400 mb-0.5">To. 내 친구</span>
                            <span className="text-base text-slate-200 font-bold">야 잘 지내냐?</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">2030.05.05</span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed pl-3 border-l-2 border-slate-700">
                        "이걸 볼 때쯤이면 난 아마... 그래도 웃으면서 봐라 임마."
                      </p>
                    </motion.div>

                    {/* Card 2: Daughter Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      className="bg-slate-800/95 backdrop-blur border border-blue-500/30 p-8 rounded-2xl md:-translate-x-4 transform md:-rotate-1 transition hover:rotate-0 hover:scale-[1.02] duration-500 z-10 shadow-2xl hover:shadow-blue-500/20"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <span className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 text-xl border border-blue-500/20">💌</span>
                          <div>
                            <span className="block text-sm text-blue-400/80 mb-0.5">To. 내 딸</span>
                            <span className="text-lg text-blue-50 font-bold">사랑하는 지민이에게</span>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-xs text-slate-300 font-mono">2040.12.25</span>
                      </div>
                      <p className="text-slate-300 text-lg leading-loose pl-6 my-6 border-l-2 border-slate-700">
                        "사랑하는 딸아 안녕? 엄마는...<br />
                        첫 입학하던 날의 그 설렘을 잊지 마."
                      </p>
                      <div className="flex justify-end pt-2">
                        <span className="text-sm text-slate-500 font-medium">From. 엄마가</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Trend Section (Real News) */}
        <section className="w-full bg-slate-50 py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-20 space-y-6"
            >
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide mb-2">TREND</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                삶을 미리 정리하는,<br className="md:hidden" /> 새로운 라이프스타일
              </h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
                웰다잉(Well-dying)은 이제 더 이상 낯선 단어가 아닙니다.<br className="hidden md:block" />
                많은 사람들이 자신의 삶을 능동적으로 마무리하고 준비하고 있습니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8"
            >
              {/* Article 1 */}
              <a href="https://careyounews.org" target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer block h-full">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-50 rounded-xl flex items-center justify-center text-xl md:text-3xl mb-4 md:mb-8 group-hover:scale-110 transition-transform">📉</div>
                <h3 className="text-base md:text-xl font-bold text-slate-900 mb-2 md:mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                  '안녕을 준비하는 세 가지 색', 웰다잉 세미나 개최
                </h3>
                <p className="hidden md:block text-slate-500 leading-relaxed mb-6 line-clamp-3">
                  삶과 죽음의 질 향상에 초점을 맞춘 2025년 웰다잉 세미나 소식. 유언장 작성 플랫폼과 엔딩노트 서비스 등 구체적인 실천 방안을 제시합니다.
                </p>
                <span className="text-xs md:text-sm font-semibold text-slate-400 group-hover:text-blue-500 flex items-center gap-1">
                  자세히 보기 <span className="text-lg">→</span>
                </span>
              </a>

              {/* Article 2 */}
              <a href="https://heirsearch.com" target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer block h-full">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-50 rounded-xl flex items-center justify-center text-xl md:text-3xl mb-4 md:mb-8 group-hover:scale-110 transition-transform">🔐</div>
                <h3 className="text-base md:text-xl font-bold text-slate-900 mb-2 md:mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                  디지털 유산, 선택이 아닌 필수... AI 저작물까지 범위 확대
                </h3>
                <p className="hidden md:block text-slate-500 leading-relaxed mb-6 line-clamp-3">
                  암호화폐부터 소셜 미디어 계정까지. 2025년 디지털 자산 상속 및 관리의 중요성이 대두되며 새로운 법적/사회적 준비가 요구되고 있습니다.
                </p>
                <span className="text-xs md:text-sm font-semibold text-slate-400 group-hover:text-blue-500 flex items-center gap-1">
                  자세히 보기 <span className="text-lg">→</span>
                </span>
              </a>

              {/* Article 3 */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer block h-full">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-50 rounded-xl flex items-center justify-center text-xl md:text-3xl mb-4 md:mb-8 group-hover:scale-110 transition-transform">🕊️</div>
                <h3 className="text-base md:text-xl font-bold text-slate-900 mb-2 md:mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                  "존엄하게 죽고 싶다"... 연명의료 거부 신청 280만 명 돌파
                </h3>
                <p className="hidden md:block text-slate-500 leading-relaxed mb-6 line-clamp-3">
                  웰다잉에 대한 사회적 관심 급증. 존엄한 마무리를 위한 제도적 장치와 실제 의료 현장의 변화를 다룬 심층 리포트.
                </p>
                <span className="text-xs md:text-sm font-semibold text-slate-400 group-hover:text-blue-500 flex items-center gap-1">
                  자세히 보기 <span className="text-lg">→</span>
                </span>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Online Memorial Section (New) */}
        <section className="w-full bg-slate-100/50 py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent opacity-60"></div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8 }}
                className="order-2 md:order-1 relative"
              >
                {/* Mockup / Visual */}
                <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Grandma" alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">보고싶은 할머니</div>
                      <div className="text-xs text-slate-500">2024.12.25 영면</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl rounded-tl-none">
                      <p className="text-slate-600 text-sm leading-relaxed">
                        "할머니, 오늘 첫눈이 왔어요. 할머니가 좋아하시던 군고구마 냄새가 나니까 더 보고싶네요.. 사랑해요."
                      </p>
                      <div className="mt-2 text-xs text-slate-400 font-medium">손녀 지민이가</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl rounded-tl-none">
                      <p className="text-blue-900 text-sm leading-relaxed">
                        "어머니, 편안하시죠? 저희들도 잘 지내고 있습니다. 꿈에서라도 한번 뵙고 싶습니다."
                      </p>
                      <div className="mt-2 text-blue-400 text-xs font-medium">아들 상훈 올림</div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                    <Link href="/memorial" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      추모관 방문하기 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </Link>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="order-1 md:order-2 space-y-8"
              >
                <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide">
                  NEW SERVICE
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                  그리운 마음을<br />
                  <span className="text-blue-600">온라인 추모관</span>에<br />
                  남겨보세요.
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                  시공간의 제약 없이, 언제 어디서나 고인을 추억할 수 있습니다.<br />
                  소중한 분을 위한 디지털 공간을 만들고, 가족 친지들과 함께<br />
                  따뜻한 메시지를 나누세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => router.push('/memorial')}
                    size="lg"
                    className="px-8 h-14 text-lg bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                  >
                    추모관 둘러보기
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section (Moved) */}
        <section className="w-full bg-white py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-16 space-y-4"
            >
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide mb-2">PRICING</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                당신의 기억을 위한<br className="sm:hidden" />
                최적의 플랜을 선택하세요.
              </h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
                Afterm은 당신의 소중한 메시지를 안전하게 보관하고,
                지정된 시점에 전달합니다.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Standard Plan */}
              <div className="rounded-3xl p-8 border border-slate-200 bg-white relative hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Standard</h3>
                <div className="text-4xl font-extrabold text-slate-900 mb-6">₩0 <span className="text-base font-normal text-slate-500">/ 월</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                    메시지 1개 전송
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                    파일 저장 공간 10MB
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✗</span>
                    프리미엄 템플릿 (미제공)
                  </li>
                </ul>
                <Button onClick={() => handleSubscribe("Standard", "₩0")} className="w-full py-6 rounded-xl text-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 font-bold shadow-sm">
                  지금 시작하기
                </Button>
              </div>

              {/* Pro Plan */}
              <div className="rounded-3xl p-8 border border-blue-100 bg-blue-50/50 relative hover:shadow-2xl transition-all duration-300 transform md:-translate-y-4">
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-3xl text-sm font-bold">Popular</div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Pro</h3>
                <div className="text-4xl font-extrabold text-slate-900 mb-6">₩4,900 <span className="text-base font-normal text-slate-500">/ 월</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    무제한 메시지 전송
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    파일 저장 공간 100GB
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    프리미엄 템플릿 제공
                  </li>
                </ul>
                <Button onClick={() => handleSubscribe("Pro", "₩4,900")} className="w-full py-6 rounded-xl text-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30">
                  Pro로 업그레이드
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="w-full py-24 bg-slate-900 text-center border-t border-slate-800">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-10">
            당신의 이야기는<br />
            <span className="text-blue-500">끝나지 않아야 합니다.</span>
          </h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              onClick={() => {
                if (user) {
                  router.push('/create');
                } else {
                  setIsModalOpen(true);
                }
              }}
              size="lg"
              className="px-16 py-8 text-xl rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-2xl hover:shadow-xl transition-all hover:-translate-y-1 font-bold"
            >
              무료로 기억 남기기
            </Button>
          </motion.div>
        </section>
      </main>

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        planName={selectedPlan.name}
        price={selectedPlan.price}
      />

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400 font-medium tracking-wide">© 2026 AFTERM. All rights reserved. (v2.1)</p>
        </div>
      </footer>
    </div>
  );
}
