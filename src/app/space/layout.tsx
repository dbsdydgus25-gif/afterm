"use client";

import { ReactNode, useState } from "react";
import { SpaceBottomNav } from "@/components/space/SpaceBottomNav";
import { MemoryComposer } from "@/components/space/MemoryComposer";

export default function SpaceLayout({ children }: { children: ReactNode }) {
    const [isComposerOpen, setIsComposerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white pb-20">
            {children}

            <SpaceBottomNav onCompose={() => setIsComposerOpen(true)} />

            <MemoryComposer
                isOpen={isComposerOpen}
                onClose={() => setIsComposerOpen(false)}
                onSuccess={() => window.location.reload()}
            />
        </div>
    );
}
