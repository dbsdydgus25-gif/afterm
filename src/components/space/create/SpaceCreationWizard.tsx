"use client";

import { useState } from "react";
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
    bgFile: File | null;
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
        bgFile: null,
        invites: []
    });

    const updateFormData = (updates: Partial<SpaceFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

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
            let bgUrl = "";

            // Upload files
            if (formData.profileFile) {
                profileUrl = await uploadFile(formData.profileFile, `profiles/${user.id}`);
            }
            if (formData.bgFile) {
                bgUrl = await uploadFile(formData.bgFile, `backgrounds/${user.id}`);
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
                        backgroundImage: bgUrl
                    }
                })
                .select()
                .single();

            if (spaceError) throw spaceError;
            if (!space) throw new Error("공간 생성 실패");

            // 2. Add Host Member (with nickname)
            const { error: memberError } = await supabase
                .from("space_members")
                .insert({
                    space_id: space.id,
                    user_id: user.id,
                    role: 'host',
                    nickname: formData.nickname || 'Host', // Default if empty, but step 2 requires it
                    status: 'active'
                });

            if (memberError) throw memberError;

            // 3. Handle Invitations (Create tokens and save to DB + Send Emails)
            if (formData.invites.length > 0) {
                const invitations = formData.invites.map(email => ({
                    space_id: space.id,
                    inviter_id: user.id,
                    email: email,
                    token: crypto.randomUUID(), // Simple UUID token
                    role: 'viewer',
                }));

                const { error: inviteError } = await supabase
                    .from("invitations")
                    .insert(invitations);

                if (inviteError) {
                    console.error("Invitations error:", inviteError);
                } else {
                    // Send Emails async
                    invitations.forEach(invite => {
                        fetch('/api/email/invite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: invite.email,
                                spaceTitle: formData.title,
                                token: invite.token,
                                inviterName: formData.nickname || "누군가"
                            })
                        }).catch(err => console.error("Email send fail:", err));
                    });
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
