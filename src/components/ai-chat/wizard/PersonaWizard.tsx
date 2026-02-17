'use client';

import React, { useState } from 'react';
import Step1BasicInfo from './Step1BasicInfo';
import Step2ImageUpload from './Step2ImageUpload';
import Step3SpeakerID from './Step3SpeakerID';
import Step4Vibe from './Step4Vibe';
import Step5Anchors from './Step5Anchors';
import Step6Loading from './Step6Loading';
import Step7Profile from './Step3Profile'; // Reusing previous Step3 as Step7
import { useRouter } from 'next/navigation';

export default function PersonaWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Form State
    const [name, setName] = useState("");
    const [relationship, setRelationship] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [deathDate, setDeathDate] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [speakerSide, setSpeakerSide] = useState<'left' | 'right' | null>(null);
    const [vibe, setVibe] = useState("");
    const [anchors, setAnchors] = useState({ appellation: "", opener: "" });

    const [personaId, setPersonaId] = useState<string | null>(null);

    const nextStep = () => setStep(prev => prev + 1);

    // API Call (Triggered in Step 6)
    const handleCreatePersona = async () => {
        try {
            const res = await fetch('/api/ai-chat/create-persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    relationship,
                    birthDate,
                    deathDate,
                    imageUrls: images,
                    speakerSide,
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "생성 실패");
            }

            const data = await res.json();
            setPersonaId(data.personaId);
            // Step 6 handles the transition to Step 7 on completion
        } catch (error) {
            console.error(error);
            throw error; // Step 6 catches this
        }
    };

    const handleFinalComplete = () => {
        if (personaId) {
            router.push(`/ai-chat/${personaId}`);
        }
    };

    return (
        <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 min-h-[600px] flex flex-col">
            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 flex w-full">
                <div
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 5) * 100}%` }}
                />
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                {step === 1 && (
                    <Step1BasicInfo
                        name={name}
                        setName={setName}
                        relationship={relationship}
                        setRelationship={setRelationship}
                        birthDate={birthDate}
                        setBirthDate={setBirthDate}
                        deathDate={deathDate}
                        setDeathDate={setDeathDate}
                        onNext={nextStep}
                    />
                )}

                {step === 2 && (
                    <Step2ImageUpload
                        images={images}
                        setImages={setImages}
                        onNext={nextStep}
                    />
                )}

                {step === 3 && (
                    <Step3SpeakerID
                        name={name}
                        speakerSide={speakerSide}
                        setSpeakerSide={setSpeakerSide}
                        previewImage={images.length > 0 ? images[0] : null}
                        onNext={nextStep} // Simply go to next step (Loading)
                    />
                )}

                {/* Steps 4 and 5 are removed for realism overhaul */}

                {step === 4 && (
                    <Step6Loading
                        name={name}
                        createPersona={handleCreatePersona}
                        onComplete={nextStep}
                        onError={(msg) => alert(msg)}
                    />
                )}

                {step === 5 && personaId && (
                    <Step7Profile
                        personaId={personaId}
                        name={name}
                        onComplete={handleFinalComplete}
                    />
                )}
            </div>
        </div>
    );
}
