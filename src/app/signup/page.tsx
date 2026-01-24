"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { Loader2, Check, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { validatePassword, TERMS_OF_SERVICE, PRIVACY_POLICY, THIRD_PARTY_PROVISION, ENTRUSTMENT } from "@/lib/compliance";

type SignupStep = "terms" | "info";

export default function SignupPage() {
    const supabase = createClient();
    const router = useRouter();
    const [step, setStep] = useState<SignupStep>("terms");
    const [loading, setLoading] = useState(false);

    // --- Step 1: Agreements State ---
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedThirdParty, setAgreedThirdParty] = useState(false);
    const [agreedEntrustment, setAgreedEntrustment] = useState(false);
    const allAgreed = agreedTerms && agreedPrivacy && agreedThirdParty && agreedEntrustment;
    const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);

    // --- Step 2: Info & Verification State ---
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Email Verification
    const [emailCode, setEmailCode] = useState("");
    const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    // --- Handlers ---

    // 1. Move to Info Step
    const handleNextToInfo = () => {
        if (!allAgreed) {
            alert("모든 필수 약관에 동의해주세요.");
            return;
        }
        setStep("info");
    };

    // 2. Send Email Verification Code
    const sendEmailVerification = async () => {
        if (!email || !email.includes("@")) {
            alert("올바른 이메일 주소를 입력해주세요.");
            return;
        }
        setSendingEmail(true);
        try {
            const res = await fetch('/api/email/verify/send', {
                method: 'POST',
                body: JSON.stringify({ email })
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
            setSendingEmail(false);
        }
    };

    // 3. Register User (Verify Email Code -> Create User -> Auto Login)
    const handleRegister = async () => {
        if (!email || !password || !emailCode) return;

        // Validate Password
        const pwCheck = validatePassword(password, email);
        if (!pwCheck.isValid) {
            alert(pwCheck.message);
            return;
        }
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);
        try {
            // A. Register API (Verifies Code + Creates User)
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, code: emailCode })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "회원가입 실패");
            }

            // B. Auto Login
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) throw loginError;

            // C. Insert Agreements (Best effort after login)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_agreements').upsert({
                    user_id: user.id,
                    terms_agreed: agreedTerms,
                    privacy_agreed: agreedPrivacy,
                    third_party_agreed: agreedThirdParty,
                    entrustment_agreed: agreedEntrustment,
                    agreed_at: new Date().toISOString(),
                    version: '1.0'
                });
            }

            // D. Redirect to Onboarding (Phone & Profile)
            router.replace("/onboarding");

        } catch (error: any) {
            alert(error.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="max-w-md mx-auto px-6 pt-32 pb-20 animate-in fade-in duration-500">

                {/* Header Text */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">회원가입</h1>
                    <p className="text-slate-500">
                        {step === "terms" ? "서비스 이용을 위해 약관에 동의해주세요." : "계정 정보를 입력해주세요."}
                    </p>
                </div>

                {/* --- Step 1: Agreements --- */}
                {step === "terms" && (
                    <div className="space-y-6">
                        {/* All Agree Checkbox */}
                        <div
                            className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => {
                                const newState = !allAgreed;
                                setAgreedTerms(newState);
                                setAgreedPrivacy(newState);
                                setAgreedThirdParty(newState);
                                setAgreedEntrustment(newState);
                            }}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${allAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                {allAgreed && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-bold text-slate-900 text-lg">약관 전체 동의</span>
                        </div>

                        <div className="space-y-4 px-2">
                            {/* Terms */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAgreedTerms(!agreedTerms)}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedTerms ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                        {agreedTerms && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 서비스 이용약관</span>
                                </div>
                                <button onClick={() => setExpandedAgreement('terms')} className="text-xs text-slate-400 underline hover:text-slate-600">내용보기</button>
                            </div>

                            {/* Privacy */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAgreedPrivacy(!agreedPrivacy)}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedPrivacy ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                        {agreedPrivacy && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 개인정보 수집 및 이용</span>
                                </div>
                                <button onClick={() => setExpandedAgreement('privacy')} className="text-xs text-slate-400 underline hover:text-slate-600">내용보기</button>
                            </div>

                            {/* Third Party */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAgreedThirdParty(!agreedThirdParty)}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedThirdParty ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                        {agreedThirdParty && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 제3자 제공 동의</span>
                                </div>
                                <button onClick={() => setExpandedAgreement('third-party')} className="text-xs text-slate-400 underline hover:text-slate-600">내용보기</button>
                            </div>

                            {/* Entrustment */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAgreedEntrustment(!agreedEntrustment)}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${agreedEntrustment ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                        {agreedEntrustment && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700"><span className="text-blue-600">[필수]</span> 개인정보 처리 위탁</span>
                                </div>
                                <button onClick={() => setExpandedAgreement('entrustment')} className="text-xs text-slate-400 underline hover:text-slate-600">내용보기</button>
                            </div>
                        </div>

                        <Button
                            onClick={handleNextToInfo}
                            disabled={!allAgreed}
                            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-8"
                        >
                            다음으로
                        </Button>
                    </div>
                )}

                {/* --- Step 2: Info & Verification --- */}
                {step === "info" && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    disabled={isEmailCodeSent}
                                    className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Button
                                    onClick={sendEmailVerification}
                                    disabled={sendingEmail || isEmailCodeSent}
                                    className="w-24 rounded-xl bg-slate-800 text-white font-bold text-xs"
                                >
                                    {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : isEmailCodeSent ? "완료" : "인증"}
                                </Button>
                            </div>
                        </div>

                        {/* Verification Code */}
                        {isEmailCodeSent && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">인증번호</label>
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    placeholder="이메일로 전송된 6자리 코드"
                                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold tracking-widest"
                                    maxLength={6}
                                />
                                <p className="text-xs text-blue-600 mt-2 ml-1">인증번호가 발송되었습니다. 이메일을 확인해주세요.</p>
                            </div>
                        )}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호를 다시 입력해주세요"
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {password && confirmPassword && (
                                <p className={`text-xs mt-2 ml-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                    {password === confirmPassword ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleRegister}
                            disabled={loading || !emailCode || !password || password !== confirmPassword}
                            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-8"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입하기"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Agreement Detail Modal */}
            {expandedAgreement && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setExpandedAgreement(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-900">
                                {expandedAgreement === 'terms' && '서비스 이용약관'}
                                {expandedAgreement === 'privacy' && '개인정보 수집 및 이용'}
                                {expandedAgreement === 'third-party' && '제3자 제공'}
                                {expandedAgreement === 'entrustment' && '개인정보 처리 위탁'}
                            </h3>
                            <button
                                onClick={() => setExpandedAgreement(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <Check className="w-5 h-5 rotate-45" /> {/* Close Icon alternative */}
                            </button>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {expandedAgreement === 'terms' && TERMS_OF_SERVICE}
                            {expandedAgreement === 'privacy' && PRIVACY_POLICY}
                            {expandedAgreement === 'third-party' && THIRD_PARTY_PROVISION}
                            {expandedAgreement === 'entrustment' && ENTRUSTMENT}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
