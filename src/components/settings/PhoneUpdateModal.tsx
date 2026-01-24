"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Smartphone, Check, ArrowRight, X } from "lucide-react";

interface PhoneUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEmail: string;
    onSuccess: (newPhone: string) => void;
}

export function PhoneUpdateModal({ isOpen, onClose, currentEmail, onSuccess }: PhoneUpdateModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Email Verification
    const [emailCode, setEmailCode] = useState("");
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);

    // Step 2: New Phone Verification
    const [newPhone, setNewPhone] = useState("");
    const [phoneCode, setPhoneCode] = useState("");
    const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setLoading(false);
            setEmailCode("");
            setIsEmailCodeSent(false);
            setNewPhone("");
            setPhoneCode("");
            setIsPhoneCodeSent(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Step 1: Email Handlers ---
    const sendEmailCode = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/email/verify/send', {
                method: 'POST',
                body: JSON.stringify({ email: currentEmail })
            });
            const data = await res.json();
            if (data.success) {
                setIsEmailCodeSent(true);
                alert("인증번호가 이메일로 발송되었습니다.");
            } else {
                alert(data.error || "이메일 발송 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const verifyEmailCode = async () => {
        if (!emailCode) return;
        setLoading(true);
        try {
            const res = await fetch('/api/email/verify/confirm', {
                method: 'POST',
                body: JSON.stringify({ email: currentEmail, code: emailCode })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2); // Move to Step 2
            } else {
                alert("인증번호가 올바르지 않습니다.");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Phone Handlers ---
    const sendPhoneCode = async () => {
        if (!newPhone || newPhone.length < 10) {
            alert("올바른 휴대폰 번호를 입력해주세요.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/verify/send', {
                method: 'POST',
                body: JSON.stringify({ phone: newPhone })
            });
            const data = await res.json();
            if (data.success) {
                setIsPhoneCodeSent(true);
                alert("인증번호가 문자로 발송되었습니다.");
            } else {
                alert(data.error || "문자 발송 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const verifyPhoneAndSave = async () => {
        if (!phoneCode) return;
        setLoading(true);
        try {
            // 1. Verify SMS Code
            const res = await fetch('/api/verify/confirm', {
                method: 'POST',
                body: JSON.stringify({ phone: newPhone, code: phoneCode })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error("인증번호가 올바르지 않습니다.");
            }

            // 2. Save to DB
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            const cleanPhone = newPhone.replace(/-/g, '');
            const { error: updateError } = await supabase.from('profiles').upsert({
                id: user.id,
                phone: cleanPhone,
                updated_at: new Date().toISOString()
            });

            if (updateError) throw updateError;

            // Success!
            setStep(3);
            setTimeout(() => {
                onSuccess(cleanPhone);
                onClose();
            }, 2000);

        } catch (error: any) {
            alert(error.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900">전화번호 변경</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mb-8 justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                        <div className={`h-1 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-100'}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                        <div className={`h-1 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-slate-100'}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
                    </div>

                    {/* Step 1: Email Auth */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Mail className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-bold text-slate-900">이메일 본인인증</h4>
                                <p className="text-sm text-slate-500 mt-1">보안을 위해 먼저 이메일 인증이 필요합니다.<br />({currentEmail})</p>
                            </div>

                            {!isEmailCodeSent ? (
                                <Button onClick={sendEmailCode} disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "인증번호 발송"}
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={emailCode}
                                        onChange={(e) => setEmailCode(e.target.value)}
                                        placeholder="인증번호 6자리"
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold tracking-widest text-lg"
                                        maxLength={6}
                                    />
                                    <Button onClick={verifyEmailCode} disabled={loading || !emailCode} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "확인"}
                                    </Button>
                                    <button onClick={sendEmailCode} className="w-full text-xs text-slate-400 hover:text-slate-600 underline">인증번호 재발송</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: New Phone Auth */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Smartphone className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-bold text-slate-900">새 휴대폰 번호 인증</h4>
                                <p className="text-sm text-slate-500 mt-1">변경할 휴대폰 번호를 입력해주세요.</p>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                    placeholder="010-0000-0000"
                                    disabled={isPhoneCodeSent}
                                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                                <Button onClick={sendPhoneCode} disabled={loading || isPhoneCodeSent} className="w-24 rounded-xl bg-slate-800 text-white font-bold text-xs">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPhoneCodeSent ? "완료" : "전송"}
                                </Button>
                            </div>

                            {isPhoneCodeSent && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        value={phoneCode}
                                        onChange={(e) => setPhoneCode(e.target.value)}
                                        placeholder="인증번호 6자리"
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold tracking-widest text-lg"
                                        maxLength={6}
                                    />
                                    <Button onClick={verifyPhoneAndSave} disabled={loading || !phoneCode} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "변경 완료"}
                                    </Button>
                                    <button onClick={() => { setIsPhoneCodeSent(false); setPhoneCode(""); }} className="w-full text-xs text-slate-400 hover:text-slate-600 underline">번호 다시 입력하기</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">변경 완료!</h3>
                            <p className="text-slate-500">전화번호가 성공적으로 변경되었습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
