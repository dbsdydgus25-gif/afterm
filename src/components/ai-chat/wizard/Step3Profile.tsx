
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Step3Props {
    personaId: string;
    name: string;
    onComplete: () => void;
}

export default function Step3Profile({ personaId, name, onComplete }: Step3Props) {
    const router = useRouter();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleFinish = async (skip: boolean = false) => {
        try {
            setIsSubmitting(true);

            if (!skip && avatarFile) {
                const formData = new FormData();
                formData.append('id', personaId);
                formData.append('avatar', avatarFile);

                const res = await fetch('/api/ai-chat/update-persona', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Failed to update profile');
            }

            // Finish and redirect or callback
            // router.push(`/ai-chat/${personaId}`);
            // Let the parent handle the redirect
            onComplete();

        } catch (error) {
            console.error(error);
            alert('프로필 설정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-xl font-bold">프로필 사진을 설정해주세요</h2>
                <p className="text-sm text-gray-500">대화할 때 보여질 사진입니다. (건너뛸 수 있습니다)</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 py-8">
                <div className="relative group cursor-pointer">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                        <AvatarImage src={previewUrl || undefined} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-indigo-50 text-indigo-300">
                            {name[0]}
                        </AvatarFallback>
                    </Avatar>

                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-8 h-8" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                <p className="text-xs text-gray-400">클릭하여 사진 업로드</p>
            </div>

            <div className="space-y-3">
                <Button
                    onClick={() => handleFinish(false)}
                    disabled={isSubmitting}
                    className="w-full h-12 text-lg font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    완료하고 대화 시작하기
                </Button>

                <Button
                    onClick={() => handleFinish(true)}
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                >
                    건너뛰기
                </Button>
            </div>
        </div>
    );
}
