"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestCronPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [messageId, setMessageId] = useState("");

    const runCron = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/test/manual-cron');
            const data = await res.json();
            setStatus({ type: "CRON", data });
        } catch (e: any) {
            setStatus({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    const timeTravel = async (action: string) => {
        if (!messageId) {
            alert("Please enter a Message ID first.");
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/test/time-travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, action })
            });
            const data = await res.json();
            setStatus({ type: "TIME_TRAVEL", data });
        } catch (e: any) {
            setStatus({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 space-y-8 font-sans max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold mb-2">Absence Verification Simulator</h1>
                <p className="text-gray-600">
                    Use this tool to test the <strong>Real Production Logic</strong> (7 Days / 24 Hours) instantly.
                </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="font-semibold text-lg">1. Target Message</h2>
                <input
                    type="text"
                    placeholder="Enter Message ID (UUID)"
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    className="w-full p-3 border rounded-lg font-mono text-sm"
                />
                <p className="text-sm text-gray-500">
                    * You can find the ID in the URL of the View page (e.g. /view/<strong>uuid</strong>) or in the dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <h3 className="font-medium text-blue-600">Stage 1 Simulation</h3>
                    <p className="text-sm text-gray-500">Simulate "7 Days Passed" since request.</p>
                    <Button
                        onClick={() => timeTravel("fast-forward-7days")}
                        disabled={loading}
                        className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                        Fast Forward 7 Days
                    </Button>
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium text-red-600">Stage 2 Simulation</h3>
                    <p className="text-sm text-gray-500">Simulate "24 Hours Passed" since final warning.</p>
                    <Button
                        onClick={() => timeTravel("fast-forward-24hours")}
                        disabled={loading}
                        className="w-full bg-red-100 text-red-700 hover:bg-red-200"
                    >
                        Fast Forward 24 Hours
                    </Button>
                </div>
            </div>

            <div className="pt-6 border-t">
                <h2 className="font-semibold text-lg mb-4">2. Trigger Check</h2>
                <p className="text-gray-600 mb-4">
                    After fast-forwarding, run the checker to process the message.
                </p>
                <Button onClick={runCron} disabled={loading} size="lg" className="w-full">
                    {loading ? "Processing..." : "Run Absence Check Now"}
                </Button>
            </div>

            {status && (
                <div className="p-4 bg-gray-100 rounded-lg overflow-auto border border-gray-300">
                    <pre className="text-xs">{JSON.stringify(status, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
