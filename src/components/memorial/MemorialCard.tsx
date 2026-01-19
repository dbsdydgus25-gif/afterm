"use client";

import Link from "next/link";
import { Memorial } from "@/store/useMemorialStore";
import { motion } from "framer-motion";

interface MemorialCardProps {
    memorial: Memorial;
}

export function MemorialCard({ memorial }: MemorialCardProps) {
    return (
        <Link href={`/memorial/${memorial.id}`}>
            <motion.div
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
            >
                {/* Cover Image */}
                <div className="h-40 w-full bg-slate-100 overflow-hidden relative">
                    <img
                        src={memorial.coverImage}
                        alt="cover"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>

                {/* Content */}
                <div className="p-6 pt-12 relative flex-1 flex flex-col">
                    {/* Profile Image (Overlapping) */}
                    <div className="absolute -top-10 left-6">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                            <img
                                src={memorial.profileImage}
                                alt={memorial.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {memorial.name}
                        </h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                            {memorial.birthDate} - {memorial.deathDate}
                        </p>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-6 flex-1">
                        {memorial.bio}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <span className="text-xs font-semibold text-slate-400">
                            추모 메시지 <span className="text-blue-600">{memorial.posts.length}</span>개
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
