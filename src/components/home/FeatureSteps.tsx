"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Feature {
    step: string
    title?: string
    content: string
    image: string
}

interface FeatureStepsProps {
    features: Feature[]
    className?: string
    title?: string
    autoPlayInterval?: number
    imageHeight?: string
}

export function FeatureSteps({
    features,
    className,
    title = "How to get Started",
    autoPlayInterval = 4000,
    imageHeight = "h-[400px]",
}: FeatureStepsProps) {
    const [currentFeature, setCurrentFeature] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            if (progress < 100) {
                setProgress((prev) => prev + 100 / (autoPlayInterval / 100))
            } else {
                setCurrentFeature((prev) => (prev + 1) % features.length)
                setProgress(0)
            }
        }, 100)

        return () => clearInterval(timer)
    }, [progress, features.length, autoPlayInterval])

    const renderPlaceholderIcon = (index: number) => {
        if (index === 0) return "💻";
        if (index === 1) return "🤝";
        if (index === 2) return "🔐";
        return "✨";
    }

    return (
        <div className={cn("p-8 md:p-12", className)}>
            <div className="max-w-7xl mx-auto w-full">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-14 text-center tracking-tight text-slate-900 break-keep">
                    {title}
                </h2>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-14 items-center">
                    <div className="order-2 md:order-1 space-y-8 lg:space-y-12 w-full text-left">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="flex items-start gap-4 md:gap-6 cursor-pointer"
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                                transition={{ duration: 0.5 }}
                                onClick={() => {
                                    setCurrentFeature(index);
                                    setProgress(0);
                                }}
                            >
                                <motion.div
                                    className={cn(
                                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex flex-shrink-0 items-center justify-center border-2 transition-all duration-300",
                                        index === currentFeature
                                            ? "bg-slate-800 border-slate-800 text-white scale-110 shadow-md"
                                            : "bg-transparent border-slate-300 text-slate-400 font-bold",
                                    )}
                                >
                                    {index <= currentFeature ? (
                                        <span className="text-lg font-bold">✓</span>
                                    ) : (
                                        <span className="text-lg font-semibold">{index + 1}</span>
                                    )}
                                </motion.div>

                                <div className="flex-1 mt-1">
                                    <h3 className="text-lg md:text-2xl font-bold tracking-tight text-slate-800 mb-2 break-keep">
                                        {feature.title || feature.step}
                                    </h3>
                                    <p className="text-[13px] md:text-base text-slate-500 leading-relaxed break-keep">
                                        {feature.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div
                        className={cn(
                            "order-1 md:order-2 w-full relative h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-3xl bg-slate-100/80 shadow-inner border border-slate-100"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {features.map(
                                (feature, index) =>
                                    index === currentFeature && (
                                        <motion.div
                                            key={index}
                                            className="absolute inset-0 rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                        >
                                            {feature.image ? (
                                                <Image
                                                    src={feature.image}
                                                    alt={feature.step}
                                                    className="w-full h-full object-cover transition-transform transform"
                                                    width={1000}
                                                    height={600}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/50">
                                                    {/* 서비스 미리보기 형태의 플레이스홀더 */}
                                                    <motion.div
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.1, duration: 0.4 }}
                                                        className="w-4/5 h-3/5 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 flex flex-col items-center justify-center"
                                                    >
                                                        <span className="text-6xl md:text-8xl drop-shadow-sm mb-4">{renderPlaceholderIcon(index)}</span>
                                                        <div className="w-1/2 h-2 bg-slate-200 rounded-full mb-2"></div>
                                                        <div className="w-1/3 h-2 bg-slate-200 rounded-full"></div>
                                                    </motion.div>
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />

                                            {/* 프로그레스 인디케이터 라인 */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50">
                                                <motion.div
                                                    className="h-full bg-slate-800/80"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
                                                />
                                            </div>
                                        </motion.div>
                                    ),
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
