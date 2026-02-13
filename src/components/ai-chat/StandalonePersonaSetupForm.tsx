'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid'; // Removed to avoid dependency

const uuidv4 = () => crypto.randomUUID();

/**
 * AI 페르소나 생성 폼 (독립 실행형)
 * - Memorial ID 없이 페르소나를 생성합니다.
 */
export default function StandalonePersonaSetupForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [tone, setTone] = useState('');
    const [personality, setPersonality] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    // 이미지 압축 함수
    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 최대 너비 설정 (예: 1024px)
                    const MAX_WIDTH = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const newFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(newFile);
                            } else {
                                reject(new Error('Canvas to Blob failed'));
                            }
                        },
                        'image/jpeg',
                        0.7 // 압축 품질 (0~1)
                    );
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // 파일 선택 핸들러
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            // 압축 진행
            const compressedFiles = await Promise.all(
                selectedFiles.map((file) => compressImage(file))
            );

            setFiles((prev) => [...prev, ...compressedFiles]);

            // 미리보기 생성
            const newPreviews = compressedFiles.map((file) => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    // 선택된 파일 제거
    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !relationship || !tone || !personality || files.length === 0) {
            alert('모든 정보를 입력하고 최소 1개의 스크린샷을 업로드해주세요.');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            // ... (skip lines)
            // 2. API 호출 (페르소나 생성 및 분석 요청)
            const response = await fetch('/api/ai-chat/create-persona', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // memorialId 생략
                    name,
                    relationship, // 추가됨
                    tone,
                    personality,
                    imageUrls: uploadedFileUrls,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '페르소나 생성 실패');
            }

            const data = await response.json();

            alert('페르소나가 성공적으로 생성되었습니다!');
            // 생성된 페르소나 채팅 페이지로 이동
            router.push(`/ai-chat/${data.personaId}`);
        } catch (error: any) {
            console.error('Error creating persona:', error);
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">이름</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">나와의 관계</label>
                <Input
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="예: 엄마, 아빠, 가장 친한 친구"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">말투 설명</label>
                <Textarea
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="예: 다정하고 따뜻한 말투, 가끔 사투리를 쓰심, 존댓말을 주로 사용함"
                    required
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">성격 묘사</label>
                <Textarea
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="예: 책임감이 강하고 가족을 끔찍이 아끼심. 유머 감각이 뛰어나 분위기 메이커였음."
                    required
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    카카오톡 대화 스크린샷 (최소 5장 권장)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                        <Upload className="w-8 h-8" />
                        <p className="text-sm">클릭하여 이미지 업로드</p>
                        <p className="text-xs text-gray-400">JPG, PNG 파일 지원</p>
                    </div>
                </div>

                {/* 이미지 미리보기 */}
                {previews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
                        {previews.map((src, index) => (
                            <div key={index} className="relative aspect-[9/16] rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={src} alt={`preview-${index}`} className="object-cover w-full h-full" />
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-semibold rounded-xl"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        AI 분석 중... (최대 1분 소요)
                    </>
                ) : (
                    'AI 페르소나 생성하기'
                )}
            </Button>
            <p className="text-center text-xs text-gray-400 mt-2">
                * 분석에는 약 30~60초가 소요될 수 있습니다. 창을 닫지 말고 기다려주세요.
            </p>
        </form>
    );
}
