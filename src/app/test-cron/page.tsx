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
                    Test the <strong>New Simplified Flow</strong> (Request &rarr; 48H Wait &rarr; Unlock).
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
            </div>

            <div className="space-y-4">
                <h3 className="font-medium text-red-600">Time Travel</h3>
                <p className="text-sm text-gray-500">Simulate "48 Hours Passed" since the confirmation email was sent.</p>
                <Button
                    onClick={() => timeTravel("fast-forward-48hours")}
                    disabled={loading}
                    className="w-full bg-red-100 text-red-700 hover:bg-red-200 h-16 text-lg"
                >
                    Fast Forward 48 Hours ⏩
                </Button>
            </div>

            <div className="pt-6 border-t">
                <h2 className="font-semibold text-lg mb-4">2. Trigger Check</h2>
                <p className="text-gray-600 mb-4">
                    Run the checker to unlock the message if time has passed.
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
