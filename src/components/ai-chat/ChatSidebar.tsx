'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlusCircle, MessageSquare, Menu, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Persona {
    id: string;
    name: string;
    created_at: string;
}

interface ChatSidebarProps {
    personas: Persona[];
}

export default function ChatSidebar({ personas }: ChatSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleDelete = async (e: React.MouseEvent, personaId: string, personaName: string) => {
        e.preventDefault(); // Link 이동 방지
        e.stopPropagation();

        if (!confirm(`정말로 '${personaName}' 채팅방을 삭제하시겠습니까?\n삭제된 대화 내용은 복구할 수 없습니다.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/ai-chat/delete-persona?id=${personaId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            alert('채팅방이 삭제되었습니다.');
            router.refresh(); // 목록 새로고침

            // 만약 현재 보고 있는 채팅방을 삭제했다면 메인으로 이동
            if (pathname.includes(personaId)) {
                router.push('/ai-chat');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <>
            {/* 모바일 햄버거 메뉴 버튼 */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSidebar}
                    className="bg-white shadow-md"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
            </div>

            {/* 오버레이 (모바일에서 사이드바 열렸을 때 배경 어둡게) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-80 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col h-full",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b border-gray-200 pt-16 md:pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <span className="text-xl font-black tracking-tighter text-blue-600">
                                AFTERM
                            </span>
                            <span className="text-sm font-bold text-gray-400">
                                AI 추모 채팅
                            </span>
                        </Link>
                    </div>

                    <Link href="/ai-chat/setup" onClick={() => setIsOpen(false)}>
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
                                <div key={persona.id} className="relative group">
                                    <Link
                                        href={`/ai-chat/${persona.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg transition-colors pr-10", // pr-10 for delete button space
                                            isActive
                                                ? "bg-white shadow-sm border border-indigo-100 text-indigo-900"
                                                : "hover:bg-white hover:shadow-sm text-gray-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border shrink-0",
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

                                    {/* 삭제 버튼 (호버 시에만 표시) */}
                                    <button
                                        onClick={(e) => handleDelete(e, persona.id, persona.name)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="채팅 삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 safe-area-bottom">
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2">
                        ← 메인으로 돌아가기
                    </Link>
                </div>
            </aside>
        </>
    );
}
