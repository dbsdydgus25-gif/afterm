'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Persona {
    id: string;
    name: string;
    created_at: string;
}

interface ChatSidebarProps {
    personas: Persona[];
}

export default function ChatSidebar({ personas }: ChatSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        AI 추모 채팅
                    </h2>
                </div>

                <Link href="/ai-chat/setup">
                    <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <PlusCircle className="w-4 h-4" />
                        새 채팅 만들기
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {personas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        생성된 대화가 없습니다.<br />
                        새로운 채팅을 시작해보세요.
                    </div>
                ) : (
                    personas.map((persona) => {
                        const isActive = pathname.startsWith(`/ai-chat/${persona.id}`);
                        return (
                            <Link
                                key={persona.id}
                                href={`/ai-chat/${persona.id}`}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-white shadow-sm border border-indigo-100 text-indigo-900"
                                        : "hover:bg-white hover:shadow-sm text-gray-700"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border",
                                    isActive ? "bg-indigo-50 border-indigo-100" : "bg-white border-gray-200"
                                )}>
                                    👤
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">
                                        {persona.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        {new Date(persona.created_at).toLocaleDateString()} 생성됨
                                    </p>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-gray-200">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    ← 메인으로 돌아가기
                </Link>
            </div>
        </aside>
    );
}
