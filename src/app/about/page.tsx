"use client";

import { Header } from "@/components/layout/Header";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-16 md:py-20">
        <section className="space-y-6">

          {/* Minimal Company Intro (Mission & Vision Only) */}
          <div className="space-y-4">
            <span className="inline-block py-0.5 px-2 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold tracking-wide">
              OUR MISSION
            </span>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              에프텀(AFTERM)은<br />
              <span className="text-blue-600">당신의 이야기가 영원하도록</span><br />
              가장 안전한 공간을 만듭니다.
            </h1>
            <p className="text-[10px] text-slate-600 leading-relaxed max-w-full break-keep">
              우리는 누구나 언젠가는 떠난다는 사실을 알고 있습니다.<br />
              하지만 소중한 사람들에게 남기고 싶은 마지막 인사는 늘 준비되지 않은 상태로 찾아옵니다.<br />
              에프텀은 당신이 가장 전하고 싶은 진심을, 가장 안전한 금고에 보관하고,
              약속된 그 날에 정확히 전달해드리는 서비스를 제공합니다.
            </p>
            <div className="h-2"></div>
            <p className="text-[10px] text-slate-600 leading-relaxed max-w-full break-keep">
              우리의 비전은 기술을 통해 '죽음' 이후에도 '연결'이 지속되도록 돕는 것입니다.<br />
              남겨진 이들에게 위로가 되고, 떠나는 이에게는 평안이 되는 세상을 만들어갑니다.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}
