"use client";

import { Button } from "@/components/ui/button";
import { SpaceFormData } from "./SpaceCreationWizard";
import { Sparkles, ArrowLeft } from "lucide-react";

interface Step2Props {
    data: SpaceFormData;
    updateData: (updates: Partial<SpaceFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step2Persona({ data, updateData, onNext, onBack }: Step2Props) {
    const isValid = true;

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">공간을 어떻게 꾸밀까요?</h2>
                <p className="text-slate-500 text-sm mt-2">대표 사진과 작성자의 별명을 설정해주세요.</p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative group">
                    <label className="block w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer relative overflow-hidden shadow-sm">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => updateData({ profileFile: e.target.files?.[0] || null })}
                        />
                        {data.profileFile ? (
                            <img src={URL.createObjectURL(data.profileFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                <Sparkles size={24} className="mb-2 text-slate-300" />
                                <span className="text-xs font-medium text-slate-400">사진 등록</span>
                            </div>
                        )}

                        {/* Overlay for hover effect or when image exists */}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Sparkles className="text-white" size={20} />
                        </div>
                    </label>
                    <p className="text-center text-sm font-bold text-slate-700 mt-3">대표 사진 (고인)</p>
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 py-6 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> 이전
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!isValid}
                    className="flex-[2] py-6 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl"
                >
                    다음 단계로
                </Button>
            </div>
        </div>
    );
}
