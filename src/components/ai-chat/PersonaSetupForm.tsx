'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';

interface PersonaSetupFormProps {
    memorialId: string;
}

/**
 * AI 페르소나 생성 폼 컴포넌트
 * - 고인의 이름, 말투, 성격 입력
 * - 카카오톡 스크린샷 업로드 (최소 5장 권장)
 * - 제출 시 API를 호출하여 페르소나 생성 및 분석 시작
 */
export default function PersonaSetupForm({ memorialId }: PersonaSetupFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [tone, setTone] = useState('');
    const [personality, setPersonality] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    // 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);

            // 미리보기 생성
            const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
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
        if (!name || !tone || !personality || files.length === 0) {
            alert('모든 정보를 입력하고 최소 1개의 스크린샷을 업로드해주세요.');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const uploadedFileUrls: string[] = [];

            // 1. 파일 업로드 (Supabase Storage)
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `persona-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${memorialId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('memorial-data') // 'memorial-data' 버킷이 필요함
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Public URL 가져오기
                const { data: { publicUrl } } = supabase.storage
                    .from('memorial-data')
                    .getPublicUrl(filePath);

                uploadedFileUrls.push(publicUrl);
            }

            // 2. API 호출 (페르소나 생성 및 분석 요청)
            const response = await fetch('/api/ai-chat/create-persona', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    memorialId,
                    name,
                    tone,
                    personality,
                    imageUrls: uploadedFileUrls,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '페르소나 생성 실패');
            }

            alert('페르소나가 성공적으로 생성되었습니다!');
            router.push(`/space/${memorialId}/ai-chat`); // 채팅 페이지로 이동
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
                <label className="text-sm font-medium text-gray-700">고인의 이름</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동"
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
                <p className="text-xs text-gray-500">
                    AI가 고인의 말투를 흉내낼 때 참고할 핵심 특징을 적어주세요.
                </p>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold rounded-xl"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        AI가 고인의 데이터를 분석 중입니다...
                    </>
                ) : (
                    'AI 페르소나 생성하기'
                )}
            </Button>
        </form>
    );
}
