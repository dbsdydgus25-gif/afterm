import { ReactNode } from 'react';
import ChatSidebar from '@/components/ai-chat/ChatSidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AiChatLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 사용자의 모든 페르소나 목록 가져오기 (사이드바용)
    const { data: personas } = await supabase
        .from('ai_personas')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="flex h-screen bg-white">
            {/* 사이드바 (채팅 목록) */}
            <ChatSidebar personas={personas || []} />

            {/* 메인 콘텐츠 (채팅창 또는 설정화면) */}
            <main className="flex-1 relative h-full overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
