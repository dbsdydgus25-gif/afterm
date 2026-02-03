"use client";

import { useState } from "react";
import { Scale, Info } from "lucide-react";

interface LegalConsentProps {
    onComplete: (consents: {
        financialConsent: boolean;
        platformConsent: boolean;
        delegationConsent: boolean;
    }) => void;
}

export function VaultLegalConsent({ onComplete }: LegalConsentProps) {
    const [financialConsent, setFinancialConsent] = useState(false);
    const [platformConsent, setPlatformConsent] = useState(false);
    const [delegationConsent, setDelegationConsent] = useState(false);

    const allChecked = financialConsent && platformConsent && delegationConsent;

    const handleContinue = () => {
        if (allChecked) {
            onComplete({ financialConsent, platformConsent, delegationConsent });
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-6">
                    <Scale className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                    잠깐! 작성 전 확인해주세요
                </h2>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                    안전하고 올바른 서비스 이용을 위해 안내합니다.
                </p>
            </div>

            {/* Warning Boxes */}
            <div className="space-y-4 mb-8">
                {/* Warning 1: Financial */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">
                                법적 효력 없음
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                본 서비스(AFTERM)를 통해 작성된 메시지, 사진, 영상 등은{" "}
                                <span className="font-bold text-slate-900">유언장으로서의 법적 효력을 갖지 않습니다.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning 2: Platform Terms */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">
                                법률 상담 권장
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                법적 구속력이 있는 유언을 남기고자 하시는 경우, 반드시 변호사나
                                공증인 등 법률 전문가의 도움을 받으시기 바랍니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consent Checkbox */}
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setFinancialConsent(checked);
                            setPlatformConsent(checked);
                            setDelegationConsent(checked);
                        }}
                        className="w-5 h-5 text-blue-600 rounded mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm md:text-base text-slate-900 leading-relaxed">
                        위 내용을 충분히 이해하였으며 동의합니다.
                    </span>
                </label>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={!allChecked}
                className={`w-full h-14 rounded-xl font-bold text-base md:text-lg transition-all ${allChecked
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
            >
                확인했습니다
            </button>
        </div>
    );
}
