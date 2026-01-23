"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { validatePassword, TERMS_OF_SERVICE, PRIVACY_POLICY, THIRD_PARTY_PROVISION, ENTRUSTMENT } from "@/lib/compliance";

type Step = "terms" | "info" | "done";

export default function SignupPage() {
    const supabase = createClient();
    const router = useRouter();
    const [step, setStep] = useState<Step>("terms");

    // Terms State
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedThirdParty, setAgreedThirdParty] = useState(false);
    const [agreedEntrustment, setAgreedEntrustment] = useState(false);
    const allAgreed = agreedTerms && agreedPrivacy && agreedThirdParty && agreedEntrustment;

    // Info State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Agreements Insert logic (to be called after successful signup or effectively during signup via metadata?)
    // Actually, for local signup, we can insert agreements AFTER they sign up successfully in `onAuthStateChange` or manually here if we auto-login?
    // Supabase `signUp` doesn't auto-login if email confirm is on.
    // So we should store the agreements state in Metadata or a temporary cookie? 
    // OR create the user, then insert agreements. BUT if 'signUp' requires verification, we can't insert into 'user_agreements' (RLS needs user).
    // SOLUTION: We will pass the agreement timestamp in `options.data` (metadata) during signup.
    // Then a Trigger can copy it to the table, OR we insert it after they log in the first time.
    // Let's use metadata for "signed_agreement_at".

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: email.split('@')[0],
                        agreements: {
                            terms: agreedTerms,
                            privacy: agreedPrivacy,
                            third_party: agreedThirdParty,
                            entrustment: agreedEntrustment,
                            agreed_at: new Date().toISOString(),
                            version: '1.0'
                        }
                    }
                },
            });

            if (error) throw error;

            if (data.user) {
                // If auto-confirm is off, we are done.
                setStep("done");
            }
        } catch (err: any) {
            setError(err.message || "회원가입 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // Validation
    const passwordValidation = validatePassword(password, email);
    const isPasswordValid = password.length > 0 && passwordValidation.isValid;
    const isMatch = password === confirmPassword && password.length > 0;

    const AgreementItem = ({
        title,
        checked,
        setChecked,
        required = true
    }: {
        title: string;
        checked: boolean;
        setChecked: (v: boolean) => void;
        required?: boolean;
    }) => (
        <div
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setChecked(!checked)}
        >
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {checked && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="font-bold text-slate-700">
                    {required && <span className="text-blue-600 mr-1">[필수]</span>}
                    {title}
                </span>
            </div>
            <div className="text-xs text-slate-400 underline">내용보기</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
                <div className="max-w-md w-full mb-8">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className={`flex flex-col items-center gap-2 ${step === 'terms' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'terms' ? 'bg-blue-100' : 'bg-slate-200'}`}>1</div>
                            <span className="text-xs font-bold">약관동의</span>
                        </div>
                        <div className="h-[2px] w-20 bg-slate-200" />
                        <div className={`flex flex-col items-center gap-2 ${step === 'info' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'info' ? 'bg-blue-100' : 'bg-slate-200'}`}>2</div>
                            <span className="text-xs font-bold">정보입력</span>
                        </div>
                        <div className="h-[2px] w-20 bg-slate-200" />
                        <div className={`flex flex-col items-center gap-2 ${step === 'done' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'done' ? 'bg-blue-100' : 'bg-slate-200'}`}>3</div>
                            <span className="text-xs font-bold">가입완료</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        {step === "terms" && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold text-slate-900 mb-2">약관 동의</h1>
                                    <p className="text-slate-500 text-sm">서비스 이용을 위해 필수 약관에 동의해주세요.</p>
                                </div>
                                <div className="space-y-3">
                                    <AgreementItem title="서비스 이용약관" checked={agreedTerms} setChecked={setAgreedTerms} />
                                    <AgreementItem title="개인정보 수집 및 이용" checked={agreedPrivacy} setChecked={setAgreedPrivacy} />
                                    <AgreementItem title="제3자 정보 제공 동의" checked={agreedThirdParty} setChecked={setAgreedThirdParty} />
                                    <AgreementItem title="개인정보 처리 위탁" checked={agreedEntrustment} setChecked={setAgreedEntrustment} />
                                </div>
                                <Button
                                    onClick={() => setStep("info")}
                                    disabled={!allAgreed}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 text-lg rounded-xl"
                                >
                                    다음으로
                                    <ChevronRight className="w-5 h-5 ml-1" />
                                </Button>
                                <div className="text-center text-sm text-slate-500">
                                    이미 계정이 있으신가요? <Link href="/login" className="text-blue-600 font-bold hover:underline">로그인</Link>
                                </div>
                            </div>
                        )}

                        {step === "info" && (
                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-slate-900 mb-2">정보 입력</h1>
                                    <p className="text-slate-500 text-sm">로그인에 사용할 이메일과 비밀번호를 입력해주세요.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">이메일</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="example@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">비밀번호</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${password.length > 0 && !isPasswordValid ? 'border-red-200 bg-red-50' : 'border-slate-200 focus:ring-blue-500'
                                            }`}
                                        placeholder="10자 이상 (대/소/수/특 포함)"
                                    />
                                    {password.length > 0 && !isPasswordValid && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {passwordValidation.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">비밀번호 확인</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${confirmPassword.length > 0 && !isMatch ? 'border-red-200 bg-red-50' : 'border-slate-200 focus:ring-blue-500'
                                            }`}
                                        placeholder="비밀번호 재입력"
                                    />
                                    {confirmPassword.length > 0 && !isMatch && (
                                        <p className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setStep("terms")}
                                        variant="outline"
                                        className="w-1/3 py-6 rounded-xl border-slate-200 text-slate-600"
                                    >
                                        이전
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || !isPasswordValid || !isMatch}
                                        className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : "인증메일 발송"}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === "done" && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-4">인증 메일 발송 완료!</h1>
                                <p className="text-slate-600 mb-8 leading-relaxed">
                                    <strong>{email}</strong> 주소로 인증 메일을 보냈습니다.<br />
                                    메일함에서 링크를 클릭하시면<br />
                                    <span className="text-blue-600 font-bold">휴대폰 본인인증</span> 단계로 이어집니다.
                                </p>
                                <Link href="/login">
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl">
                                        로그인 페이지로 이동
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
