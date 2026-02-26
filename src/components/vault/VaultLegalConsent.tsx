"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

interface LegalConsentProps {
    onComplete: (consents: {
        financialConsent: boolean;
        platformConsent: boolean;
        delegationConsent: boolean;
    }) => void;
}

export function VaultLegalConsent({ onComplete }: LegalConsentProps) {
    const [agreed, setAgreed] = useState(false);

    const handleContinue = () => {
        if (agreed) {
            onComplete({
                financialConsent: true,
                platformConsent: true,
                delegationConsent: true
            });
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                    안전한 정보 저장을 위해<br />아래 내용을 확인해주세요
                </h2>
                <p className="text-sm text-slate-500">
                    원활한 사후 정리를 위한 기본 안내입니다.
                </p>
            </div>

            {/* Combined Consent Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">
                        저장 전 알아두어야 할 사항
                    </h3>
                </div>

                <ul className="text-sm text-slate-600 leading-relaxed space-y-3 list-disc pl-4 marker:text-slate-300">
                    <li>
                        <strong>금융 정보 제외:</strong> 전자금융거래법상 타인 양도가 금지된 은행/증권 등의 보안매체 정보(비밀번호, OTP 등) 저장은 불법이며, 본인에게 책임이 있습니다.
                    </li>
                    <li>
                        <strong>플랫폼 정책 확인:</strong> 일부 서비스는 계정 공유를 제한할 수 있으나, 사후 계정 정리(해지/탈퇴) 목적을 위해 본인의 의지로 정보를 남김을 확인합니다.
                    </li>
                    <li>
                        <strong>사후 정리 권한 위임:</strong> 본인은 사후에 지정된 수신자가 본 계정에 접속하여 데이터를 대신 정리하는 것에 동의합니다.
                    </li>
                </ul>
            </div>

            {/* Combined Checkbox */}
            <div className="mb-6">
                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-200 transition-colors">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-600 flex-shrink-0"
                    />
                    <span className="text-sm font-bold text-slate-700">
                        작성 정보 저장 전 동의 사항을 모두 확인했습니다.
                    </span>
                </label>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={!agreed}
                className={`w-full h-14 rounded-xl font-bold text-sm transition-all ${agreed
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
            >
                {agreed ? '작성 시작하기' : '안내 사항에 동의해주세요'}
            </button>
        </div>
    );
}
