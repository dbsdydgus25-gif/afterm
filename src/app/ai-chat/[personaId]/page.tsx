import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/components/ai-chat/ChatInterface';

interface PageProps {
    params: Promise<{
        personaId: string;
    }>;
}

export default async function AiChatPage({ params }: PageProps) {
    const supabase = await createClient();
    const { personaId } = await params;

    // 1. 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 2. AI Persona 정보 가져오기
    const { data: persona, error: personaError } = await supabase
        .from('ai_personas')
        .select('*')
        .eq('id', personaId)
        .single();

    if (personaError || !persona) {
        // 페르소나가 없거나 접근 권한이 없음 (RLS)
        redirect('/ai-chat');
    }

    // 3. 권한 체크 (본인 소유인지)
    // RLS가 처리하지만, 명시적으로 체크할 수도 있음. 여기선 RLS에 맡김.

    // 4. 대화 내역 가져오기
    const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('persona_id', persona.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    return (
        <div className="h-full flex flex-col">
            <ChatInterface
                personaId={persona.id}
                initialMessages={messages || []}
                personaName={persona.name}
            // memorialId는 전달하지 않음 (Standalone 모드)
            />
        </div>
    );
}
