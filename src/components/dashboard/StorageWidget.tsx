"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StorageWidgetProps {
    plan: string | undefined;
    userId: string | undefined;
    compact?: boolean;
}

export function StorageWidget({ plan, userId, compact = false }: StorageWidgetProps) {
    const [storageUsed, setStorageUsed] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // ... (keep fetch logic same) ...

    // Plan Limits (in Bytes)
    const LIMIT_BASIC = 10 * 1024 * 1024; // 10MB
    const LIMIT_PRO = 1 * 1024 * 1024 * 1024; // 1GB

    useEffect(() => {
        const fetchStorage = async () => {
            if (!userId) return;
            const supabase = createClient();

            try {
                // Fetch storage_used directly from profiles
                // This ensures consistency with the upload logic which updates this value
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('storage_used')
                    .eq('id', userId)
                    .single();

                if (error) {
                    throw error;
                }

                if (profile) {
                    setStorageUsed(profile.storage_used || 0);
                }
            } catch (error) {
                console.error("Error fetching storage usage:", error);
                // Fallback to 0 or keep previous
            }
            setLoading(false);
        };

        fetchStorage();
    }, [userId]);

    const limit = plan === 'pro' ? LIMIT_PRO : LIMIT_BASIC;
    const percent = Math.min(100, (storageUsed / limit) * 100);

    const usedMB = (storageUsed / (1024 * 1024));
    const usedText = usedMB > 100 ? usedMB.toFixed(0) : usedMB.toFixed(1);

    // Max Storage
    const MAX_STORAGE_MB = (limit / (1024 * 1024)).toFixed(0);

    if (loading) return <div className="animate-pulse bg-slate-100 h-16 w-full rounded-xl"></div>;

    if (compact) {
        return (
            <div>
                {/* Header is handled by parent grid to ensure alignment */}
                {/* <h3 className="text-slate-500 font-bold text-xs mb-3">사용 중인 용량</h3> */}
                <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                        {usedText}
                        <span className="text-xs font-bold ml-0.5">MB</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium mb-1">
                        / {MAX_STORAGE_MB}MB
                    </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col justify-center">
            <h3 className="text-slate-500 font-medium mb-4 text-sm">사용 중인 용량</h3>
            <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900">
                    {usedText}MB
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
            <p className="text-xs text-slate-400 text-right">{percent.toFixed(1)}% 사용됨</p>
        </div>
    );
}
