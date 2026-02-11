"use client";

import { useState } from "react";
import { Shield, UserCheck } from "lucide-react";

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
            onComplete({
                financialConsent,
                platformConsent,
                delegationConsent
            });
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚖️</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                    계정 정보 저장 전 필수 확인
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                    금융 범죄 예방 및 안전한 상속을 위해<br />
                    아래 내용을 반드시 동의해야 저장됩니다.
                </p>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 mb-6">
                {/* 1. Financial Consent */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={financialConsent}
                            onChange={(e) => setFinancialConsent(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-slate-900">
                                    (필수) 은행/증권 보안매체 제외 확인
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                전자금융거래법상 타인 양도가 금지된 금융 정보(비번, OTP 등) 저장은 불법이며, 이에 대한 책임은 본인에게 있습니다.
                            </p>
                        </div>
                    </label>
                </div>

                {/* 2. Platform Policy Consent (NEW) */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={platformConsent}
                            onChange={(e) => setPlatformConsent(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-slate-900">
                                    (필수) 플랫폼별 이용 정책 확인
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                일부 서비스는 계정 공유를 제한할 수 있습니다. 하지만 <strong>&apos;사후 정리(해지/탈퇴)&apos;</strong>라는 특수 목적을 위해, 본인의 의지로 정보를 남김을 확인합니다.
                            </p>
                        </div>
                    </label>
                </div>

                {/* 3. Delegation Consent */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={delegationConsent}
                            onChange={(e) => setDelegationConsent(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <UserCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-slate-900">
                                    (필수) 사후 정리 권한 위임
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                본인은 사후에 지정된 수신자가 내 계정에 접속하여 데이터를 정리(해지/백업)하는 것에 동의합니다.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={!allChecked}
                className={`w-full h-12 rounded-xl font-bold text-sm transition-all ${allChecked
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
            >
                {allChecked ? '다음 단계로' : '모든 항목에 동의해주세요'}
            </button>
        </div>
    );
}
