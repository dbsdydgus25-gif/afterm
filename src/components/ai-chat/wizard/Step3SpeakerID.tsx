
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface Step3Props {
    name: string;
    speakerSide: 'left' | 'right' | null;
    setSpeakerSide: (side: 'left' | 'right') => void;
    previewImage: string | null;
    onNext: () => void;
}

export default function Step3SpeakerID({ name, speakerSide, setSpeakerSide, previewImage, onNext }: Step3Props) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-xl font-bold">{name}님은 어느 쪽인가요?</h2>
                <p className="text-sm text-gray-500">
                    AI가 대화의 주인공을 정확히 파악할 수 있도록<br />
                    말풍선 위치를 알려주세요.
                </p>
            </div>

            {/* Preview Area */}
            <div className="relative w-full aspect-[9/16] max-h-[400px] bg-slate-100 rounded-xl overflow-hidden border mx-auto shadow-inner">
                {previewImage ? (
                    <>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-50 blur-sm"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-8 p-4">
                            {/* Left Button */}
                            <button
                                onClick={() => setSpeakerSide('left')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all transform hover:scale-105 ${speakerSide === 'left'
                                        ? 'bg-white ring-4 ring-indigo-500 shadow-xl scale-110 z-10'
                                        : 'bg-white/80 hover:bg-white shadow-md grayscale hover:grayscale-0'
                                    }`}
                            >
                                <div className="w-12 h-10 bg-white border rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-gray-400" />
                                </div>
                                <span className="font-bold text-sm text-gray-800">상대방 (왼쪽)</span>
                                {speakerSide === 'left' && <div className="text-xs text-indigo-600 font-bold">선택됨</div>}
                            </button>

                            {/* Right Button */}
                            <button
                                onClick={() => setSpeakerSide('right')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all transform hover:scale-105 ${speakerSide === 'right'
                                        ? 'bg-yellow-100 ring-4 ring-amber-400 shadow-xl scale-110 z-10'
                                        : 'bg-white/80 hover:bg-yellow-50 shadow-md grayscale hover:grayscale-0'
                                    }`}
                            >
                                <div className="w-12 h-10 bg-amber-100 rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-sm flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-amber-700" />
                                </div>
                                <span className="font-bold text-sm text-gray-800">본인 (오른쪽)</span>
                                {speakerSide === 'right' && <div className="text-xs text-amber-600 font-bold">선택됨</div>}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">이미지가 없습니다</div>
                )}
            </div>

            <Button
                onClick={onNext}
                disabled={!speakerSide}
                className="w-full h-12 text-lg font-bold gap-2 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                다음 단계로
                <ArrowRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
