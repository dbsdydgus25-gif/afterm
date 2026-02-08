"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpaceFormData } from "./SpaceCreationWizard";
import { ArrowLeft, Check, Copy, Link as LinkIcon, Loader2, Plus, X } from "lucide-react";

interface Step3Props {
    data: SpaceFormData;
    updateData: (updates: Partial<SpaceFormData>) => void;
    onSubmit: () => void;
    onBack: () => void;
    loading: boolean;
}

export function Step3Invite({ data, updateData, onSubmit, onBack, loading }: Step3Props) {
    const [emailInput, setEmailInput] = useState("");
    const [copied, setCopied] = useState(false);

    // Mock link for now (In real app, we might need to pre-generate ID or just show domain)
    const inviteLink = "https://afterm.co.kr/invite/pending...";

    const addEmail = () => {
        if (!emailInput.includes('@')) return;
        if (data.invites.includes(emailInput)) return;

        updateData({ invites: [...data.invites, emailInput] });
        setEmailInput("");
    };

    const removeEmail = (email: string) => {
        updateData({ invites: data.invites.filter(e => e !== email) });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEmail();
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">함께할 분들을 초대하세요</h2>
                <p className="text-slate-500 text-sm mt-2">가족, 친지, 친구들과 함께 추억을 나눠보세요.</p>
            </div>

            {/* Invite Link Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">초대 링크</span>
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">공간 생성 후 활성화</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-400 text-sm truncate flex items-center">
                        <LinkIcon size={14} className="mr-2 opacity-50" />
                        {inviteLink}
                    </div>
                    <Button
                        size="icon"
                        variant="outline"
                        className="rounded-xl shrink-0"
                        onClick={copyLink}
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </Button>
                </div>
            </div>

            {/* Email Invite Section */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">이메일로 초대장 보내기</label>
                <div className="relative">
                    <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="이메일 입력 후 엔터"
                        className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                    <button
                        onClick={addEmail}
                        disabled={!emailInput}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Email List */}
                {data.invites.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {data.invites.map((email) => (
                            <div key={email} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-sm font-medium">
                                {email}
                                <button
                                    onClick={() => removeEmail(email)}
                                    className="ml-2 hover:bg-blue-100 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Card (Mini Summary) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase text-center">최종 확인</p>
                <div className="bg-white border boundary-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        {data.profileFile ? (
                            <img src={URL.createObjectURL(data.profileFile)} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{data.title}</h4>
                        <p className="text-xs text-slate-500 truncate">작성자: {data.nickname}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 py-6 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> 수정하기
                </Button>
                <Button
                    onClick={onSubmit}
                    disabled={loading}
                    className="flex-[2] py-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            생성 중...
                        </>
                    ) : (
                        "공간 생성 완료"
                    )}
                </Button>
            </div>
        </div>
    );
}
