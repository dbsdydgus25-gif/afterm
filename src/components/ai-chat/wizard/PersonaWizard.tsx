
'use client';

import React, { useState } from 'react';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Verification from './Step2Verification';
import Step3Profile from './Step3Profile';
import { useRouter } from 'next/navigation';

export default function PersonaWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [relationship, setRelationship] = useState("");
    const [personaId, setPersonaId] = useState<string | null>(null);

    const handleStep1Next = () => setStep(2);

    const handleStep2Next = (createdPersonaId: string, summary: string) => {
        setPersonaId(createdPersonaId);
        setStep(3);
    };

    const handleStep3Complete = () => {
        if (personaId) {
            router.push(`/ai-chat/${personaId}`);
        }
    };

    return (
        <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 flex">
                <div className={`h-full bg-indigo-500 transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
            </div>

            <div className="p-6 md:p-8">
                {step === 1 && (
                    <Step1BasicInfo
                        name={name}
                        setName={setName}
                        relationship={relationship}
                        setRelationship={setRelationship}
                        onNext={handleStep1Next}
                    />
                )}

                {step === 2 && (
                    <Step2Verification
                        name={name}
                        relationship={relationship}
                        onNext={handleStep2Next}
                    />
                )}

                {step === 3 && (
                    <Step3Profile
                        personaId={personaId!}
                        name={name}
                        onComplete={handleStep3Complete}
                    />
                )}
            </div>
        </div>
    );
}
