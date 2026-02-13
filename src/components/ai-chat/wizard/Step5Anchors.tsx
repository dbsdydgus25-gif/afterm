
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface Step5Props {
    name: string;
    anchors: { appellation: string; opener: string };
    setAnchors: (val: { appellation: string; opener: string }) => void;
    onNext: () => void;
}

export default function Step5Anchors({ name, anchors, setAnchors, onNext }: Step5Props) {
    const handleChange = (key: keyof typeof anchors, value: string) => {
        setAnchors({ ...anchors, [key]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-xl font-bold">마지막으로, 기억의 조각을<br />더해볼까요?</h2>
                <p className="text-sm text-gray-500">
                    건너뛰어도 괜찮지만, 알려주시면<br />
                    더 실감나는 대화가 가능해요.
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        {name}님이 나를 부르던 호칭
                    </label>
                    <Input
                        value={anchors.appellation}
                        onChange={(e) => handleChange('appellation', e.target.value)}
                        placeholder="예: 우리 딸, 야, 00아, 김대리"
                        className="py-6 text-lg"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        대화할 때 자주 쓰던 첫 마디
                    </label>
                    <Input
                        value={anchors.opener}
                        onChange={(e) => handleChange('opener', e.target.value)}
                        placeholder="예: 밥 먹었어?, 뭐해?, 어디야?"
                        className="py-6 text-lg"
                    />
                </div>
            </div>

            <div className="space-y-3 mt-8">
                <Button
                    onClick={onNext}
                    className="w-full h-12 text-lg font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                >
                    <MessageCircle className="w-5 h-5" />
                    대화방 생성하기
                </Button>

                <Button
                    variant="ghost"
                    onClick={onNext}
                    className="w-full text-gray-400 font-medium"
                >
                    건너뛰기
                </Button>
            </div>
        </div>
    );
}
