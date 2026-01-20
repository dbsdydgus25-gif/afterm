"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StorageWidgetProps {
    plan: string | undefined;
    userId: string | undefined;
}

export function StorageWidget({ plan, userId }: StorageWidgetProps) {
    const [storageUsed, setStorageUsed] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Plan Limits (in Bytes)
    const LIMIT_BASIC = 10 * 1024 * 1024; // 10MB
    const LIMIT_PRO = 1 * 1024 * 1024 * 1024; // 1GB

    useEffect(() => {
        const fetchStorage = async () => {
            if (!userId) return;
            const supabase = createClient();

            const { data, error } = await supabase
                .from('profiles')
                .select('storage_used')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Error fetching storage:", error);
                // If error (e.g., row missing), safely default to 0
                setStorageUsed(0);
            } else {
                setStorageUsed(data?.storage_used || 0);
            }
            setLoading(false);
        };

        fetchStorage();
    }, [userId]);

    const limit = plan === 'pro' ? LIMIT_PRO : LIMIT_BASIC;
    const remaining = Math.max(0, limit - storageUsed);
    const percent = Math.min(100, (storageUsed / limit) * 100);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)); // Return number for calculation
    };

    const remainingMB = (remaining / (1024 * 1024)).toFixed(2);
    const MAX_STORAGE_MB = (limit / (1024 * 1024)).toFixed(0); // 10 or 1024
    const usedMB = (storageUsed / (1024 * 1024)).toFixed(2);

    if (loading) return <div className="animate-pulse bg-slate-200 h-24 rounded-2xl"></div>;

    return (
        <div className="p-6 h-full flex flex-col justify-center">
            <h3 className="text-slate-500 font-medium mb-4 text-sm">남은 용량</h3>
            <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900">
                    {remainingMB}MB
                </span>
                <span className="text-sm text-slate-400 mb-1">
                    / {MAX_STORAGE_MB}MB
                </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <p className="text-xs text-slate-400 text-right">{usedMB}MB 사용됨 ({percent.toFixed(1)}%)</p>
        </div>
    );
}
