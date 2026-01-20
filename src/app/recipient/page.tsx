"use client";

import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Phone, Heart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecipientPage() {
    const router = useRouter();
    const { message, setMessage, messageId, setMessageId, recipient, setRecipient, user, plan, file: messageFile, setFile } = useMemoryStore();
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
            router.push('/login');
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


            let fileUrl = null;
            let filePath = null;
            let fileSize = 0;
            const textBytes = new Blob([message]).size;

            // 1. Upload File if exists
            if (messageFile) {
                const fileExt = messageFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const path = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('memories')
                    .upload(path, messageFile);

                if (uploadError) throw uploadError;

                // For private buckets, we cannot use publicUrl.
                // We will only store the filePath, and generate Signed URL on demand.
                filePath = path;
                fileUrl = null; // No static public URL
                fileSize = messageFile.size;
            }

            // 2. Insert/Update Message
            if (messageId) {
                // Update existing message
                const { error } = await supabase
                    .from('messages')
                    .update({
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        updated_at: new Date().toISOString(),
                        // Only update file info if a new file was uploaded
                        ...(fileUrl && {
                            file_url: fileUrl,
                            file_path: filePath,
                            file_size: fileSize,
                            file_type: messageFile?.type
                        })
                    })
                    .eq('id', messageId)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                // Insert new message -> Check Limit
                if (plan !== 'pro') {
                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id);

                    if (count !== null && count >= 1) {
                        alert("무료 플랜은 1개의 메시지만 저장할 수 있습니다. 프로 플랜으로 업그레이드 해주세요.");
                        setIsSaving(false);
                        return;
                    }
                }

                // Insert new message
                const { error } = await supabase
                    .from('messages')
                    .insert({
                        user_id: user.id,
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        file_url: fileUrl,
                        file_path: filePath,
                        file_size: fileSize,
                        file_type: messageFile?.type
                    });

                if (error) throw error;
            }

            // 3. Update Storage Usage in Profiles
            // Note: Ideally this should be a DB trigger or RPC to be atomic, 
            // but for now we do it client-side as requested standard approach.
            const totalBytesToAdd = fileSize + textBytes; // Text is small but added for completeness

            // We need to fetch current usage first or increment
            // Supabase RPC 'increment' would be better, but doing simple read-update for MVP
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


            alert("저장되었습니다.");

            // Clear store on success
            setMessage('');
            setMessageId(null);
            setFile(null);
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
