"use client";

import { Header } from "@/components/layout/Header";

export default function CommunityPage() {
    return (
        <div className="flex flex-col min-h-screen font-sans bg-gray-50 pb-20">
            <Header transparentOnTop={false} />

            <main className="flex-1 flex flex-col items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <div className="text-4xl mb-2">🚧</div>
                    <h1 className="text-xl font-bold text-gray-900">
                        서비스 준비중입니다
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        더 좋은 커뮤니티 서비스를 제공하기 위해<br />
                        열심히 준비하고 있습니다.
                    </p>
                </div>
            </main>
        </div>
    );
}
