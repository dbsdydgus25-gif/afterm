"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/error";

export default function EmailTestPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleTest = async () => {
        if (!email) return alert("이메일을 입력해주세요");

        setLoading(true);
        setLogs([]);
        addLog(`Starting test for: ${email}`);

        try {
            const res = await fetch('/api/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            addLog(`Status Code: ${res.status}`);
            addLog(`Response: ${JSON.stringify(data, null, 2)}`);

            if (data.success) {
                addLog("✅ SUCCESS: Email sent successfully!");
            } else {
                addLog("❌ FAILED: " + (data.error || "Unknown error"));
            }

        } catch (error: unknown) {
            addLog(`❌ NETWORK/CLIENT ERROR: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-10 space-y-6">
            <h1 className="text-2xl font-bold">Email Delivery Test</h1>
            <div className="space-y-2">
                <label className="text-sm font-medium">Test Recipient Email</label>
                <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to receive test"
                />
            </div>
            <Button onClick={handleTest} disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Test Email"}
            </Button>

            <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto h-96 whitespace-pre-wrap">
                {logs.length === 0 ? "Logs will appear here..." : logs.join('\n')}
            </div>
        </div>
    );
}
