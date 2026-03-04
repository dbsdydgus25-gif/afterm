"use client";

// ============================================================
// 수신인 지정 페이지 (recipient/page.tsx)
// 변경사항: 메시지 저장 시 즉시 SMS 발송 로직 제거
// 메시지는 가디언즈 인증(사망진단서 + API 키) 이후에만 수신인에게 전달됩니다.
// ============================================================

import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Phone, Heart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecipientPage() {
    const router = useRouter();
    const { message, setMessage, messageId, setMessageId, recipient, setRecipient, user, plan, files, setFiles } = useMemoryStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: recipient.name,
        phone: recipient.phone,
        relationship: recipient.relationship || "가족",
        agreed: false
    });

    // 전화번호 형식 자동 변환 (010-XXXX-XXXX)
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 7) {
            value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
        } else if (value.length > 3) {
            value = `${value.slice(0, 3)}-${value.slice(3)}`;
        }

        setFormData(prev => ({ ...prev, phone: value }));
    };

    // 메시지 저장 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreed) return;

        if (!user) {
            alert("로그인이 필요한 서비스입니다.");
            router.push('/login?returnTo=/recipient');
            return;
        }

        setIsSaving(true);
        try {
            setRecipient({
                name: formData.name,
                phone: formData.phone,
                relationship: formData.relationship
            });

            const supabase = createClient();
            const uploadedFiles: { path: string, size: number, type: string }[] = [];
            let legacyFilePath: string | null = null;
            let legacyFileSize = 0;
            let legacyFileType = null;
            let finalMessageId = messageId;
            const textBytes = new Blob([message]).size;

            // 1. 첨부 파일 업로드 처리
            if (files && files.length > 0) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const path = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('memories')
                        .upload(path, file);

                    if (uploadError) throw uploadError;

                    uploadedFiles.push({ path, size: file.size, type: file.type });
                }

                if (uploadedFiles.length > 0) {
                    legacyFilePath = uploadedFiles[0].path;
                    legacyFileSize = uploadedFiles[0].size;
                    legacyFileType = uploadedFiles[0].type;
                }
            }

            if (messageId) {
                // 기존 메시지 수정 로직
                const { data: updatedData, error } = await supabase
                    .from('messages')
                    .update({
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        recipient_relationship: formData.relationship,
                        updated_at: new Date().toISOString(),
                        ...(legacyFilePath && {
                            file_url: null,
                            file_path: legacyFilePath,
                            file_size: legacyFileSize,
                            file_type: legacyFileType
                        })
                    })
                    .eq('id', messageId)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) throw error;
                finalMessageId = updatedData.id;
            } else {
                // 새 메시지 저장 전 한도 체크
                const { data: dbProfile } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', user.id)
                    .single();

                const effectivePlan = (dbProfile?.plan || plan || 'free').toLowerCase();

                if (effectivePlan !== 'pro') {
                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id);

                    if (count !== null && count >= 1) {
                        alert(`무료 플랜은 1개의 메시지만 저장할 수 있습니다.`);
                        setIsSaving(false);
                        return;
                    }
                }

                // 새 메시지 INSERT (status는 'locked' - 가디언즈 오픈 전까지 잠금)
                const { data: insertedData, error } = await supabase
                    .from('messages')
                    .insert({
                        user_id: user.id,
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        recipient_relationship: formData.relationship,
                        file_url: null,
                        file_path: legacyFilePath,
                        file_size: legacyFileSize,
                        file_type: legacyFileType,
                        // status 필드가 존재하면 'locked'로 저장 (가디언즈 오픈 전 잠금)
                        status: 'locked'
                    })
                    .select()
                    .single();

                if (error) throw error;
                finalMessageId = insertedData.id;
            }

            // 2. 첨부 파일 attachments 테이블에 저장
            if (uploadedFiles.length > 0 && finalMessageId) {
                const attachmentsData = uploadedFiles.map(f => ({
                    message_id: finalMessageId,
                    file_path: f.path,
                    file_size: f.size,
                    file_type: f.type
                }));

                const { error: attachError } = await supabase
                    .from('message_attachments')
                    .insert(attachmentsData);

                if (attachError) throw attachError;
            }

            // 3. 스토리지 용량 업데이트
            const totalFilesSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
            const totalBytesToAdd = totalFilesSize + textBytes;

            const { data: profile } = await supabase
                .from('profiles')
                .select('storage_used')
                .eq('id', user.id)
                .single();

            const currentUsage = profile?.storage_used || 0;

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    storage_used: currentUsage + totalBytesToAdd,
                    updated_at: new Date().toISOString()
                });

            if (profileError) console.error("스토리지 용량 업데이트 실패:", profileError);

            // ✅ [변경 포인트] 즉시 SMS 발송 로직 완전 제거
            // 이제 메시지는 가디언즈가 사망진단서와 API 키로 인증을 완료한 이후에만
            // 수신인에게 SMS 전달이 이루어집니다. (verify-open API에서 처리)
            alert("메시지가 안전하게 보관되었습니다.\n가디언즈 인증 후 수신인에게 전달됩니다.");

            // 스토어 초기화
            setMessage('');
            setMessageId(null);
            setFiles([]);
            setRecipient({ name: '', phone: '', relationship: '' });

            router.push('/dashboard');
        } catch (error: unknown) {
            console.error(error);
            alert("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">

                <div className="space-y-1 text-center">
                    <h1 className="text-xl font-bold tracking-tight">
                        누구에게 전할까요?
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        저장된 메시지는 가디언즈 인증 후 수신인에게 전달됩니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5">

                    <div className="space-y-3">
                        {/* 이름 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-500" /> 이름
                            </label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="받으실 분의 성함"
                                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                            />
                        </div>

                        {/* 연락처 입력 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold leading-none flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-500" /> 연락처
                            </label>
                            <input
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="010-0000-0000"
                                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                            />
                        </div>

                        {/* 관계 선택 */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold leading-none flex items-center gap-1.5">
                                <Heart className="w-3.5 h-3.5 text-slate-500" /> 관계
                            </label>
                            <div className="space-y-2">
                                <select
                                    value={['가족', '친구', '연인', '동료'].includes(formData.relationship) ? formData.relationship : '기타'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '기타') {
                                            setFormData({ ...formData, relationship: '' });
                                        } else {
                                            setFormData({ ...formData, relationship: val });
                                        }
                                    }}
                                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                                >
                                    <option value="가족">가족</option>
                                    <option value="친구">친구</option>
                                    <option value="연인">연인</option>
                                    <option value="동료">동료</option>
                                    <option value="기타">기타 (직접 입력)</option>
                                </select>

                                {(!['가족', '친구', '연인', '동료'].includes(formData.relationship)) && (
                                    <input
                                        type="text"
                                        value={formData.relationship}
                                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                        placeholder="직접 입력 (예: 이웃, 선생님)"
                                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black animate-in fade-in slide-in-from-top-2"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 동의 체크박스 */}
                    <div className="flex items-center space-x-2 pt-1">
                        <input
                            type="checkbox"
                            id="agreed"
                            checked={formData.agreed}
                            onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <label
                            htmlFor="agreed"
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-500"
                        >
                            알림 수신 및 개인정보 처리에 동의합니다. (필수)
                        </label>
                    </div>

                    {/* 저장 버튼 */}
                    <Button
                        type="submit"
                        disabled={!formData.agreed || isSaving}
                        className="w-full h-12 rounded-xl text-sm font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                    >
                        {isSaving ? "저장 중..." : "소중한 기억 저장하기"} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>

                </form>
            </div>
        </div>
    );
}
