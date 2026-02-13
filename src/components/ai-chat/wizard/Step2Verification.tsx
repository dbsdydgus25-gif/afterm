
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Wand2, MessageSquare, RefreshCcw, Image as ImageIcon, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SecureAvatar } from '@/components/ui/SecureAvatar';

interface Step2Props {
    name: string;
    relationship: string;
    onNext: (personaId: string, summary: string) => void;
}

export default function Step2Verification({ name, relationship, onNext }: Step2Props) {
    // Analysis State
    const [personality, setPersonality] = useState("");
    const [tone, setTone] = useState(""); // Not used in UI much but kept for API
    const [images, setImages] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");

    // Verification Chat State
    const [personaId, setPersonaId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatContainerRef = useRef<any>(null);

    const supabase = createClient();

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (!personality.trim() && images.length === 0) {
            alert("성격 묘사나 카톡 캡처 중 하나는 필수입니다.");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError("");

        try {
            // 1. Upload Images
            const imageUrls: string[] = [];
            if (images.length > 0) {
                for (const file of images) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `persona-source/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('memorial-public')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('memorial-public')
                        .getPublicUrl(filePath);

                    imageUrls.push(publicUrl);
                }
            }

            // 2. Create Persona
            const res = await fetch('/api/ai-chat/create-persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    relationship,
                    personality,
                    tone: "평소 말투", // Default
                    imageUrls
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "분석 실패");
            }

            const data = await res.json();
            setPersonaId(data.personaId);

            // Initial greeting from AI (Simulated)
            setChatMessages([
                { role: 'assistant', content: `${relationship}, 나야. 잘 지냈어?` }
            ]);

        } catch (error: any) {
            console.error(error);
            setAnalysisError(error.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputMessage.trim() || isSending || !personaId) return;

        const userMsg = inputMessage;
        setInputMessage("");
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsSending(true);

        try {
            const res = await fetch('/api/ai-chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personaId,
                    message: userMsg
                })
            });

            if (!res.ok) throw new Error("전송 실패");

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader");

            let aiContent = "";
            setChatMessages(prev => [...prev, { role: 'assistant', content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = new TextDecoder().decode(value);
                aiContent += text;

                setChatMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = aiContent;
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setChatMessages(prev => [...prev, { role: 'system', content: "대화 전송 실패. 다시 시도해주세요." }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleRetry = () => {
        if (confirm("현재 분석된 페르소나를 버리고 다시 설정하시겠습니까?")) {
            setPersonaId(null);
            setChatMessages([]);
            // Keep inputs for easy modification
        }
    };

    const handleConfirm = () => {
        if (personaId) {
            onNext(personaId, "Verified");
        }
    };

    if (personaId) {
        // Verification Chat View
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[600px] flex flex-col">
                <div className="text-center space-y-1 mb-2">
                    <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        말투 확인하기
                    </h2>
                    <p className="text-sm text-gray-500">생성된 AI와 대화해보세요. 마음에 들지 않으면 다시 분석할 수 있습니다.</p>
                </div>

                {/* Chat Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto bg-slate-50 border rounded-xl p-4 space-y-4 shadow-inner"
                >
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : msg.role === 'system'
                                        ? 'bg-red-100 text-red-600 text-xs text-center w-full'
                                        : 'bg-white border shadow-sm text-gray-800 rounded-tl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex justify-start">
                            <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="말을 걸어보세요..."
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit" size="icon" disabled={isSending || !inputMessage.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={handleRetry} className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        다시 분석하기
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                        이대로 사용하기
                    </Button>
                </div>
            </div>
        );
    }

    // Analysis Input View
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    성격 및 말투 분석
                </h2>
                <p className="text-sm text-gray-500">
                    평소 나누던 카톡 대화 내용을 올려주시면,<br />
                    AI가 그 말투와 성격을 그대로 학습합니다.
                </p>
            </div>

            <div className="space-y-5">
                {/* 1. Personality Text */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">어떤 성격이었나요?</label>
                    <Textarea
                        value={personality}
                        onChange={(e) => setPersonality(e.target.value)}
                        placeholder="예: 장난기가 많고 츤데레 같은 성격이야. 맞춤법을 자주 틀리고 'ㅋㅋ'를 많이 써."
                        className="resize-none min-h-[100px]"
                    />
                </div>

                {/* 2. Image Upload */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">카톡 대화 캡처 (선택, 권장)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {images.map((file, idx) => (
                            <div key={idx} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="upload"
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
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-colors">
                            <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 font-medium">추가하기</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                </div>

                {analysisError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <X className="w-4 h-4" />
                        {analysisError}
                    </div>
                )}
            </div>

            <Button
                onClick={handleAnalyze}
                className="w-full h-12 text-lg font-bold gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isAnalyzing}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        분석 중입니다...
                    </>
                ) : (
                    <>
                        <Wand2 className="w-5 h-5" />
                        분석 시작하기
                    </>
                )}
            </Button>
        </div>
    );
}
