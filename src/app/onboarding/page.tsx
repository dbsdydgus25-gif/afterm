"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemoryStore } from "@/store/useMemoryStore";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft } from "lucide-react";
import { SecureAvatar } from "@/components/ui/SecureAvatar";

export default function OnboardingPage() {
    const router = useRouter();
    // ... existing hooks ...

    // ... (keep existing state/effects) ...

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500 relative">
                {/* Back/Logout Button */}
                <button
                    onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.replace("/login");
                    }}
                    className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                    aria-label="Go back to login"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="text-center mb-10 pt-4">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">환영합니다! 👋</h1>
                    <p className="text-slate-500">
                        서비스를 이용하기 전,<br />간단한 본인확인을 진행해주세요.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Profile Image */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 relative shadow-sm">
                                {profileImage ? (
                                    <SecureAvatar
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 font-bold text-3xl">
                                        {name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Default Avatars */}
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setProfileImage("https://api.dicebear.com/9.x/adventurer/svg?seed=Felix")} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors">👦 남성</button>
                        <button onClick={() => setProfileImage("https://api.dicebear.com/9.x/adventurer/svg?seed=Lisa")} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors">👧 여성</button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">이름 <span className="text-blue-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="실명을 입력하세요"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">별명 <span className="text-blue-500">*</span></label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="사용하실 별명을 입력하세요"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                            />
                        </div>

                        {/* Phone Verification Section */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">휴대폰 번호 <span className="text-blue-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`))}
                                    placeholder="010-0000-0000"
                                    maxLength={13}
                                    disabled={isVerified} // Disable if verified
                                    className="flex-1 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                <Button
                                    onClick={handleSendVerification}
                                    disabled={isVerified || isCodeSent && timer > 0}
                                    className="h-auto whitespace-nowrap rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold px-4"
                                >
                                    {isVerified ? "인증완료" : isCodeSent ? `재전송 (${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')})` : "인증번호"}
                                </Button>
                            </div>

                            {/* Verification Code Input */}
                            {isCodeSent && !isVerified && (
                                <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="인증번호 6자리"
                                        maxLength={6}
                                        className="flex-1 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                                    />
                                    <Button
                                        onClick={handleConfirmVerification}
                                        className="h-auto whitespace-nowrap rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
                                    >
                                        확인
                                    </Button>
                                </div>
                            )}

                            <p className="text-xs text-slate-400 mt-1 pl-1">
                                {isVerified ? "휴대폰 인증이 완료되었습니다." : "본인 확인을 위해 휴대폰 인증이 필요합니다."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">한 줄 소개 <span className="text-slate-400 font-normal">(선택)</span></label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={2}
                                placeholder="자신을 소개하는 한 마디"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900 resize-none"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleComplete}
                        disabled={isSaving || !isVerified}
                        className="w-full h-14 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                    >
                        {isSaving ? "설정 저장 중..." : "시작하기"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
