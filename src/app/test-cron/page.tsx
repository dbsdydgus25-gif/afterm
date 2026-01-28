"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestCronPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runCron = async () => {
        setLoading(true);
        try {
            // We use a server action or simple fetch to a proxy API that adds the secret?
            // Since we can't expose CRON_SECRET on client, we need a server action.
            // But for quick testing, let's assuming we make a new API route `/api/test/trigger-cron` that doesn't need auth (DEV ONLY)
            // or we use a Server Action. Let's use Server Action.
            // Actually, for simplicity in this chat, let's creating a Server Action file is cleaner.

            const res = await fetch('/api/test/manual-cron');
            const data = await res.json();
            setStatus(data);
        } catch (e: any) {
            setStatus({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 space-y-4">
            <h1 className="text-2xl font-bold">Absence Verification Cron Tester</h1>
            <p className="text-gray-600">
                Since Vercel Cron might not run every minute on Hobby plans, <br />
                use this button to <strong>force run</strong> the checker immediately.
            </p>
            <Button onClick={runCron} disabled={loading}>
                {loading ? "Running Check..." : "Run Absence Check Now"}
            </Button>

            {status && (
                <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
                    <pre>{JSON.stringify(status, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
