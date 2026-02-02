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
                // 1. Calculate text content size from messages
                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('id, content, file_size')
                    .eq('user_id', userId);

                if (msgError) throw msgError;

                let totalSize = 0;
                const messageIds: string[] = [];

                if (messages) {
                    for (const msg of messages) {
                        messageIds.push(msg.id);
                        if (msg.content) totalSize += new Blob([msg.content]).size;
                        if (msg.file_size) totalSize += msg.file_size;
                    }
                }

                if (messageIds.length > 0) {
                    const { data: attachments, error: attError } = await supabase
                        .from('message_attachments')
                        .select('file_size')
                        .in('message_id', messageIds);

                    if (!attError && attachments) {
                        for (const att of attachments) {
                            totalSize += att.file_size || 0;
                        }
                    }
                }

                setStorageUsed(totalSize);
            } catch (error) {
                console.error("Error calculating storage:", error);
                setStorageUsed(0);
            }
            setLoading(false);
        };

        fetchStorage();
    }, [userId]);

    const limit = plan === 'pro' ? LIMIT_PRO : LIMIT_BASIC;
    const remaining = Math.max(0, limit - storageUsed);
    const percent = Math.min(100, (storageUsed / limit) * 100);

    const remainingMB = (remaining / (1024 * 1024)).toFixed(0); // Show as whole number if compact to save space, or keep 2 decimals? User said "smaller". Let's use 0 decimals for MB if > 1, or 1 if < 1. Actually existing 2 decimals is fine but layout matters.
    // User requested "much smaller".
    const remainingVal = (remaining / (1024 * 1024));
    const remainingText = remainingVal > 100 ? remainingVal.toFixed(0) : remainingVal.toFixed(1);

    // Max Storage
    const MAX_STORAGE_MB = (limit / (1024 * 1024)).toFixed(0);

    if (loading) return <div className="animate-pulse bg-slate-100 h-16 w-full rounded-xl"></div>;

    if (compact) {
        return (
            <div>
                {/* Header is handled by parent grid to ensure alignment */}
                {/* <h3 className="text-slate-500 font-bold text-xs mb-3">남은 용량</h3> */}
                <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                        {remainingText}
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
            <h3 className="text-slate-500 font-medium mb-4 text-sm">남은 용량</h3>
            <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900">
                    {(remaining / (1024 * 1024)).toFixed(2)}MB
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
            <p className="text-xs text-slate-400 text-right">{(storageUsed / (1024 * 1024)).toFixed(2)}MB 사용됨 ({percent.toFixed(1)}%)</p>
        </div>
    );
}
