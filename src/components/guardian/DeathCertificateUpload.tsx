"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle, Loader2, FileText, Camera } from "lucide-react";

// ── 타입 ─────────────────────────────────────────────────────────────
interface DeathCertificateUploadProps {
    /** 인증 대상 고인의 Afterm user ID (알고 있는 경우) */
    deceasedUserId?: string;
    /** 인증 완료 콜백 */
    onVerified?: (result: VerificationResult) => void;
    /** 에러 콜백 */
    onError?: (error: string) => void;
}

interface VerificationResult {
    verificationId: string | null;
    deceased_name: string | null;
    death_date: string | null;
    issuing_institution: string | null;
    message: string;
}

type UploadStatus = "idle" | "loading" | "success" | "error";

// ════════════════════════════════════════════════════════════════
// 사망진단서 업로드 컴포넌트
// 1. 이미지 파일 선택 (카메라 또는 갤러리)
// 2. Base64로 변환 후 /api/ocr/death-certificate 호출
// 3. 결과 표시
// ════════════════════════════════════════════════════════════════
export function DeathCertificateUpload({
    deceasedUserId,
    onVerified,
    onError,
}: DeathCertificateUploadProps) {
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * 파일을 Base64 문자열로 변환합니다.
     */
    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // data:image/jpeg;base64,xxxx 에서 xxxx만 추출
                const result = reader.result as string;
                const base64 = result.split(",")[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    /**
     * 파일 선택 이벤트 처리 — OCR API 호출
     */
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 미리보기 URL 생성
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setStatus("loading");
        setErrorMessage("");

        try {
            // 파일 형식 추출 (jpg, png, pdf 등)
            const imageFormat = file.type.split("/")[1] || "jpg";

            // Base64 변환
            const imageBase64 = await fileToBase64(file);

            // OCR API 호출
            const res = await fetch("/api/ocr/death-certificate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64,
                    imageFormat,
                    deceasedUserId,
                }),
            });

            const data = await res.json();

            if (res.ok && data.status === "verified") {
                // 인증 성공
                const result: VerificationResult = {
                    verificationId: data.verificationId,
                    deceased_name: data.deceased_name,
                    death_date: data.death_date,
                    issuing_institution: data.issuing_institution,
                    message: data.message,
                };
                setVerificationResult(result);
                setStatus("success");
                onVerified?.(result);
            } else {
                // 인증 실패
                const errMsg = data.error || "사망진단서를 확인할 수 없습니다.";
                setErrorMessage(errMsg);
                setStatus("error");
                onError?.(errMsg);
            }
        } catch (err: any) {
            const errMsg = "이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
            setErrorMessage(errMsg);
            setStatus("error");
            onError?.(errMsg);
        }

        // input 초기화 (동일 파일 재선택 허용)
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [deceasedUserId, onVerified, onError]);

    /**
     * 다시 시도 — 상태 초기화
     */
    const handleReset = () => {
        setStatus("idle");
        setErrorMessage("");
        setVerificationResult(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    return (
        <div className="w-full space-y-4">
            {/* 히든 파일 인풋 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                aria-label="사망진단서 이미지 선택"
            />

            <AnimatePresence mode="wait">
                {/* ── 대기 상태 ── */}
                {status === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-blue-200 transition-all shadow-sm">
                            <FileText className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 mb-1">사망진단서 업로드</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-5">
                            사망진단서 또는 사체검안서 사진을 업로드해주세요.<br />
                            JPG, PNG, PDF 형식 지원
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                파일 선택
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <Camera className="w-3.5 h-3.5" />
                                카메라 촬영
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── 로딩 상태 ── */}
                {status === "loading" && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="border border-slate-200 rounded-2xl p-8 text-center bg-slate-50"
                    >
                        <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
                        <p className="text-sm font-bold text-slate-700 mb-1">사망진단서를 분석 중입니다</p>
                        <p className="text-xs text-slate-400">AI가 문서를 읽고 있어요. 잠시만 기다려주세요...</p>
                    </motion.div>
                )}

                {/* ── 인증 성공 ── */}
                {status === "success" && verificationResult && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="border border-green-200 rounded-2xl p-6 bg-green-50"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-green-800 mb-1">사망 사실 확인 완료 ✓</p>
                                <p className="text-xs text-green-600 mb-4">{verificationResult.message}</p>

                                {/* 인식된 정보 요약 */}
                                <div className="bg-white rounded-xl p-4 border border-green-100 space-y-2">
                                    {verificationResult.deceased_name && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-medium">고인 성명</span>
                                            <span className="text-slate-800 font-bold">{verificationResult.deceased_name}</span>
                                        </div>
                                    )}
                                    {verificationResult.death_date && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-medium">사망일</span>
                                            <span className="text-slate-800 font-bold">{verificationResult.death_date}</span>
                                        </div>
                                    )}
                                    {verificationResult.issuing_institution && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-medium">발급 기관</span>
                                            <span className="text-slate-800 font-bold">{verificationResult.issuing_institution}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── 인증 실패 ── */}
                {status === "error" && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="border border-red-200 rounded-2xl p-6 bg-red-50"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-red-800 mb-1">인증 실패</p>
                                <p className="text-xs text-red-500 mb-4">{errorMessage}</p>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    다시 시도
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 개인정보 안내 (항상 하단에 표시) */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed px-4">
                🔒 업로드된 사망진단서 이미지는 서버에 저장되지 않습니다.<br />
                인식 결과(이름, 사망일)만 암호화하여 보관됩니다.
            </p>
        </div>
    );
}
