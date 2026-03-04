"use client";

// ============================================================
// 가디언즈 전용 오픈 페이지 (guardians/open/page.tsx)
// 사망진단서 업로드 및 API 키 입력으로 유산을 오픈하는 페이지입니다.
// - 비로그인 상태에서 접근 가능 (가디언즈는 에프텀 계정이 없을 수 있음)
// - URL 파라미터에 유저 ID(uid)가 포함되어 있어야 합니다.
// ============================================================

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Upload, Key, User, Phone, CheckCircle, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense } from "react";

// 디지털 유산 항목 타입
interface VaultItem {
    id: string;
    category: string;
    platform_name: string;
    username: string | null;
    notes: string | null;
}

// 오픈 상태 타입
type OpenStep = "form" | "success";

function GuardianOpenContent() {
    const searchParams = useSearchParams();
    // URL 파라미터에서 유저 ID 가져오기 (?uid=xxxx)
    const userId = searchParams.get("uid");

    const [step, setStep] = useState<OpenStep>("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // 폼 입력값 상태
    const [form, setForm] = useState({
        name: "",
        phone: "",
        apiKey: ""
    });
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPath, setCertPath] = useState<string | null>(null);

    // 결과 데이터
    const [result, setResult] = useState<{
        messagesReleased: number;
        totalMessages: number;
        vaultItems: VaultItem[];
    } | null>(null);

    // 전화번호 포맷
    const formatPhone = (value: string) => {
        const num = value.replace(/[^0-9]/g, "").slice(0, 11);
        if (num.length > 7) return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7)}`;
        if (num.length > 3) return `${num.slice(0, 3)}-${num.slice(3)}`;
        return num;
    };

    // 사망진단서 파일 선택 및 Supabase Storage 업로드
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("파일 크기는 10MB 이하여야 합니다.");
            return;
        }

        setCertFile(file);
        setIsUploading(true);

        try {
            const supabase = createClient();
            const ext = file.name.split(".").pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const path = `${userId || "unknown"}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("death_certificates")
                .upload(path, file);

            if (uploadError) throw uploadError;

            setCertPath(path);
        } catch (err) {
            console.error("사망진단서 업로드 오류:", err);
            alert("파일 업로드 중 오류가 발생했습니다.");
            setCertFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    // 인증 제출 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            alert("올바르지 않은 링크입니다. 문자로 받은 링크를 다시 확인해주세요.");
            return;
        }

        if (!form.name || !form.phone || !form.apiKey) {
            alert("모든 정보를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/guardians/verify-open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    guardianName: form.name,
                    guardianPhone: form.phone,
                    apiKey: form.apiKey,
                    deathCertificatePath: certPath
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "인증에 실패했습니다.");
                return;
            }

            setResult(data);
            setStep("success");
        } catch (err) {
            console.error("오픈 인증 오류:", err);
            alert("인증 처리 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 유효하지 않은 링크
    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-sm w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-lg font-bold text-slate-800">올바르지 않은 링크입니다.</h1>
                    <p className="text-sm text-slate-500">
                        문자로 받으신 링크를 다시 확인해주세요.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* 헤더 */}
            <header className="w-full bg-white border-b border-slate-200 h-14 flex items-center justify-center px-5">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-base font-bold text-slate-800">에프텀 유산 오픈</span>
                </div>
            </header>

            <main className="max-w-md mx-auto p-5 pb-24">
                {step === "form" && (
                    <div className="space-y-6 mt-4">
                        {/* 안내 */}
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lock className="w-7 h-7 text-blue-600" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900">가디언즈 인증</h1>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                귀하의 정보와 사망진단서를 제출하시면<br />
                                보관된 메시지와 디지털 유산이 공개됩니다.
                            </p>
                        </div>

                        {/* 인증 폼 */}
                        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">

                            {/* 이름 */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <User className="w-3.5 h-3.5" /> 가디언즈 이름
                                </label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="성함을 입력해주세요"
                                    required
                                    className="h-10 text-sm"
                                />
                            </div>

                            {/* 전화번호 */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Phone className="w-3.5 h-3.5" /> 전화번호
                                </label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                                    placeholder="010-0000-0000"
                                    type="tel"
                                    required
                                    className="h-10 text-sm"
                                />
                            </div>

                            {/* API 키 입력 */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Key className="w-3.5 h-3.5" /> API 키
                                </label>
                                <Input
                                    value={form.apiKey}
                                    onChange={(e) => setForm(p => ({ ...p, apiKey: e.target.value }))}
                                    placeholder="afterm-xxxxxxxxxxxxxxxx"
                                    required
                                    className="h-10 text-sm font-mono"
                                />
                                <p className="text-[11px] text-slate-400 ml-1">
                                    API 키는 고인으로부터 별도로 전달받으셨거나, 유품에서 찾을 수 있습니다.
                                </p>
                            </div>

                            {/* 사망진단서 업로드 */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Upload className="w-3.5 h-3.5" /> 사망진단서 첨부 (선택)
                                </label>
                                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${certFile
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'
                                    }`}>
                                    {certFile ? (
                                        <div className="text-center">
                                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                            <p className="text-xs font-bold text-green-600">{certFile.name}</p>
                                            {isUploading && (
                                                <p className="text-[11px] text-slate-400 mt-1">업로드 중...</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                                            <p className="text-xs text-slate-400">PDF 또는 이미지 파일 (최대 10MB)</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || isUploading}
                                className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
                            >
                                {isSubmitting ? "인증 처리 중..." : "인증 및 유산 공개"}
                            </Button>
                        </form>

                        <p className="text-[11px] text-center text-slate-400">
                            제출된 정보는 유산 공개 목적으로만 사용되며, 안전하게 보관됩니다.
                        </p>
                    </div>
                )}

                {/* 오픈 완료 화면 */}
                {step === "success" && result && (
                    <div className="space-y-6 mt-4 animate-fade-in">
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-7 h-7 text-green-600" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900">인증 완료</h1>
                            <p className="text-xs text-slate-500">
                                {result.messagesReleased}개의 메시지가 수신인에게 전달되었습니다.
                            </p>
                        </div>

                        {/* 디지털 유산 목록 */}
                        {result.vaultItems.length > 0 ? (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-700">보관된 디지털 유산</h2>
                                {result.vaultItems.map(item => (
                                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-sm">{item.platform_name}</p>
                                                {item.username && (
                                                    <p className="text-xs text-slate-500 mt-0.5">아이디: {item.username}</p>
                                                )}
                                                {item.notes && (
                                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.notes}</p>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full flex-shrink-0">
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-xl p-6 text-center text-slate-400 text-sm">
                                등록된 디지털 유산이 없습니다.
                            </div>
                        )}

                        <p className="text-[11px] text-center text-slate-400">
                            이 페이지를 닫으면 유산 목록에 다시 접근할 수 없습니다.<br />
                            필요한 정보를 안전한 곳에 기록해두세요.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

// Suspense 래퍼 (useSearchParams는 Suspense 필요)
export default function GuardianOpenPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <GuardianOpenContent />
        </Suspense>
    );
}
