"use client";

import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <header className="w-full h-20 border-b border-slate-100 flex items-center justify-between px-6 lg:px-8">
                <span className="text-xl font-black text-blue-600 tracking-tighter cursor-pointer" onClick={() => router.push('/')}>AFTERM</span>
            </header>
            <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full animate-fade-in">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold tracking-wide text-sm bg-blue-50 px-3 py-1 rounded-full">CONTACT US</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-6 mb-6">
                        무엇이든 물어보세요
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        AFTERM 팀은 언제나 여러분의 목소리에 귀 기울이고 있습니다.<br />
                        서비스 이용 문의, 제휴 제안, 기타 궁금한 점을 남겨주세요.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-blue-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">이메일 문의</h3>
                        <p className="text-slate-500 mb-4 text-sm">24시간 접수 가능</p>
                        <a href="mailto:support@afterm.com" className="text-blue-600 font-bold hover:underline">support@afterm.com</a>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-blue-600">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">전화 문의</h3>
                        <p className="text-slate-500 mb-4 text-sm">평일 10:00 - 18:00</p>
                        <a href="tel:02-1234-5678" className="text-blue-600 font-bold hover:underline">02-1234-5678</a>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-blue-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">오시는 길</h3>
                        <p className="text-slate-500 mb-4 text-sm">서울시 강남구 테헤란로</p>
                        <a href="#" className="text-blue-600 font-bold hover:underline">지도 보기 &rarr;</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
