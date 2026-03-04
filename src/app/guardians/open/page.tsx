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
    const [searchForm, setSearchForm] = useState({ deceasedName: "", birthDate: "", apiKey: "" });
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchForm.deceasedName || !searchForm.birthDate || !searchForm.apiKey) {
            alert("모든 항목을 입력해주세요.");
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch("/api/guardians/find-by-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deceasedName: searchForm.deceasedName,
                    birthDate: searchForm.birthDate,
                    apiKey: searchForm.apiKey,
                    deathCertificatePath: certPath
                })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || "찾기에 실패했습니다."); return; }
            setResult(data);
            setStep("success");
        } catch (err) {
            console.error(err);
            alert("처리 중 오류가 발생했습니다.");
        } finally {
            setIsSearching(false);
        }
    };

    // uid 없이 접근 → 고인 디지털 유산 직접 찾기 모드
    if (!userId) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white font-sans">
                <header className="w-full h-14 flex items-center justify-center border-b border-white/10 px-5">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-bold text-white">AFTERM · 고인 디지털 유산 찾기</span>
                    </div>
                </header>

                <main className="max-w-md mx-auto px-5 py-10 pb-24">
                    {step === "form" ? (
                        <div className="space-y-6">
                            <div className="text-center space-y-2 mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 mb-4">
                                    <span className="text-3xl">🔍</span>
                                </div>
                                <h1 className="text-xl font-bold text-white">고인의 디지털 유산 찾기</h1>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    고인이 AFTERM에 보관한 디지털 유산을<br />
                                    사망진단서와 API 키로 안전하게 열람하세요.
                                </p>
                            </div>

                            <form onSubmit={handleSearch} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                                {/* 사망진단서 업로드 */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                        <Upload className="w-3.5 h-3.5" /> 사망진단서 업로드 <span className="text-slate-500">(OCR 이름 자동추출)</span>
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-blue-400/50 hover:bg-white/5 transition-all">
                                        {isUploading ? (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                업로드 중...
                                            </div>
                                        ) : certFile ? (
                                            <div className="text-center">
                                                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                                <p className="text-xs text-green-400 font-medium">{certFile.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                                                <p className="text-xs text-slate-500">이미지 또는 PDF 클릭하여 업로드</p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>

                                {/* 고인 이름 */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                        <User className="w-3.5 h-3.5" /> 고인 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={searchForm.deceasedName}
                                        onChange={e => setSearchForm(p => ({ ...p, deceasedName: e.target.value }))}
                                        placeholder="홍길동"
                                        required
                                        className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30"
                                    />
                                </div>

                                {/* 생년월일 */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                        <Phone className="w-3.5 h-3.5" /> 생년월일
                                    </label>
                                    <input
                                        type="date"
                                        value={searchForm.birthDate}
                                        onChange={e => setSearchForm(p => ({ ...p, birthDate: e.target.value }))}
                                        required
                                        className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30"
                                    />
                                </div>

                                {/* API 키 */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                        <Key className="w-3.5 h-3.5" /> 에프텀 API 키
                                    </label>
                                    <input
                                        type="text"
                                        value={searchForm.apiKey}
                                        onChange={e => setSearchForm(p => ({ ...p, apiKey: e.target.value }))}
                                        placeholder="afterm-xxxxxxxxxxxxxxxx"
                                        required
                                        className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30"
                                    />
                                    <p className="text-[10px] text-slate-500">고인이 생전에 공유했거나 비상연락처에 보관된 API 키입니다.</p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                                >
                                    {isSearching ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            인증 중...
                                        </div>
                                    ) : "디지털 유산 열기"}
                                </Button>
                            </form>

                            <p className="text-center text-[10px] text-slate-600 leading-relaxed">
                                이 서비스는 고인의 명시적 동의 하에 운영됩니다.<br />
                                모든 접근은 암호화 로그로 기록됩니다.
                            </p>
                        </div>
                    ) : (
                        // 성공 결과 (아래 기존 success UI 재활용)
                        <div className="text-center space-y-4 py-10">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                            <h1 className="text-xl font-bold text-white">인증 완료</h1>
                            <p className="text-slate-400 text-sm">
                                디지털 유산 {result?.vaultItems?.length ?? 0}개가 공개되었습니다.
                            </p>
                            {result?.vaultItems && result.vaultItems.length > 0 && (
                                <div className="space-y-3 mt-6 text-left">
                                    {result.vaultItems.map((v) => (
                                        <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                            <p className="font-bold text-white text-sm">{v.platform_name}</p>
                                            {v.username && <p className="text-xs text-slate-400 mt-1">계정: {v.username}</p>}
                                            {v.notes && <p className="text-xs text-slate-500 mt-1">{v.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
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
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!form.name || !form.phone || !form.apiKey) { alert("모든 정보를 입력해주세요."); return; }
                            setIsSubmitting(true);
                            try {
                                const res = await fetch("/api/guardians/verify-open", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId, guardianName: form.name, guardianPhone: form.phone, apiKey: form.apiKey, deathCertificatePath: certPath })
                                });
                                const data = await res.json();
                                if (!res.ok) { alert(data.error || "인증에 실패했습니다."); return; }
                                setResult(data);
                                setStep("success");
                            } catch (err) { console.error(err); alert("인증 처리 중 오류가 발생했습니다."); }
                            finally { setIsSubmitting(false); }
                        }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">

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
