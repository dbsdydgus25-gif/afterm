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
            {/* Typography */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.2] break-keep drop-shadow-sm whitespace-nowrap">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="inline-block mr-1.5 sm:mr-3"
                >
                  갑자기 떠나도
                </motion.span>
                <span className="text-blue-600 inline-block mr-1.5 sm:mr-3">1분이면</span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  className="inline-block"
                >
                  괜찮아
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="text-xs sm:text-lg text-gray-500 font-medium tracking-normal break-keep"
              >
                소중한 사람들을 위한 마지막 센스<br />
                미리 저장하는 안부인사
              </motion.p>
            </motion.div>

            {/* Core Feature (Card Input) */}
            <div className="w-full space-y-6 animate-fade-in delay-75">
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-50 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-xl shadow-slate-200/60 ring-1 ring-white/50 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:shadow-2xl focus-within:-translate-y-1 p-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="내용을 입력해주세요.."
                    className="min-h-[120px] sm:min-h-[160px] w-full p-6 text-lg leading-relaxed resize-none border-none bg-transparent focus-visible:ring-0 placeholder:text-gray-300 text-gray-800 font-medium"
                  />
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
                className="w-full sm:w-auto px-12 py-6 text-lg sm:text-xl font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
              >
                저장하기
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
                  AFTERM(에프텀)은 당신의 생애 데이터를 안전하게 보관하고,
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

                  <div className="grid gap-6">
                    {/* Card 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                      className="bg-slate-800/80 backdrop-blur border border-slate-700/50 p-6 rounded-2xl md:w-[90%] md:translate-x-0 transform transition hover:-translate-y-2 duration-500 shadow-2xl hover:shadow-blue-500/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl">🎉</div>
                          <div>
                            <span className="block text-xs text-indigo-400 mb-0.5">To. ooo</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed pl-3 border-l-2 border-slate-700">
                        "내 장례식은 파티였음 좋겠음, 클럽 노래 틀고 즐기다가 가~"
                      </p>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                      className="bg-slate-800/95 backdrop-blur border border-blue-500/30 p-8 rounded-2xl md:w-[105%] md:-translate-x-8 transform transition hover:scale-[1.02] duration-500 z-10 shadow-2xl hover:shadow-blue-500/20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">📺</div>
                          <div>
                            <span className="block text-sm text-blue-400/80 mb-0.5">To. ooo</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-blue-50 text-base leading-relaxed pl-3 border-l-2 border-slate-700">
                        "이번 생 재밌었다 넷플, 티빙 계정 남긴다. 나머지는 너가 내 ^^"
                      </p>
                    </motion.div>

                    {/* Card 3 (New) */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      className="bg-slate-800/90 backdrop-blur border border-slate-700/50 p-6 rounded-2xl md:w-[95%] md:translate-x-4 transform transition hover:-translate-y-2 duration-500 shadow-2xl hover:shadow-blue-500/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xl">🍲</div>
                          <div>
                            <span className="block text-xs text-orange-400 mb-0.5">To. ooo</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed pl-3 border-l-2 border-slate-700">
                        "엄마 된찌 레시피 남겨놓을테니까 이대로만해~"
                      </p>
                    </motion.div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Online Memorial Section (Moved Up) */}
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

        {/* Trend Section (Real News - Infinite Rolling) */}
        <section className="w-full bg-slate-50 py-32 overflow-hidden">
          <div className="max-w-[1920px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-16 space-y-6 px-6"
            >
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide mb-2">TREND</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                삶을 미리 정리하는,<br className="md:hidden" /> 새로운 라이프스타일
              </h2>
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                웰다잉(Well-dying)은 이제 더 이상 낯선 단어가 아닙니다.<br className="hidden md:block" />
                많은 사람들이 자신의 삶을 능동적으로 마무리하고 준비하고 있습니다.
              </p>
            </motion.div>

            {/* Rolling Carousel */}
            <div className="relative w-full flex overflow-hidden group">
              <motion.div
                className="flex gap-6 w-max"
                animate={{ x: "-50%" }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: 40,
                }}
                whileHover={{ animationPlayState: "paused" }}
              >
                {[
                  ...[
                    {
                      source: "[매일경제]",
                      title: "\"엄마, 저 없이도 잘 지내세요\"... 죽음 미리 준비하는 MZ들",
                      desc: "최근 젊은 층 사이에서 유행하는 '유언장 미리 쓰기'와 웰다잉 트렌드 소개.",
                      icon: "📝",
                      color: "bg-orange-50",
                      link: "https://www.google.com/search?q=site:mk.co.kr+%EC%97%84%EB%A7%88+%EC%A0%80+%EC%97%86%EC%9D%B4%EB%8F%84+%EC%9E%98+%EC%A7%80%EB%82%B4%EC%84%B8%EC%9A%94+%EC%A3%BD%EC%9D%8C+%EB%AF%B8%EB%A6%AC+%EC%A4%80%EB%B9%84%ED%95%98%EB%8A%94+MZ%EB%93%A4"
                    },
                    {
                      source: "[YTN 사이언스]",
                      title: "삶을 아름답게 마무리하는 '웰다잉' 문화",
                      desc: "갑작스러운 죽음에 대비해 미리 엔딩노트를 작성하고 주변을 정리하는 문화 확산.",
                      icon: "🌿",
                      color: "bg-green-50",
                      link: "https://www.google.com/search?q=site:ytn.co.kr+%EC%82%B6%EC%9D%84+%EC%95%84%EB%A6%84%EB%8B%B5%EA%B2%8C+%EB%A7%88%EB%AC%B4%EB%A6%AC%ED%95%98%EB%8A%94+%EC%9B%B0%EB%8B%A4%EC%9E%89+%EB%AC%B8%ED%99%94"
                    },
                    {
                      source: "[시사저널]",
                      title: "죽음 준비하는 사람이 늘고 있다",
                      desc: "예고 없는 죽음이 남은 가족에게 주는 충격을 줄이기 위해 평소 준비가 필요하다는 전문가 인터뷰.",
                      icon: "⏳",
                      color: "bg-purple-50",
                      link: "https://www.google.com/search?q=site:sisajournal.com+%EC%A3%BD%EC%9D%8C+%EC%A4%80%EB%B9%84%ED%95%98%EB%8A%94+%EC%82%AC%EB%9E%8C%EC%9D%B4+%EB%8A%98%EA%B3%A0+%EC%9E%88%EB%8B%A4"
                    },
                    {
                      source: "[대학신문]",
                      title: "사람은 죽어서 아이디를 남길까? 디지털 유산의 시대",
                      desc: "싸이월드, SNS 등 고인이 남긴 디지털 기록을 가족에게 어떻게 전달할 것인가에 대한 이슈.",
                      icon: "💻",
                      color: "bg-blue-50",
                      link: "https://www.google.com/search?q=site:snunews.com+%EC%82%AC%EB%9E%8C%EC%9D%80+%EC%A3%BD%EC%96%B4%EC%84%9C+%EC%95%84%EC%9D%B4%EB%94%94%EB%A5%BC+%EB%82%A8%EA%B8%B8%EA%B9%8C+%EB%94%94%EC%A7%80%ED%84%B8+%EC%9C%A0%EC%82%B0%EC%9D%98+%EC%8B%9C%EB%8C%80"
                    },
                    {
                      source: "[한겨레]",
                      title: "내 장례식은 축제처럼… 배우 박정자의 생전 장례식",
                      desc: "장례식이 슬픈 이별식이 아니라, 소중한 사람들과 나누는 마지막 파티가 될 수 있음을 보여주는 사례.",
                      icon: "🎉",
                      color: "bg-red-50",
                      link: "https://www.google.com/search?q=site:hani.co.kr+%EB%82%B4+%EC%9E%A5%EB%A1%80%EC%8B%9D%EC%9D%80+%EC%B6%95%EC%A0%9C%EC%B2%98%EB%9F%BC+%EB%B0%B0%EC%9A%B0+%EB%B0%95%EC%A0%95%EC%9E%90%EC%9D%98+%EC%83%9D%EC%A0%84+%EC%9E%A5%EB%A1%80%EC%8B%9D"
                    },
                    {
                      source: "[동아일보]",
                      title: "출산보다 많아진 죽음… 내 마지막은 내가 디자인한다",
                      desc: "1인 가구 증가와 고령화로 인해 스스로 자신의 마지막을 계획하고 준비하는 사회적 변화.",
                      icon: "📊",
                      color: "bg-indigo-50",
                      link: "https://www.google.com/search?q=site:donga.com+%EC%B6%9C%EC%82%B0%EB%B3%B4%EB%8B%A4+%EB%A7%8E%EC%95%84%EC%A7%84+%EC%A3%BD%EC%9D%8C+%EB%82%B4+%EB%A7%88%EC%A7%80%EB%A7%89%EC%9D%80+%EB%82%B4%EA%B0%80+%EB%94%94%EC%9E%90%EC%9D%B8%ED%95%9C%EB%8B%A4"
                    }
                  ],
                  // Duplicate for infinite loop
                  ...[
                    {
                      source: "[매일경제]",
                      title: "\"엄마, 저 없이도 잘 지내세요\"... 죽음 미리 준비하는 MZ들",
                      desc: "최근 젊은 층 사이에서 유행하는 '유언장 미리 쓰기'와 웰다잉 트렌드 소개.",
                      icon: "📝",
                      color: "bg-orange-50",
                      link: "https://www.google.com/search?q=site:mk.co.kr+%EC%97%84%EB%A7%88+%EC%A0%80+%EC%97%86%EC%9D%B4%EB%8F%84+%EC%9E%98+%EC%A7%80%EB%82%B4%EC%84%B8%EC%9A%94+%EC%A3%BD%EC%9D%8C+%EB%AF%B8%EB%A6%AC+%EC%A4%80%EB%B9%84%ED%95%98%EB%8A%94+MZ%EB%93%A4"
                    },
                    {
                      source: "[YTN 사이언스]",
                      title: "삶을 아름답게 마무리하는 '웰다잉' 문화",
                      desc: "갑작스러운 죽음에 대비해 미리 엔딩노트를 작성하고 주변을 정리하는 문화 확산.",
                      icon: "🌿",
                      color: "bg-green-50",
                      link: "https://www.google.com/search?q=site:ytn.co.kr+%EC%82%B6%EC%9D%84+%EC%95%84%EB%A6%84%EB%8B%B5%EA%B2%8C+%EB%A7%88%EB%AC%B4%EB%A6%AC%ED%95%98%EB%8A%94+%EC%9B%B0%EB%8B%A4%EC%9E%89+%EB%AC%B8%ED%99%94"
                    },
                    {
                      source: "[시사저널]",
                      title: "죽음 준비하는 사람이 늘고 있다",
                      desc: "예고 없는 죽음이 남은 가족에게 주는 충격을 줄이기 위해 평소 준비가 필요하다는 전문가 인터뷰.",
                      icon: "⏳",
                      color: "bg-purple-50",
                      link: "https://www.google.com/search?q=site:sisajournal.com+%EC%A3%BD%EC%9D%8C+%EC%A4%80%EB%B9%84%ED%95%98%EB%8A%94+%EC%82%AC%EB%9E%8C%EC%9D%B4+%EB%8A%98%EA%B3%A0+%EC%9E%88%EB%8B%A4"
                    },
                    {
                      source: "[대학신문]",
                      title: "사람은 죽어서 아이디를 남길까? 디지털 유산의 시대",
                      desc: "싸이월드, SNS 등 고인이 남긴 디지털 기록을 가족에게 어떻게 전달할 것인가에 대한 이슈.",
                      icon: "💻",
                      color: "bg-blue-50",
                      link: "https://www.google.com/search?q=site:snunews.com+%EC%82%AC%EB%9E%8C%EC%9D%80+%EC%A3%BD%EC%96%B4%EC%84%9C+%EC%95%84%EC%9D%B4%EB%94%94%EB%A5%BC+%EB%82%A8%EA%B8%B8%EA%B9%8C+%EB%94%94%EC%A7%80%ED%84%B8+%EC%9C%A0%EC%82%B0%EC%9D%98+%EC%8B%9C%EB%8C%80"
                    },
                    {
                      source: "[한겨레]",
                      title: "내 장례식은 축제처럼… 배우 박정자의 생전 장례식",
                      desc: "장례식이 슬픈 이별식이 아니라, 소중한 사람들과 나누는 마지막 파티가 될 수 있음을 보여주는 사례.",
                      icon: "🎉",
                      color: "bg-red-50",
                      link: "https://www.google.com/search?q=site:hani.co.kr+%EB%82%B4+%EC%9E%A5%EB%A1%80%EC%8B%9D%EC%9D%80+%EC%B6%95%EC%A0%9C%EC%B2%98%EB%9F%BC+%EB%B0%B0%EC%9A%B0+%EB%B0%95%EC%A0%95%EC%9E%90%EC%9D%98+%EC%83%9D%EC%A0%84+%EC%9E%A5%EB%A1%80%EC%8B%9D"
                    },
                    {
                      source: "[동아일보]",
                      title: "출산보다 많아진 죽음… 내 마지막은 내가 디자인한다",
                      desc: "1인 가구 증가와 고령화로 인해 스스로 자신의 마지막을 계획하고 준비하는 사회적 변화.",
                      icon: "📊",
                      color: "bg-indigo-50",
                      link: "https://www.google.com/search?q=site:donga.com+%EC%B6%9C%EC%82%B0%EB%B3%B4%EB%8B%A4+%EB%A7%8E%EC%95%84%EC%A7%84+%EC%A3%BD%EC%9D%8C+%EB%82%B4+%EB%A7%88%EC%A7%80%EB%A7%89%EC%9D%80+%EB%82%B4%EA%B0%80+%EB%94%94%EC%9E%90%EC%9D%B8%ED%95%9C%EB%8B%A4"
                    }
                  ]
                ].map((article, i) => (
                  <a
                    key={i}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-[40vw] sm:w-[30vw] lg:w-[20rem] xl:w-[25rem] bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${article.color} group-hover:scale-110 transition-transform`}>
                      {article.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-blue-600 font-bold mb-2">{article.source}</div>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                        {article.desc}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-500 flex items-center gap-1">
                        자세히 보기 <span className="text-lg">→</span>
                      </span>
                    </div>
                  </a>
                ))}
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
                당신을 위한<br className="sm:hidden" />
                최적의 플랜을 선택하세요.
              </h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
                에프텀은 당신의 소중한 메시지를 안전하게 보관하고,
                지정된 시점에 전달합니다.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <div className="rounded-3xl p-8 border border-slate-200 bg-white relative hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Basic</h3>
                <div className="text-4xl font-extrabold text-slate-900 mb-6">무료</div>
                <ul className="space-y-4 mb-8 text-left pl-4">
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                    메시지 전송: 딱 1개 전송
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">✓</span>
                    저장공간: 10mb (텍스트 위주)
                  </li>
                  <li className="flex items-center gap-3 text-slate-400 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">x</span>
                    추모 공간 x
                  </li>
                  <li className="flex items-center gap-3 text-slate-400 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">x</span>
                    부가기능 x
                  </li>
                </ul>
                <Button onClick={() => handleSubscribe("Standard", "무료")} className="w-full py-6 rounded-xl text-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 font-bold shadow-sm">
                  지금 시작하기
                </Button>
              </div>

              {/* Pro Plan */}
              <div className="rounded-3xl p-8 border border-blue-100 bg-blue-50/50 relative hover:shadow-2xl transition-all duration-300 transform md:-translate-y-4">
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-3xl text-sm font-bold">Popular</div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">PRO</h3>
                <div className="text-4xl font-extrabold text-slate-900 mb-6">100원 <span className="text-base font-normal text-slate-500">/ 월</span></div>
                <ul className="space-y-4 mb-8 text-left pl-4">
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    메시지 전송: 무제한 전송
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    저장공간: 1GB (사진, 음성, 영상)
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    온라인 추모관 생성
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</span>
                    추모 댓글, 사진 남기기 기능
                  </li>
                </ul>
                <Button onClick={() => handleSubscribe("Pro", "100원")} className="w-full py-6 rounded-xl text-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30">
                  PRO로 업그레이드
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="w-full py-24 bg-slate-900 text-center border-t border-slate-800">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-10 leading-relaxed md:leading-loose px-4 break-keep">
            당신의 이야기는 <span className="text-blue-500">계속 기억됩니다.</span>
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
              시작하기
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
