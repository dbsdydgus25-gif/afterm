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
    const [isInitialLoading, setIsInitialLoading] = useState(true); // Add loading state
    const [messageContent, setMessageContent] = useState("");
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<Array<{ url: string, type: string, size: number }>>([]);
    const [senderName, setSenderName] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [relationship, setRelationship] = useState("");
    const [statusData, setStatusData] = useState<any>(null); // To store trigger status

    useEffect(() => {
        if (messageId) {
            const initPage = async () => {
                const supabase = createClient();

                // Fetch message info
                const result = await getMessageSenderInfo(messageId);
                if (result.senderName) setSenderName(result.senderName);

                // Check if current user is the author and message is UNLOCKED
                const { data: { user } } = await supabase.auth.getUser();
                const { data: messageData } = await supabase
                    .from('messages')
                    .select('user_id, status, content, recipient_name, recipient_relationship, is_triggered')
                    .eq('id', messageId)
                    .single();

                if (messageData) {
                    setStatusData(messageData);

                    // If user is the author and message is UNLOCKED, auto-display
                    if (user && messageData.user_id === user.id && messageData.status === 'UNLOCKED') {
                        // Fetch attachments
                        const { data: attachments } = await supabase
                            .from('message_attachments')
                            .select('*')
                            .eq('message_id', messageId)
                            .order('created_at', { ascending: true });

                        // Generate signed URLs
                        const attachmentUrls = [];
                        if (attachments && attachments.length > 0) {
                            for (const att of attachments) {
                                const { data: signedData } = await supabase.storage
                                    .from('memories')
                                    .createSignedUrl(att.file_path, 3600);

                                if (signedData?.signedUrl) {
                                    attachmentUrls.push({
                                        url: signedData.signedUrl,
                                        type: att.file_type,
                                        size: att.file_size
                                    });
                                }
                            }
                        }

                        // Set all data and switch to VIEW mode
                        setMessageContent(messageData.content);
                        setRecipientName(messageData.recipient_name);
                        setRelationship(messageData.recipient_relationship || '');
                        setAttachments(attachmentUrls);
                        setSenderName(result.senderName || '');
                        setIsInitialLoading(false); // IMPORTANT: Set before changing mode
                        setMode('VIEW');
                        return;
                    }

                    if (messageData.is_triggered) {
                        setMode('OPTION2'); // Show Trigger Status
                    }
                }

                // Done loading
                setIsInitialLoading(false);
            };

            initPage();
        }
    }, [messageId]);

    const checkTriggerStatus = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('messages').select('status, is_triggered, retry_count, last_reminder_sent_at').eq('id', messageId).single();
        if (data) {
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
                body: JSON.stringify({ messageId, code }) // Phone inferred by server
            });
            const data = await res.json();
            if (data.success) {
                setMessageContent(data.content);
                setFileUrl(data.file_url);
                setFileType(data.file_type);
                setAttachments(data.attachments || []);
                setSenderName(data.sender_name || '');
                setRecipientName(data.recipient_name || '');
                setRelationship(data.recipient_relationship || '');
                setMode('VIEW');
            } else {
                alert(data.error);
            }
        } catch (e) { alert("오류 발생"); }
        setLoading(false);
    };

    // --- Option 2: Trigger Start ---
    const handleStartTrigger = async () => {
        if (!confirm("작성자에게 부재 확인 요청을 보내시겠습니까?\n응답이 없으면 2단계 확인 후 메시지가 공개됩니다.")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/trigger/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, type: 'timer' })
            });
            const data = await res.json();

            console.log("Trigger response:", data);

            if (data.success) {
                alert("✅ 부재 확인 요청이 접수되었습니다.\n\n2단계 과정은 총 8일의 시간이 필요합니다.\n(1단계: 7일, 2단계: 24시간)\n\n작성자가 응답하지 않으면 메시지로 알림이 전달됩니다.");
                checkTriggerStatus(); // Refresh to show status
            } else {
                alert(`❌ 요청 실패\n\n에러: ${data.error || '알 수 없는 오류'}${data.details ? '\n\n상세: ' + data.details : ''}`);
            }
        } catch (e: any) {
            alert(`❌ 오류 발생\n\n${e.message || e.toString()}`);
        }
        setLoading(false);
    };


    // --- RENDER ---
    // Show loading spinner during initial data fetch
    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                    <p className="text-slate-600 font-medium">메시지 로딩 중...</p>
                </div>
            </div>
        );
    }

    if (mode === 'VIEW') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 flex justify-center items-center">
                <div className="max-w-2xl w-full bg-white p-8 rounded-3xl shadow-2xl border border-blue-100 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-4 border-b border-blue-100">
                        <Unlock className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-blue-600">메시지 열람</span>
                    </div>

                    {/* Recipient Info with Relationship */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <p className="text-xs text-blue-600 font-medium mb-1">To.</p>
                                <p className="text-lg font-bold text-gray-900">{recipientName}</p>
                            </div>
                            {relationship && (
                                <div className="px-4 py-2 bg-white border-2 border-blue-500 rounded-full shadow-sm">
                                    <p className="text-sm font-bold text-blue-600">{relationship}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attachments Grid */}
                    {attachments && attachments.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-700">사진/영상 첨부</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-100 shadow-lg group">
                                        {att.type?.startsWith('image/') ? (
                                            <img
                                                src={att.url}
                                                alt={`Attachment ${idx + 1}`}
                                                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                                                onClick={() => window.open(att.url, '_blank')}
                                            />
                                        ) : att.type?.startsWith('video/') ? (
                                            <video
                                                src={att.url}
                                                controls
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <span className="text-xs text-slate-500">파일</span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(att.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message Content */}
                    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-blue-100 shadow-sm">
                        <p className="whitespace-pre-wrap leading-relaxed text-gray-800 text-base">{messageContent}</p>
                    </div>
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
                                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                                        작성자(본인)의 휴대폰 번호로 인증번호를 보냅니다.<br />
                                        수신인이 작성자와 함께 있거나, 작성자의 휴대폰을 확인할 수 있어야 합니다.
                                    </p>
                                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-sm font-bold">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증번호 발송하기"}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyAndUnlock} className="space-y-3">
                                    <div className="text-center mb-4">
                                        <p className="text-sm text-zinc-300">작성자의 휴대폰으로 전송된<br />인증번호 6자리를 입력해주세요.</p>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="인증번호 6자리"
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-3 text-center tracking-[0.5em] text-lg font-mono focus:border-blue-500 outline-none transition-colors"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        required
                                        maxLength={6}
                                    />
                                    <Button type="submit" disabled={loading || code.length !== 6} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-sm font-bold mt-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "확인"}
                                    </Button>
                                </form>
                            )}
                        </div>
                        <button onClick={() => setMode('INITIAL')} className="text-xs text-zinc-500 hover:text-white w-full text-center py-2">
                            다른 방법 선택
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
