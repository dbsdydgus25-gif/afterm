"use client";

import { Header } from "@/components/layout/Header";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 md:py-40">
        <section className="space-y-12">

          {/* Minimal Company Intro */}
          <div className="space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wide">
              WHO WE ARE
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              에프텀(AFTERM)은<br />
              <span className="text-blue-600">당신의 이야기가 영원하도록</span><br />
              가장 안전한 공간을 만듭니다.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              우리는 누구나 언젠가는 떠난다는 사실을 알고 있습니다.<br />
              하지만 소중한 사람들에게 남기고 싶은 마지막 인사는 늘 준비되지 않은 상태로 찾아옵니다.<br /><br />
              에프텀은 당신이 가장 전하고 싶은 진심을, 가장 안전한 금고에 보관하고,<br />
              약속된 그 날에 정확히 전달해드리는 서비스를 제공합니다.
            </p>
          </div>

          <div className="h-px bg-slate-200"></div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">회사 정보</h3>
              <ul className="text-sm text-slate-500 space-y-1">
                <li>(주)에프텀</li>
                <li>대표: 홍길동</li>
                <li>사업자등록번호: 123-45-67890</li>
                <li>서울시 강남구 테헤란로 123, 456호</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">문의</h3>
              <ul className="text-sm text-slate-500 space-y-1">
                <li>이메일: contact@afterm.co.kr</li>
                <li>전화: 02-1234-5678</li>
                <li>운영시간: 평일 10:00 - 18:00</li>
              </ul>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
