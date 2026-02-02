"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen font-sans bg-white pb-16">
            <Header transparentOnTop={false} />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="px-6 py-12 bg-gray-50 mb-8">
                    <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">
                        당신의 기억을<br />
                        <span className="text-blue-600">영원히</span> 남기세요
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        생의 마지막 순간, 사랑하는 사람들에게<br />
                        전하고 싶은 진심을 미리 준비하세요.
                    </p>
                    <Link
                        href="/create"
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                    >
                        기억 남기기 시작하기
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </section>

                {/* Features */}
                <section className="px-6 space-y-8 mb-12">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
                            🔒
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">안전한 보관</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                모든 데이터는 암호화되어 안전하게 보관되며, 지정된 수신인만 확인할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
                            ⏳
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">타임캡슐 전송</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                내가 설정한 시점에 소중한 메시지가 자동으로 전달됩니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
                            🕊️
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">온라인 추모관</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                나만의 공간에서 삶을 기록하고, 떠난 후에도 서로를 기억할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Banner */}
                <section className="px-6 mb-12">
                    <div className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">프리미엄 플랜 오픈</h3>
                            <p className="text-xs text-gray-400 mb-4">
                                더 많은 용량과 영구 보관 서비스를<br />
                                지금 바로 경험해보세요.
                            </p>
                            <Link href="/plans" className="text-xs font-bold underline decoration-blue-500 underline-offset-4">
                                자세히 보기
                            </Link>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[50px] opacity-20 transform translate-x-10 -translate-y-10"></div>
                    </div>
                </section>

                <Footer />
            </main>
        </div>
    );
}
