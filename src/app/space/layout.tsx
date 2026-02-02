"use client";

import { ReactNode } from "react";

export default function SpaceLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-white pb-20">
            {children}
        </div>
    );
}
