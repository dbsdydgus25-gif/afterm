"use client";

import { useState, useEffect } from "react";
import { Key, Copy, Check, Users, Plus, Shield, User, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Guardian {
    id: string;
    guardian_name: string;
    guardian_phone: string;
    status: "pending" | "opened";
    sms_sent: boolean;
    created_at: string;
}

export default function GuardiansTab() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    const [agreed, setAgreed] = useState(false);
    const [consentStep, setConsentStep] = useState(false);

    const [newGuardian, setNewGuardian] = useState({ name: "", phone: "" });
    const [showAddForm, setShowAddForm] = useState(false);

    const formatPhone = (value: string) => {
        const num = value.replace(/[^0-9]/g, "").slice(0, 11);
        if (num.length > 7) return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
        if (num.length > 3) return `${num.slice(0, 3)}-${num.slice(3)}`;
        return num;
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [keyRes, guardiansRes] = await Promise.all([
                    fetch("/api/guardians/generate-key"),
                    fetch("/api/guardians/add")
                ]);
                const keyData = await keyRes.json();
                const guardiansData = await guardiansRes.json();

                setApiKey(keyData.apiKey || null);
                setGuardians(guardiansData.guardians || []);
                if (keyData.apiKey) setConsentStep(true);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleGenerateKey = async () => {
        if (!agreed) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/guardians/generate-key", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setApiKey(data.apiKey);
                setConsentStep(true);
            }
        } catch (err) {
            alert("API 키 발급 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddGuardian = async () => {
        if (!newGuardian.name || newGuardian.phone.length < 12) {
            alert("가디언즈 이름과 정확한 전화번호를 입력해주세요.");
            return;
        }
        setIsAdding(true);
        try {
            const res = await fetch("/api/guardians/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guardianName: newGuardian.name, guardianPhone: newGuardian.phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "가디언즈 추가 실패");

            setGuardians([data.guardian, ...guardians]);
            setNewGuardian({ name: "", phone: "" });
            setShowAddForm(false);
            alert("가디언즈가 성공적으로 등록되었으며 안내 문자가 발송되었습니다.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">가디언즈 설정 안내</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                        가디언즈를 설정하면 해당 분께 안내 문자가 발송됩니다.<br />
                        신뢰할 수 있는 분으로 <strong>최소 3명 이상</strong> 설정하시는 것을 권장합니다.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">고유 API 키</p>
                        <p className="text-[11px] text-slate-500">가디언즈 인증 시 사용되는 비밀 키입니다.</p>
                    </div>
                </div>

                {apiKey ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                        <code className="text-xs font-mono text-slate-700 truncate flex-1">
                            {showApiKey ? apiKey : apiKey.replace(/afterm-(.+)/, (_, k) => `afterm-${'•'.repeat(k.length)}`)}
                        </code>
                        <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                            title={showApiKey ? 'API 키 숨기기' : 'API 키 보기'}
                        >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="복사"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-bold text-slate-700">API 키 발급 전 동의 사항</p>
                            <ul className="text-xs text-slate-500 leading-relaxed space-y-1.5 list-disc pl-3">
                                <li>고유 API 키는 가디언즈 인증 수단으로 사용됩니다.</li>
                                <li>가디언즈가 사망진단서와 API 키를 제출하면 보관된 유산이 공개됩니다.</li>
                                <li>API 키는 안전한 곳에 보관하고 가디언즈에게 별도로 전달해주세요.</li>
                            </ul>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600"
                            />
                            <span className="text-xs font-bold text-slate-700">위 내용에 모두 동의합니다.</span>
                        </label>
                        <Button
                            onClick={handleGenerateKey}
                            disabled={!agreed || isGenerating}
                            className={`w-full h-10 text-xs font-bold rounded-xl ${agreed ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400'}`}
                        >
                            {isGenerating ? "발급 중..." : "API 키 발급하기"}
                        </Button>
                    </div>
                )}
            </div>

            {consentStep && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">가디언즈 목록</p>
                                <p className="text-[11px] text-slate-500">
                                    {guardians.length}명 등록됨 {guardians.length < 3 && <span className="text-orange-500">(최소 3명 권장)</span>}
                                </p>
                            </div>
                        </div>
                        {!showAddForm && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                추가
                            </button>
                        )}
                    </div>

                    {guardians.length > 0 ? (
                        <div className="space-y-2">
                            {guardians.map((g, idx) => (
                                <div key={g.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{g.guardian_name}</p>
                                        <p className="text-[11px] text-slate-500">{g.guardian_phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.status === 'opened'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-200 text-slate-500'
                                            }`}>
                                            {g.status === 'opened' ? '인증완료' : '대기중'}
                                        </span>
                                        {g.sms_sent && (
                                            <span className="text-[10px] text-blue-500">📱 문자발송</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-400 text-xs">
                            등록된 가디언즈가 없습니다.
                        </div>
                    )}

                    {showAddForm && (
                        <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3 animate-fade-in">
                            <p className="text-xs font-bold text-slate-700">새 가디언즈 등록</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <Input
                                        value={newGuardian.name}
                                        onChange={(e) => setNewGuardian(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="가디언즈 이름"
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <Input
                                        value={newGuardian.phone}
                                        onChange={(e) => setNewGuardian(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                                        placeholder="010-0000-0000"
                                        type="tel"
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-blue-600">
                                등록 완료 시, 해당 번호로 안내 문자(SMS)가 발송됩니다.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowAddForm(false); setNewGuardian({ name: "", phone: "" }); }}
                                    className="flex-1 h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    취소
                                </button>
                                <Button
                                    onClick={handleAddGuardian}
                                    disabled={isAdding}
                                    className="flex-[2] h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                >
                                    {isAdding ? "등록 중..." : "등록 및 문자 발송"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {guardians.length < 3 && guardians.length > 0 && (
                        <p className="text-[11px] text-center text-orange-500 font-medium">
                            가디언즈를 최소 {3 - guardians.length}명 더 추가하시길 권장합니다.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
