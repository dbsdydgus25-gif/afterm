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

            try {
                // 1. Calculate text content size from messages
                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('id, content, file_size')
                    .eq('user_id', userId);

                if (msgError) throw msgError;

                let totalSize = 0;
                const messageIds: string[] = [];

                // Add text content size
                if (messages) {
                    for (const msg of messages) {
                        messageIds.push(msg.id);
                        // Text content size
                        if (msg.content) {
                            totalSize += new Blob([msg.content]).size;
                        }
                        // Legacy file_size from messages table
                        if (msg.file_size) {
                            totalSize += msg.file_size;
                        }
                    }
                }

                // 2. Calculate file sizes from message_attachments
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
