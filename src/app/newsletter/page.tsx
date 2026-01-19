"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function NewsletterPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />
            <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full animate-fade-in text-center">
                <span className="text-blue-600 font-bold tracking-wide text-sm bg-blue-50 px-3 py-1 rounded-full">NEWSLETTER</span>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-6 mb-8">
                    월간 애프터텀
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12">
                    웰다잉(Well-dying) 트렌드부터 디지털 유산 관리 팁까지.<br />
                    당신의 소중한 삶과 마무리를 위한 인사이트를 보내드립니다.
                </p>

                <div className="max-w-md mx-auto bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="이메일 주소를 입력해주세요"
                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button className="w-full h-14 text-lg font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800">
                            구독하기
                        </Button>
                        <p className="text-xs text-slate-400 mt-4">
                            * 매월 1회 발송되며, 언제든 구독 해지할 수 있습니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
