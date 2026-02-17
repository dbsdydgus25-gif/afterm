
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image-utils';

interface Step2Props {
    images: string[];
    setImages: (urls: string[]) => void;
    onNext: () => void;
}

export default function Step2ImageUpload({ images, setImages, onNext }: Step2Props) {
    const supabase = createClient();
    const [isUploading, setIsUploading] = useState(false);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        if (images.length + e.target.files.length > 10) {
            alert('최대 10장까지만 업로드할 수 있습니다.');
            return;
        }

        setIsUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of Array.from(e.target.files)) {
                // Compress image before upload
                const compressedFile = await compressImage(file, 2048, 0.8);

                const fileExt = 'jpg'; // We compress to jpeg
                const fileName = `persona/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('memorial-public')
                    .upload(fileName, compressedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('memorial-public')
                    .getPublicUrl(fileName);

                newUrls.push(publicUrl);
            }
            setImages([...images, ...newUrls]);
        } catch (error) {
            console.error(error);
            alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-xl font-bold">대화 내용을 올려주세요</h2>
                <p className="text-sm text-gray-500">
                    SMS, 카카오톡, 인스타 DM 등 고인과 나누었던<br />
                    직접적인 대화 내용을 캡처해서 올려주세요.<br />
                    <span className="text-indigo-600 font-semibold">(최소 5장 ~ 최대 10장)</span>
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {images.map((url, idx) => (
                    <div key={idx} className="relative aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border">
                        <img
                            src={url}
                            alt={`upload-${idx}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {images.length < 10 && (
                    <label className={`flex flex-col items-center justify-center aspect-[9/16] border-2 border-dashed border-gray-300 rounded-lg transition-colors bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer'}`}>
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                        ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                        )}
                        <span className="text-xs text-gray-500 font-medium text-center">
                            {isUploading ? '압축 중...' : `${images.length}/10`}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                            disabled={isUploading}
                        />
                    </label>
                )}
            </div>

            <Button
                onClick={onNext}
                disabled={images.length < 5 || isUploading}
                className="w-full h-12 text-lg font-bold gap-2 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                다음 단계로
                <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
