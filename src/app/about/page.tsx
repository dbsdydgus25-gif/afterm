"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-6 pt-32 pb-20 w-full animate-fade-in">
                <h1 className="text-4xl font-bold text-slate-900 mb-8">회사 소개</h1>
                <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                    <p>
                        <strong className="text-slate-900">AFTERM(에프텀)</strong>은 "떠난 후에도 당신이 기억되도록"이라는 미션 아래 시작된 디지털 생애 데이터 플랫폼입니다.
                    </p>
                    <p>
                        우리는 기술을 통해 삶의 마무리를 더 따뜻하고 의미 있게 만들 수 있다고 믿습니다.
                        당신의 소중한 추억과 메시지가 시간이 지나도 바래지 않고, 사랑하는 사람들에게 온전히 전달되도록 돕습니다.
                    </p>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mt-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h2>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>누구나 자신의 삶을 주체적으로 정리하는 문화</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>디지털 유산의 안전한 보관과 승계</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>세대와 시공간을 연결하는 기억의 허브</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
