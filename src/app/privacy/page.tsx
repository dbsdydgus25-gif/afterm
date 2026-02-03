"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PRIVACY_POLICY } from "@/lib/compliance";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-24 md:py-32">
                <article className="prose prose-slate lg:prose-lg bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-bold text-slate-900 mb-8 border-b pb-4">개인정보 처리방침</h1>
                    <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm md:text-base">
                        {PRIVACY_POLICY}
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
