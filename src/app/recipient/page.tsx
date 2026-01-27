"use client";

import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Phone, Heart, ArrowRight, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecipientPage() {
    const router = useRouter();
    const { message, setMessage, messageId, setMessageId, recipient, setRecipient, user, plan, files, setFiles } = useMemoryStore();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: recipient.name,
        phone: recipient.phone,
        relationship: recipient.relationship || "가족",
        agreed: false
    });

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


            let uploadedFiles: { path: string, size: number, type: string }[] = [];
            let legacyFilePath: string | null = null;
            let legacyFileSize = 0;
            let legacyFileType = null;

            let finalMessageId = messageId;
            const textBytes = new Blob([message]).size;

            // 1. Upload All Files
            if (files && files.length > 0) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const path = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('memories')
                        .upload(path, file);

                    if (uploadError) throw uploadError;

                    uploadedFiles.push({
                        path: path,
                        size: file.size,
                        type: file.type
                    });
                }

                // Set Legacy Info (First file)
                if (uploadedFiles.length > 0) {
                    legacyFilePath = uploadedFiles[0].path;
                    legacyFileSize = uploadedFiles[0].size;
                    legacyFileType = uploadedFiles[0].type;
                }
            }

            if (messageId) {
                // Update existing message logic

                // Note: If updating, we should think about existing files. 
                // But this flow seems to be for "New Creation" mostly or "Editing Draft". 
                // If messageId exists here, it means we came back or are editing a draft.
                // Logic: update message info.

                const { data: updatedData, error } = await supabase
                    .from('messages')
                    .update({
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        recipient_email: formData.email,
                        recipient_relationship: formData.relationship,
                        updated_at: new Date().toISOString(),
                        // Only update legacy columns if we have new files. 
                        // If no new files, we keep old ones? 
                        // Actually 'files' store should contain ALL files we want to have effectively.
                        // But usually 'create' flow is fresh. 
                        // If we are editing, we assume 'files' contains what we want.
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
                // Insert new message -> Check Limit
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
                        alert(`[Debug: Plan=${effectivePlan}, DB=${dbProfile?.plan || 'null'}] 무료 플랜은 1개의 메시지만 저장할 수 있습니다.`);
                        setIsSaving(false);
                        return;
                    }
                }

                // Insert new message
                const { data: insertedData, error } = await supabase
                    .from('messages')
                    .insert({
                        user_id: user.id,
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        recipient_email: formData.email,
                        recipient_relationship: formData.relationship,
                        file_url: null,
                        file_path: legacyFilePath, // Backward compatibility
                        file_size: legacyFileSize,
                        file_type: legacyFileType
                    })
                    .select()
                    .single();

                if (error) throw error;
                finalMessageId = insertedData.id;
            }

            // 2. Insert into message_attachments
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

            // 3. Update Storage Usage
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

            if (profileError) console.error("Failed to update storage usage:", profileError);

            // 4. Send SMS Notification
            if (finalMessageId) {
                fetch('/api/sms/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientPhone: formData.phone,
                        recipientName: formData.name,
                        senderName: user.name || "사용자",
                        messageId: finalMessageId
                    })
                }).catch(err => console.error("SMS send background error:", err));
            }

            alert("저장되었습니다.");

            // Clear store
            setMessage('');
            setMessageId(null);
            setFiles([]); // Clear files
            setRecipient({ name: '', phone: '', relationship: '' });

            router.push('/dashboard');
        } catch (error: any) {
            console.error(error);
            alert("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
            <div className="w-full max-w-md space-y-8 animate-fade-in">

                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">
                        누구에게 전할까요?
                    </h1>
                    <p className="text-muted-foreground">
                        당신의 소중한 이야기가 안전하게 전달됩니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-black/5">

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" /> 이름
                            </label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="받으실 분의 성함"
                                className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary" /> 연락처
                            </label>
                            <input
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="010-0000-0000"
                                className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2">
                                <Heart className="w-4 h-4 text-primary" /> 관계
                            </label>
                            <div className="space-y-2">
                                <select
                                    value={['가족', '친구', '연인', '동료'].includes(formData.relationship) ? formData.relationship : '기타'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '기타') {
                                            setFormData({ ...formData, relationship: '' }); // Clear to force user input
                                        } else {
                                            setFormData({ ...formData, relationship: val });
                                        }
                                    }}
                                    className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                                        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring animate-in fade-in slide-in-from-top-2"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="agreed"
                            checked={formData.agreed}
                            onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                            htmlFor="agreed"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                        >
                            알림 수신 및 개인정보 처리에 동의합니다. (필수)
                        </label>
                    </div>

                    <Button
                        type="submit"
                        disabled={!formData.agreed || isSaving}
                        className="w-full h-14 rounded-2xl text-lg gap-2"
                    >
                        {isSaving ? "저장 중..." : "소중한 기억 저장하기"} <ArrowRight className="w-4 h-4" />
                    </Button>

                </form>
            </div>
        </div>
    );
}
