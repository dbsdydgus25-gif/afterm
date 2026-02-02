"use client";

import { Header } from "@/components/layout/Header";

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
            <Header />

            <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-16">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">
                            개인정보 처리방침
                        </h1>
                        <p className="text-[10px] text-slate-500">
                            최종 수정일: 2024년 1월 1일
                        </p>
                    </div>

                    <div className="space-y-4 text-[10px] text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">1. 수집하는 개인정보</h2>
                            <p>
                                에프텀(AFTERM)은 서비스 제공을 위해 다음의 개인정보를 수집합니다:
                                <br />- 이메일 주소, 이름, 전화번호
                                <br />- 서비스 이용 기록, IP 주소
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">2. 개인정보의 이용 목적</h2>
                            <p>
                                수집한 개인정보는 다음의 목적으로 이용됩니다:
                                <br />- 회원 가입 및 관리
                                <br />- 메시지 전송 서비스 제공
                                <br />- 고객 지원 및 문의 응대
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">3. 개인정보의 보관 기간</h2>
                            <p>
                                개인정보는 서비스 이용 기간 동안 보관하며, 탈퇴 시 즉시 삭제됩니다.
                                단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">4. 개인정보의 제3자 제공</h2>
                            <p>
                                에프텀은 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
                                다만, 법령에 의한 경우 예외로 합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">5. 이용자의 권리</h2>
                            <p>
                                이용자는 언제든지 자신의 개인정보를 조회하거나 수정, 삭제할 수 있으며,
                                개인정보 처리에 대한 동의를 철회할 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-sm font-bold text-slate-900 mb-2">6. 문의</h2>
                            <p>
                                개인정보 처리방침에 대한 문의사항이 있으시면 아래로 연락해주세요:
                                <br />이메일: support@afterm.co.kr
                            </p>
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
}
