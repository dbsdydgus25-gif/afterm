
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Smile, Sparkles, Coffee } from 'lucide-react';

interface Step4Props {
    name: string;
    vibe: string;
    setVibe: (vibe: string) => void;
    onNext: () => void;
}

export default function Step4Vibe({ name, vibe, setVibe, onNext }: Step4Props) {
    const options = [
        {
            id: 'tsundere',
            icon: <Coffee className="w-6 h-6 text-gray-500" />,
            title: "툭툭 던지지만 속 깊은 스타일",
            desc: "단답형, ㅋ/ㅎ 자주 사용, 마침표 없음"
        },
        {
            id: 'playful',
            icon: <Smile className="w-6 h-6 text-yellow-500" />,
            title: "친구처럼 장난치는 스타일",
            desc: "유행어, 이모티콘 많음, 티격태격"
        },
        {
            id: 'caring',
            icon: <Heart className="w-6 h-6 text-pink-500" />,
            title: "다정하게 챙겨주는 스타일",
            desc: "따뜻한 어조, 이모티콘, 부드러운 말투"
        },
        {
            id: 'polite',
            icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
            title: "예의 바르고 정중한 스타일",
            desc: "존댓말 사용, 격식체"
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-xl font-bold">두 분은 어떤 사이였나요?</h2>
                <p className="text-sm text-gray-500">
                    평소 대화 나누던 온도를 알려주시면<br />
                    AI가 그 느낌을 최대한 살려볼게요.
                </p>
            </div>

            <div className="space-y-3">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setVibe(opt.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${vibe === opt.id
                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 shadow-md'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`p-3 rounded-full ${vibe === opt.id ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                            {opt.icon}
                        </div>
                        <div>
                            <div className={`font-bold ${vibe === opt.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                {opt.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {opt.desc}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <Button
                onClick={onNext}
                disabled={!vibe}
                className="w-full h-12 text-lg font-bold gap-2 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                다음 단계로
                <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
