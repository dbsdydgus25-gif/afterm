"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Calendar, ChevronRight, CheckCircle2, AlertCircle, Info } from "lucide-react";

const mockBenefits = [
    { id: 1, title: "장제비 지원금", amount: 800000, type: "정부 지원", status: "수령 가능" },
    { id: 2, title: "유족 연금 (초기 정착금)", amount: 1200000, type: "국민연금공단", status: "수령 가능" },
    { id: 3, title: "건강보험료 환급금", amount: 154000, type: "건강보험공단", status: "수령 가능" },
];

const mockTimeline = [
    { id: 1, title: "사망신고", deadline: "사망일로부터 1개월 이내", status: "urgent", desc: "시/구/읍/면/동 주민센터 방문 또는 온라인 (대법원 전자가족관계등록시스템)" },
    { id: 2, title: "안심상속 원스톱 서비스 신청", deadline: "사망일이 속한 달의 말일부터 6개월 이내", status: "pending", desc: "재산, 금융 내역 통보 신청" },
    { id: 3, title: "상속포기 또는 한정승인", deadline: "상속 개시 있음을 안 날로부터 3개월", status: "pending", desc: "가정법원에 청구" },
    { id: 4, title: "상속세 신고 및 납부", deadline: "상속개시일이 속하는 달의 말일부터 6개월 이내", status: "pending", desc: "주소지 관할 세무서" },
];

export default function BenefitsResultPage() {
    const router = useRouter();

    const totalAmount = mockBenefits.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans pb-24">
            <Header transparentOnTop={false} />

            <main className="flex-1 w-full pt-20 max-w-3xl mx-auto px-4 sm:px-6">
                {/* 1. Header Section - Total Amount */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 my-8 text-center"
                >
                    <p className="text-slate-500 font-medium mb-3">
                        홍길동님 유가족이 받을 수 있는 총 지원금
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-6">
                        <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                            {totalAmount.toLocaleString()}
                        </span>
                        <span className="text-2xl text-slate-600 font-bold mb-1">원</span>
                    </div>

                    <Button
                        onClick={() => alert("MVP 버전입니다. 정식 버전에서 지원될 기능입니다.")}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20"
                    >
                        지원금 한 번에 신청하기
                    </Button>
                </motion.section>

                {/* 2. Benefits List Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                            상세 지원금 내역
                        </h2>
                        <span className="text-sm font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">총 {mockBenefits.length}건</span>
                    </div>

                    <div className="space-y-3">
                        {mockBenefits.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                className="bg-white p-5 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm hover:border-blue-200 transition-colors cursor-pointer group"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">{item.type}</span>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> {item.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <span className="text-xl font-bold text-slate-900">{item.amount.toLocaleString()}원</span>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* 3. Administrative Timeline Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-6 bg-amber-400 rounded-sm"></span>
                            필수 행정 처리 기한
                        </h2>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            기한을 놓치면 과태료가 발생할 수 있습니다
                        </span>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        {/* Timeline line */}
                        <div className="absolute left-10 md:left-12 top-10 bottom-10 w-0.5 bg-slate-100"></div>

                        <div className="space-y-8 relative z-10">
                            {mockTimeline.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (idx * 0.1) }}
                                    className="flex gap-4 md:gap-6 relative"
                                >
                                    <div className="flex flex-col items-center mt-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 shadow-sm z-10 ${item.status === 'urgent' ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-400'
                                            }`}>
                                            {item.status === 'urgent' ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                            {item.title}
                                            {item.status === 'urgent' && (
                                                <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                                                    기한 임박
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm font-semibold text-rose-600 mb-1">{item.deadline}</p>
                                        <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-slate-500 mb-4">
                        행정 처리가 막막하다면, 전문가의 도움을 받아보세요.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => alert("전문가 매칭 서비스는 준비 중입니다.")}
                        className="rounded-xl h-12 px-6 border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                        상담사 연결하기 (준비중)
                    </Button>
                </motion.div>
            </main>
        </div>
    );
}
