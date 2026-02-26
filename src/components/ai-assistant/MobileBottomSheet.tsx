"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export function MobileBottomSheet({ isOpen, onClose, children }: MobileBottomSheetProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (mobile only) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col overflow-hidden"
                    >
                        {/* 드래그 핸들 */}
                        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        {/* 닫기 버튼 */}
                        <div className="flex items-center justify-between px-5 pb-2 flex-shrink-0">
                            <p className="text-sm font-bold text-slate-700">분석 결과</p>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 컨텐츠 */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
