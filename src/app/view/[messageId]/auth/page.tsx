"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getMessageSenderInfo } from "@/app/actions/viewMessage";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthViewPage() {
    const params = useParams();
    const messageId = params.messageId as string;

    const [mode, setMode] = useState<'INITIAL' | 'OPTION1' | 'OPTION2' | 'VIEW'>('INITIAL');
    const [step, setStep] = useState<'PHONE' | 'CODE'>('PHONE'); // For Option 1
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);
    const [senderName, setSenderName] = useState("");
    const [statusData, setStatusData] = useState<any>(null); // To store trigger status

    useEffect(() => {
        if (messageId) {
            getMessageSenderInfo(messageId).then(res => {
                if (res.senderName) setSenderName(res.senderName);
            });
            checkTriggerStatus();
        }
    }, [messageId]);

    const checkTriggerStatus = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('messages').select('status, is_triggered, retry_count, last_reminder_sent_at').eq('id', messageId).single();
        if (data) {
            if (data.status === 'UNLOCKED') {
                // Fetch content if unlocked? Need phone auth usually?
                // Wait, if unlocked, anyone with link can view?
                // Original logic for 'UNLOCKED' message might still require some handshake or just show it?
                // The API `api/message/unlock` handles verify+fetch.
                // For now, let's keep it locked behind this UI unless we have a specific 'public' view.
                // Actually, if status is UNLOCKED, we might still want to show "Click to View" rather than Auth.
                // But for security, let's Stick to Auth/Trigger logic.
            }
            setStatusData(data);
            if (data.is_triggered) {
                setMode('OPTION2'); // Show Trigger Status
            }
        }
    };

    // --- Option 1: Sender Phone Verify ---
    const handleRequestSenderOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/verify/sender', {
                method: 'POST',
                body: JSON.stringify({ messageId })
            });
            const data = await res.json();
            if (data.success) {
                alert("작성자의 휴대폰으로 인증번호가 발송되었습니다.");
                setStep('CODE');
            } else {
                alert(data.error);
            }
        } catch (e) { alert("오류 발생"); }
        setLoading(false);
    };

    const handleVerifyAndUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Note: For OPTION 1, we must pass the SENDER'S PHONE.
            // But the UI doesn't know it. The API `unlock` needs to handle this.
            // Wait, `unlock` API expects `phone`. If I don't send one, it fails.
            // Review `unlock` API change: It checks `cleanPhone` against Recipient then Sender.
            // So we MUST ask user to input the Author's Phone?
            // "Option 1: [Author's Phone Verification] ... Recipient enters the code."
            // Does Recipient KNOW the phone number?
            // "수신인이 작성자의 휴대폰을 소지하고 있거나 확인 가능한 경우"
            // If they have the phone, they know the number.
            // So we ASK for the phone number.

            const res = await fetch('/api/message/unlock', {
                method: 'POST',
                body: JSON.stringify({ messageId, phone, code })
            });
            const data = await res.json();
            if (data.success) {
                setMessageContent(data.content);
                setFileUrl(data.file_url);
                setFileType(data.file_type);
                setMode('VIEW');
            } else {
                alert(data.error);
            }
        } catch (e) { alert("오류 발생"); }
        setLoading(false);
    };

    // --- Option 2: Trigger Start ---
    const handleStartTrigger = async () => {
        if (!confirm("작성자에게 부재 확인 요청을 보내시겠습니까?\n응답이 없으면 4단계 확인 후 메시지가 공개됩니다.")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/trigger/start', {
                method: 'POST',
                body: JSON.stringify({ messageId, type: 'timer' })
            });
            const data = await res.json();
            if (data.success) {
                alert("확인 요청이 시작되었습니다.");
                checkTriggerStatus(); // Refresh to show status
            } else {
                alert(data.error);
            }
        } catch (e) { alert("오류 발생"); }
        setLoading(false);
    };

    // --- RENDER ---
    if (mode === 'VIEW') {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex justify-center items-center">
                <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-2 mb-6 text-green-400">
                        <Unlock className="w-5 h-5" />
                        <span className="font-bold">잠금 해제됨</span>
                    </div>

                    {fileUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden bg-black/50 border border-zinc-800">
                            {/* Use Standard img tag for external/signed urls to avoid Next.js domain config issues for random buckets */}
                            <img src={fileUrl} alt="Attached content" className="w-full h-auto object-contain max-h-[500px]" />
                        </div>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed text-zinc-200">{messageContent}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                        <Lock className="w-5 h-5 text-zinc-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">메시지 접근</h1>
                    <p className="text-zinc-400 text-sm">
                        <span className="text-blue-400 font-bold">{senderName}</span>님이 남긴 메시지입니다.<br />
                        확인 방법을 선택해주세요.
                    </p>
                </div>

                {/* Status Card if Triggered */}
                {statusData?.is_triggered && (
                    <div className="bg-yellow-900/20 border border-yellow-800/50 p-4 rounded-xl text-center space-y-2 mb-6">
                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto" />
                        <h3 className="font-bold text-yellow-500">부재 확인 진행 중</h3>
                        <p className="text-xs text-yellow-200/70">
                            현재 {statusData.retry_count || 0}/4 단계 확인 중입니다.<br />
                            작성자의 응답이 없으면 자동으로 공개됩니다.
                        </p>
                        <p className="text-[10px] text-zinc-500 pt-2">
                            마지막 발송: {new Date(statusData.last_reminder_sent_at).toLocaleString()}
                        </p>
                    </div>
                )}

                {mode === 'INITIAL' && !statusData?.is_triggered && (
                    <div className="grid gap-3">
                        {/* Option 1 */}
                        <button
                            onClick={() => setMode('OPTION1')}
                            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-zinc-200">작성자 휴대폰 인증</span>
                                <Unlock className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
                            </div>
                            <p className="text-xs text-zinc-500">작성자의 휴대폰 번호로 인증하여 즉시 열람</p>
                        </button>

                        {/* Option 2 */}
                        <button
                            onClick={handleStartTrigger}
                            disabled={loading}
                            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-zinc-800 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-zinc-200">부재 확인 요청</span>
                                <Send className="w-4 h-4 text-zinc-600 group-hover:text-red-400" />
                            </div>
                            <p className="text-xs text-zinc-500">작성자에게 확인 메일 발송 (응답 없을 시 공개)</p>
                        </button>
                    </div>
                )}

                {/* Option 1 Form */}
                {mode === 'OPTION1' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            <h3 className="font-bold text-sm mb-4">작성자 휴대폰 인증</h3>
                            {step === 'PHONE' ? (
                                <form onSubmit={handleRequestSenderOTP} className="space-y-3">
                                    <p className="text-xs text-zinc-500">
                                        작성자의 휴대폰 번호로 인증번호를 보냅니다.<br />
                                        (버튼을 누르면 즉시 발송됩니다)
                                    </p>
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증번호 발송"}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyAndUnlock} className="space-y-3">
                                    <input
                                        type="tel"
                                        placeholder="작성자 휴대폰번호 (01012345678)"
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="인증번호 6자리"
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-center tracking-widest"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        required
                                    />
                                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증 확인"}
                                    </Button>
                                </form>
                            )}
                        </div>
                        <button onClick={() => setMode('INITIAL')} className="text-xs text-zinc-500 hover:text-white w-full text-center">
                            뒤로가기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
