"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { SpaceCreationWizard } from "@/components/space/create/SpaceCreationWizard";

export default function CreateSpacePage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 w-full z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden">
                <div className="flex items-center justify-between h-14 px-4">
                    <Link href="/space" className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-slate-900 text-sm">디지털 추모관 만들기</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-20 md:py-24">
                <div className="text-center mb-10 space-y-2">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        새로운 추모 공간
                    </h1>
                    <p className="text-slate-500 text-sm">
                        지금 바로 소중한 사람을 위한 추억의 공간을 만들어보세요.
                    </p>
                </div>

                <Suspense fallback={<div>Loading...</div>}>
                    <SpaceCreationWizard />
                </Suspense>
            </main>
        </div>
    );
}
