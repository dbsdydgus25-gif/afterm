"use client";

import { Button } from "@/components/ui/button";
import { SpaceFormData } from "./SpaceCreationWizard";

interface Step1Props {
    data: SpaceFormData;
    updateData: (updates: Partial<SpaceFormData>) => void;
    onNext: () => void;
}

export function Step1Identity({ data, updateData, onNext }: Step1Props) {
    const isValid = data.title.trim().length > 0;

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">공간의 이름은 무엇인가요?</h2>
                <p className="text-slate-500 text-sm mt-2">추모 공간의 정체성을 나타내는 가장 중요한 정보입니다.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                        공간 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => updateData({ title: e.target.value })}
                        placeholder="예: 사랑하는 할머니를 기억하며"
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                        간단한 소개 (선택)
                    </label>
                    <textarea
                        value={data.description}
                        onChange={(e) => updateData({ description: e.target.value })}
                        placeholder="이 공간에 대해 짧게 소개해주세요."
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[120px] resize-none text-sm"
                    />
                </div>
            </div>

            <Button
                onClick={onNext}
                disabled={!isValid}
                className="w-full py-6 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl mt-4"
            >
                다음 단계로
            </Button>
        </div>
    );
}
