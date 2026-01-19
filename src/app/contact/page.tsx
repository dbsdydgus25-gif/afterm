"use client";

import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-6 pt-32 pb-20 w-full animate-fade-in">
                <div className="text-center mb-12">
                    <span className="text-blue-600 font-bold tracking-wide text-sm bg-blue-50 px-3 py-1 rounded-full">CONTACT US</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-6 mb-6">
                        무엇이든 물어보세요
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed">
                        궁금한 점이 있으신가요?<br />
                        아래 폼을 작성해 주시면 확인 후 연락드리겠습니다.
                    </p>
                </div>

                {/* Contact Form */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">성함</label>
                        <input
                            type="text"
                            placeholder="홍길동"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">연락처</label>
                        <input
                            type="tel"
                            placeholder="010-0000-0000"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">이메일</label>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">문의 내용</label>
                        <textarea
                            rows={5}
                            placeholder="문의하실 내용을 자유롭게 작성해주세요."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    <Button className="w-full h-14 text-lg font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl mt-4">
                        문의하기
                    </Button>
                </div>

                {/* Email Info at Bottom */}
                <div className="mt-16 text-center border-t border-slate-100 pt-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-2xl text-blue-600 mb-4">
                        <Mail className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm mb-2">이메일 문의</p>
                    <a href="mailto:afterm01@gmail.com" className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        afterm01@gmail.com
                    </a>
                </div>
            </main>
        </div>
    );
}
