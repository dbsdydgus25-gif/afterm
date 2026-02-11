"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Step1Identity } from "./Step1Identity";
import { Step2Persona } from "./Step2Persona";
import { Step3Invite } from "./Step3Invite";
import { Database } from "@/types/supabase";

export type SpaceFormData = {
    title: string;
    description: string;
    nickname: string;
    profileFile: File | null;
    invites: string[]; // Email list
};

export function SpaceCreationWizard() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<SpaceFormData>({
        title: "",
        description: "",
        nickname: "",
        profileFile: null,
        invites: []
    });

    const updateFormData = (updates: Partial<SpaceFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    // Pre-fill nickname

    useEffect(() => {
        const initUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !formData.nickname) {
                const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
                if (name) setFormData(prev => ({ ...prev, nickname: name }));
            }
        };
        initUser();
    }, []);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('memorial-public')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('memorial-public')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            let profileUrl = "";
            const bgUrl = "";

            // Upload files
            if (formData.profileFile) {
                profileUrl = await uploadFile(formData.profileFile, `profiles/${user.id}`);
            }

            // 1. Create Memorial Space
            const { data: space, error: spaceError } = await supabase
                .from("memorial_spaces")
                .insert({
                    owner_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    is_public: false, // Default private
                    theme: {
                        color: 'blue',
                        profileImage: profileUrl,
                        backgroundImage: "" // Default empty, set later
                    }
                })
                .select()
                .single();

            if (spaceError) {
                alert(`공간 생성 실패: ${spaceError.message}`);
                throw spaceError;
            }
            if (!space) throw new Error("공간 생성 실패");

            // Determine nickname (from formData or user metadata)
            const userNickname = formData.nickname || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Host';

            // 2. Add Host Member (with nickname)
            const { error: memberError } = await supabase
                .from("space_members")
                .insert({
                    space_id: space.id,
                    user_id: user.id,
                    role: 'host',
                    nickname: userNickname,
                    status: 'active'
                });

            if (memberError) {
                alert(`멤버 추가 실패: ${memberError.message}`);
                throw memberError;
            }

            // 3. Handle Invitations (Create tokens and save to DB + Send Emails)
            if (formData.invites.length > 0) {
                const invitations = formData.invites.map(email => {
                    const token = crypto.randomUUID();
                    return {
                        space_id: space.id,
                        inviter_id: user.id,
                        email: email,
                        token: token,
                        code: token, // Satisfy DB constraint
                        role: 'viewer',
                    };
                });

                const { error: inviteError } = await supabase
                    .from("invitations")
                    .insert(invitations);

                if (inviteError) {
                    console.error("Invitations error:", inviteError);
                    alert(`초대장 저장 실패: ${inviteError.message}`);
                    // We continue even if DB save fails? No, if DB save fails, we shouldn't send emails ideally.
                    // But for now, let's just alert.
                } else {
                    // Send Emails async (Wait for them to prevent cancellation)
                    let successCount = 0;
                    let failCount = 0;

                    await Promise.all(invitations.map(invite =>
                        fetch('/api/email/invite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: invite.email,
                                spaceTitle: formData.title,
                                token: invite.token,
                                inviterName: userNickname
                            })
                        }).then(async res => {
                            if (!res.ok) {
                                const errData = await res.json().catch(() => ({}));
                                throw new Error(errData.error || `Status ${res.status}`);
                            }
                            successCount++;
                        }).catch(err => {
                            console.error("Email send fail:", err);
                            failCount++;
                        })
                    ));

                    if (failCount > 0) {
                        alert(`${successCount}건 발송 성공, ${failCount}건 발송 실패.\n(실패 원인: 서버 로그 확인 필요)`);
                    } else {
                        // Optional: alert("모든 초대장이 발송되었습니다.");
                    }
                }
            }


            // Redirect
            router.push(`/space/${space.id}`);
            router.refresh();

        } catch (error) {
            console.error("Error creating space:", error);
            alert("공간 생성 중 오류가 발생했습니다. (콘솔 확인)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-8 px-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {s}
                        </div>
                        {s < 3 && (
                            <div className={`w-16 h-0.5 mx-2 ${step > s ? 'bg-slate-900' : 'bg-slate-100'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Steps */}
            {step === 1 && (
                <Step1Identity
                    data={formData}
                    updateData={updateFormData}
                    onNext={nextStep}
                />
            )}
            {step === 2 && (
                <Step2Persona
                    data={formData}
                    updateData={updateFormData}
                    onNext={nextStep}
                    onBack={prevStep}
                />
            )}
            {step === 3 && (
                <Step3Invite
                    data={formData}
                    updateData={updateFormData}
                    onSubmit={handleComplete}
                    onBack={prevStep}
                    loading={loading}
                />
            )}
        </div>
    );
}
