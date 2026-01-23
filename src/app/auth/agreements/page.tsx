"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, THIRD_PARTY_PROVISION, ENTRUSTMENT } from "@/lib/compliance";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, LogOut } from "lucide-react";

export default function AgreementsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedThirdParty, setAgreedThirdParty] = useState(false);
    const [agreedEntrustment, setAgreedEntrustment] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const allChecked = agreedTerms && agreedPrivacy && agreedThirdParty && agreedEntrustment;

    const handleAllCheck = () => {
        const newValue = !allChecked;
        setAgreedTerms(newValue);
        setAgreedPrivacy(newValue);
        setAgreedThirdParty(newValue);
        setAgreedEntrustment(newValue);
    };

    const toggleExpand = (id: string) => {
        setExpanded(expanded === id ? null : id);
    };

    const handleSubmit = async () => {
        if (!allChecked) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Insert agreement record
            const { error } = await supabase
                .from('user_agreements')
                .insert({
                    user_id: user.id,
                    terms_agreed: agreedTerms,
                    privacy_agreed: agreedPrivacy,
                    third_party_agreed: agreedThirdParty,
                    entrustment_agreed: agreedEntrustment,
                    terms_version: '1.0'
                });

            if (error) throw error;

            if (error) throw error;

            // Redirect to next step (Phone Verification)
            router.push("/auth/verify-phone");
        } catch (error: any) {
            console.error(error);
            alert("처리 중 오류가 발생했습니다: " + (error.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
    };

    const AgreementItem = ({
        id,
        title,
        checked,
        setChecked,
        content
    }: {
        id: string;
        title: string;
        checked: boolean;
        setChecked: (v: boolean) => void;
        content: string;
    }) => (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div
                className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setChecked(!checked)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {checked && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold text-slate-700">{title}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                    {expanded === id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>
            {expanded === id && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed h-48 overflow-y-auto">
                    {content}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium p-2 rounded-lg hover:bg-slate-100"
            >
                <LogOut className="w-4 h-4" />
                선택 취소 (나가기)
            </button>

            <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">약관 동의</h1>
                    <p className="text-slate-500 text-sm">서비스 이용을 위해 필수 약관에 동의해주세요.</p>
                </div>

                <div
                    onClick={handleAllCheck}
                    className="flex items-center gap-3 p-4 mb-6 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${allChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-blue-300'}`}>
                        {allChecked && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold text-blue-900">모두 동의합니다</span>
                </div>

                <div className="space-y-3 mb-8">
                    <AgreementItem
                        id="terms"
                        title="[필수] 서비스 이용약관"
                        checked={agreedTerms}
                        setChecked={setAgreedTerms}
                        content={TERMS_OF_SERVICE}
                    />
                    <AgreementItem
                        id="privacy"
                        title="[필수] 개인정보 수집 및 이용"
                        checked={agreedPrivacy}
                        setChecked={setAgreedPrivacy}
                        content={PRIVACY_POLICY}
                    />
                    <AgreementItem
                        id="thirdparty"
                        title="[필수] 제3자 제공 동의"
                        checked={agreedThirdParty}
                        setChecked={setAgreedThirdParty}
                        content={THIRD_PARTY_PROVISION}
                    />
                    <AgreementItem
                        id="entrustment"
                        title="[필수] 개인정보 처리 위탁"
                        checked={agreedEntrustment}
                        setChecked={setAgreedEntrustment}
                        content={ENTRUSTMENT}
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={!allChecked || loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 text-lg rounded-xl disabled:opacity-50"
                >
                    {loading ? "처리 중..." : "동의하고 계속하기"}
                </Button>
            </div>
        </div>
    );
}
