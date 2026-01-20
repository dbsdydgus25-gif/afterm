"use client";

import { useMemoryStore } from "@/store/useMemoryStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Phone, Heart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecipientPage() {
    const router = useRouter();
    const { message, messageId, setMessageId, recipient, setRecipient, user } = useMemoryStore();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: recipient.name,
        phone: recipient.phone,
        relationship: recipient.relationship || "family",
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

            if (messageId) {
                // Update existing message
                const { error } = await supabase
                    .from('messages')
                    .update({
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', messageId)
                    .eq('user_id', user.id); // Security check

                if (error) throw error;
            } else {
                // Insert new message
                const { error } = await supabase
                    .from('messages')
                    .insert({
                        user_id: user.id,
                        content: message,
                        recipient_name: formData.name,
                        recipient_phone: formData.phone
                    });

                if (error) throw error;
            }

            // Clear the ID after save so next time it's a new message (unless we want to stay in edit mode?)
            // Usually simpler to clear it.
            setMessageId(null);

            alert("소중한 기억이 안전하게 저장되었습니다.");
            router.push("/dashboard");
        } catch (e) {
            console.error(e);
            alert("저장 중 오류가 발생했습니다.");
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
                            <select
                                value={formData.relationship}
                                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="family">가족</option>
                                <option value="friend">친구</option>
                                <option value="lover">연인</option>
                                <option value="colleague">동료</option>
                                <option value="other">기타</option>
                            </select>
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
