"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { requestOTP, verifyOTP } from "@/app/actions/verifyRecipient";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, Eye } from "lucide-react";

export default function AuthViewPage() {
    const params = useParams();
    const messageId = params.messageId as string;

    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<'phone' | 'code' | 'view'>('phone');
    const [loading, setLoading] = useState(false);
    const [messageContent, setMessageContent] = useState("");

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await requestOTP(messageId, phone);
        setLoading(false);

        if (res.success) {
            alert("인증번호가 발송되었습니다.");
            setStep('code');
        } else {
            alert(res.error || "인증번호 발송 실패");
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await verifyOTP(messageId, phone, code);
        setLoading(false);

        if (res.success && res.content) {
            setMessageContent(res.content);
            setStep('view');
        } else {
            alert(res.error || "인증 실패");
        }
    };

    // Dark Theme Container
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 animate-fade-in">

            {step !== 'view' && (
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                            <Lock className="w-5 h-5 text-zinc-500" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">본인 확인</h1>
                        <p className="text-zinc-400 text-sm">
                            메시지 열람을 위해 수신인 인증이 필요합니다.<br />
                            등록된 휴대폰 번호로 인증해주세요.
                        </p>
                    </div>

                    {step === 'phone' ? (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 ml-1">휴대폰 번호</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="01012345678"
                                    className="flex h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-700 placeholder:text-zinc-600 transition-all"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || phone.length < 10}
                                className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증번호 받기"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 ml-1">인증번호 6자리</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="123456"
                                    className="flex h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-700 placeholder:text-zinc-600 transition-all text-center tracking-widest text-lg"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || code.length < 6}
                                className="w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold border-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증하고 열람하기"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full text-xs text-zinc-500 hover:text-zinc-300 underline"
                            >
                                번호 다시 입력하기
                            </button>
                        </form>
                    )}
                </div>
            )}

            {step === 'view' && (
                <div className="w-full max-w-md animate-fade-in-up">
                    <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                        <div className="mb-6 flex items-center gap-3 text-zinc-400">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <Unlock className="w-4 h-4" />
                            </div>
                            <span className="text-sm">보안 잠금 해제됨</span>
                        </div>

                        <div className="prose prose-invert prose-p:leading-relaxed prose-lg max-w-none min-h-[200px] text-zinc-100 whitespace-pre-wrap">
                            {messageContent}
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                            <p className="text-xs text-zinc-600">
                                이 메시지는 귀하에게만 공개되었습니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
