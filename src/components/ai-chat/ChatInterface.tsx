'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface Message {
    id: string;
    sender: 'user' | 'ai';
    content: string;
    created_at: string;
}

interface ChatInterfaceProps {
    memorialId?: string; // Optional for standalone mode
    personaId: string;
    initialMessages: Message[];
    personaName: string;
}

export default function ChatInterface({
    memorialId,
    personaId,
    initialMessages,
    personaName,
}: ChatInterfaceProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const userContent = inputValue.trim();
        setInputValue('');

        // Optimistic Update
        const tempUserMsg: Message = {
            id: `temp-${Date.now()}`,
            sender: 'user',
            content: userContent,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);
        setLoading(true);

        try {
            const response = await fetch('/api/ai-chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personaId,
                    content: userContent,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            // Add AI response
            const aiMsg: Message = {
                id: data.aiMessageId,
                sender: 'ai',
                content: data.aiContent,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat Error:', error);
            alert('메시지 전송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#bacee0]">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md px-4 py-3 flex items-center shadow-sm z-10 sticky top-0 border-b border-gray-200">
                <button
                    onClick={() => router.back()}
                    className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div>
                    <h1 className="font-bold text-lg text-gray-900 leading-tight">{personaName}</h1>
                    <p className="text-xs text-gray-500">AI 추모 채팅</p>
                </div>
            </div>

            {/* Message Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full",
                                isUser ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={cn(
                                "max-w-[70%] px-4 py-2 rounded-xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words",
                                isUser
                                    ? "bg-blue-500 text-white rounded-tr-none"
                                    : "bg-white text-gray-900 rounded-tl-none"
                            )}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-500 self-end mx-1 mb-1 min-w-[30px]">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex justify-start w-full">
                        <div className="bg-white px-4 py-3 rounded-xl rounded-tl-none shadow-sm flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 safe-area-bottom border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 rounded-full bg-gray-100 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 w-10 h-10 shrink-0"
                        disabled={!inputValue.trim() || loading}
                    >
                        <Send className="w-5 h-5 text-white" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
