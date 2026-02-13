
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface Step1Props {
    name: string;
    setName: (val: string) => void;
    relationship: string;
    setRelationship: (val: string) => void;
    onNext: () => void;
}

export default function Step1BasicInfo({ name, setName, relationship, setRelationship, onNext }: Step1Props) {
    const isNextDisabled = !name.trim() || !relationship.trim();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-xl font-bold">누구와 대화하고 싶으신가요?</h2>
                <p className="text-sm text-gray-500">고인의 성함과 관계를 알려주세요.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">이름 (호칭)</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 우리 엄마, 김철수, 할머니"
                        className="text-lg py-6"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">나와의 관계</label>
                    <Input
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        placeholder="예: 어머니, 가장 친한 친구, 배우자"
                        className="text-lg py-6"
                    />
                </div>
            </div>

            <Button
                onClick={onNext}
                disabled={isNextDisabled}
                className="w-full h-12 text-lg font-bold gap-2 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                다음 단계로
                <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
