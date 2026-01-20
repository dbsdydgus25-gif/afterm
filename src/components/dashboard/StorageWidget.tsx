"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StorageWidgetProps {
    plan: 'free' | 'pro';
    userId?: string;
}

export function StorageWidget({ plan, userId }: StorageWidgetProps) {
    const [usage, setUsage] = useState(0); // bytes
    const [loading, setLoading] = useState(true);

    const LIMIT = plan === 'pro' ? 1 * 1024 * 1024 * 1024 : 10 * 1024 * 1024; // 1GB vs 10MB
    const LIMIT_LABEL = plan === 'pro' ? '1.0GB' : '10MB';

    useEffect(() => {
        const fetchUsage = async () => {
            if (!userId) return;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('storage_used')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setUsage(data.storage_used);
            }
            setLoading(false);
        };

        fetchUsage();
    }, [userId]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
    };

    // Calculate remaining
    const remaining = Math.max(0, LIMIT - usage);
    const percentage = Math.min(100, (usage / LIMIT) * 100);

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28 md:h-32">
                <span className="text-sm font-bold text-slate-400">남은 용량</span>
                <div className="flex flex-col justify-end h-full">
                    <div className="text-2xl md:text-3xl font-black text-slate-900 truncate">
                        {formatBytes(remaining)}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 text-right">
                        전체 {LIMIT_LABEL} 중 {percentage.toFixed(1)}% 사용
                    </div>
                </div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28 md:h-32">
                <span className="text-sm font-bold text-slate-400">현재 사용량</span>
                <div className="text-2xl md:text-3xl font-black text-blue-600 truncate">
                    {formatBytes(usage)}
                </div>
            </div>
        </div>
    );
}
