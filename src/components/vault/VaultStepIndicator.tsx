"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

const STEP_LABELS = [
    "법적 동의",
    "수신인 지정",
    "계정 정보",
    "PIN 설정",
    "최종 확인"
];

export function VaultStepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    return (
        <div className="hidden lg:block sticky top-24 w-64">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">진행 단계</h3>
                <div className="space-y-3">
                    {Array.from({ length: totalSteps }).map((_, index) => {
                        const stepNumber = index;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;

                        return (
                            <div
                                key={stepNumber}
                                className={`flex items-center gap-3 ${isCurrent ? 'text-emerald-600' : isCompleted ? 'text-slate-400' : 'text-slate-300'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : isCurrent
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : stepNumber + 1}
                                </div>
                                <span className={`text-sm font-medium ${isCurrent ? 'font-bold' : ''}`}>
                                    {STEP_LABELS[stepNumber]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Mobile Progress Bar
export function VaultMobileProgress({ currentStep, totalSteps }: StepIndicatorProps) {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">
                    {STEP_LABELS[currentStep]}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                    {currentStep + 1}/{totalSteps}
                </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
