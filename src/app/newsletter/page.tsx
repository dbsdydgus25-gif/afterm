import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { NewsSection } from "@/components/home/NewsSection";
import { FloatingKakaoButton } from "@/components/common/FloatingKakaoButton";

export default function NewsletterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header transparentOnTop={false} />

            <main className="flex-1 w-full pt-10 pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                        Monthly Trends
                    </h1>
                    <p className="text-slate-500 text-lg">
                        매월 1일, 웰다잉과 디지털 유산의 흐름을 읽어드립니다.
                    </p>
                </div>

                {/* Reuse the NewsSection component */}
                <NewsSection />
            </main>

            <Footer />
            <BottomNav />
            <FloatingKakaoButton />
        </div>
    );
}
