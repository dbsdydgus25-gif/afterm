"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white py-12 pb-24 md:pb-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
                    {/* Company Name */}
                    <div className="text-sm text-slate-600">
                        <span className="font-bold">AFTERM</span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-slate-600">
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">
                            이용약관
                        </Link>
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                            개인정보보호처리
                        </Link>
                    </div>

                    {/* Copyright */}
                    <div className="text-sm text-slate-500">
                        © 2026 AFTERM. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
