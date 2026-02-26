"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VaultListPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/dashboard");
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-slate-500">대시보드로 이동 중...</div>
        </div>
    );
}
