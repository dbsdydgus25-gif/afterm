import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SubscriptionForm } from "@/components/home/NewsSection";
import { FloatingKakaoButton } from "@/components/common/FloatingKakaoButton";

export default function NewsletterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header transparentOnTop={false} />

            <main className="flex-1 w-full flex items-center justify-center p-6">
                {/* Subscription Card - Exactly as requested */}
                <div className="w-full max-w-xl mx-auto text-center">
                    <div className="bg-white p-8 md:p-10 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>

                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
                            매주 한 번, 웰다잉 트렌드를 받아보세요
                        </h3>
                        <p className="text-slate-500 text-base mb-8 leading-relaxed">
                            가장 최신의 웰다잉 뉴스, 디지털 유산 관리 팁을<br className="md:hidden" /> 이메일로 정리해드립니다.
                        </p>

                        <SubscriptionForm />
                    </div>
                </div>
            </main>

            <Footer />
            <FloatingKakaoButton />
            <BottomNav />
        </div>
    );
}
