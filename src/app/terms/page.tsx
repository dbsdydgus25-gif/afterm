"use client";

import { Header } from "@/components/layout/Header";

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
            <Header />

            <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-16">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">
                            이용약관
                        </h1>
                        <p className="text-[10px] text-slate-500">
                            최종 수정일: 2024년 1월 1일
                        </p>
                    </div>

                    <div className="space-y-4 text-[10px] text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제1조 (목적)</h2>
                            <p>
                                본 약관은 에프텀(AFTERM)이 제공하는 서비스의 이용과 관련하여
                                회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제2조 (정의)</h2>
                            <p>
                                1. "서비스"란 에프텀이 제공하는 모든 온라인 서비스를 의미합니다.
                                <br />2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제3조 (서비스의 제공)</h2>
                            <p>
                                회사는 이용자에게 메시지 저장, 전송 및 관련 부가 서비스를 제공합니다.
                                서비스는 연중무휴 1일 24시간 제공함을 원칙으로 하나,
                                시스템 점검 등 필요한 경우 서비스를 일시 중단할 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제4조 (이용자의 의무)</h2>
                            <p>
                                이용자는 본 약관 및 관계 법령을 준수해야 하며,
                                타인의 권리를 침해하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제5조 (서비스 이용 제한)</h2>
                            <p>
                                회사는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우,
                                서비스 이용을 제한하거나 중지할 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제6조 (면책)</h2>
                            <p>
                                회사는 천재지변, 전쟁, 기타 불가항력적 사유로 서비스를 제공할 수 없는 경우
                                책임이 면제됩니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">제7조 (분쟁 해결)</h2>
                            <p>
                                본 약관과 관련된 분쟁은 대한민국 법률에 따라 해결하며,
                                관할 법원은 회사의 본사 소재지를 관할하는 법원으로 합니다.
                            </p>
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
}
