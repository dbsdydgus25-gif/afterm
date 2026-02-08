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
    const isValid = data.nickname.trim().length > 0;

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">공간을 어떻게 꾸밀까요?</h2>
                <p className="text-slate-500 text-sm mt-2">대표 사진과 작성자의 별명을 설정해주세요.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">대표 사진 (고인)</label>
                    <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden group">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => updateData({ profileFile: e.target.files?.[0] || null })}
                        />
                        {data.profileFile ? (
                            <img src={URL.createObjectURL(data.profileFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Sparkles size={18} />
                                </div>
                                <span className="text-xs font-medium">사진 선택</span>
                            </div>
                        )}
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">배경 사진 (커버)</label>
                    <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden group">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => updateData({ bgFile: e.target.files?.[0] || null })}
                        />
                        {data.bgFile ? (
                            <img src={URL.createObjectURL(data.bgFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Sparkles size={18} />
                                </div>
                                <span className="text-xs font-medium">배경 선택</span>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-slate-700">
                    나의 별명 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.nickname}
                    onChange={(e) => updateData({ nickname: e.target.value })}
                    placeholder="예: 사랑하는 손자, 20년지기 친구"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
                <p className="text-xs text-slate-400 pl-1">이 공간에서 활동할 때 사용할 이름입니다.</p>
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
