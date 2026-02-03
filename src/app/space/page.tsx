"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Construction } from "lucide-react";

export default function SpacePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                        <Construction className="w-10 h-10 text-slate-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                        온라인 추모관 준비중입니다
                    </h1>
                    <p className="text-slate-500 leading-relaxed">
                        더 나은 서비스를 제공하기 위해<br />
                        열심히 준비하고 있습니다.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
