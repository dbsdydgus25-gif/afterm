"use client";

import { Header } from "@/components/layout/Header";
import { MemorialCard } from "@/components/memorial/MemorialCard";
import { useMemorialStore } from "@/store/useMemorialStore";
import { motion } from "framer-motion";

export default function MemorialListPage() {
    const { memorials } = useMemorialStore();

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />

            <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide"
                    >
                        ONLINE MEMORIAL
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
                    >
                        온라인 추모관
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 max-w-2xl mx-auto"
                    >
                        사랑하는 사람들과의 추억을 영원히 간직하세요.<br />
                        시간이 흘러도 바래지 않는 그리움을 이곳에 남길 수 있습니다.
                    </motion.p>
                </div>

                {/* Memorial List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {memorials.map((memorial, index) => (
                        <motion.div
                            key={memorial.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index + 0.3 }}
                        >
                            <MemorialCard memorial={memorial} />
                        </motion.div>
                    ))}

                    {/* Placeholder for "Add New" (Mock) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="group relative overflow-hidden rounded-2xl bg-white border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 min-h-[400px] flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => alert("준비 중인 기능입니다.")}
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            새로운 추모관 만들기
                        </h3>
                        <p className="text-sm text-slate-400 mt-2">
                            소중한 사람을 위한 공간을 만들어보세요
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
